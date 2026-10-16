import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, AlertTriangle, CheckCircle2, Calendar, ShieldAlert } from 'lucide-react-native';
import { AppLanguage } from '../types';
import { t } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';

interface CropCardProps {
  crop: any;
  language?: AppLanguage;
  onPress?: () => void;
  onDelete?: () => void;
}

export const CropCard: React.FC<CropCardProps> = ({
  crop,
  language = 'en',
  onPress,
}) => {
  const { colors, isDark } = useTheme();
  const hasPlantedDate = !!crop.planted_date || !!crop.plantedDate;
  const percentComplete = crop.percent_complete ?? crop.percentComplete;
  const stageKey = crop.stage_key || crop.stageKey || crop.reported_stage || crop.reportedStage;
  const status = crop.status || 'on_track';
  const latestIssue = crop.latest_issue || crop.latestIssue;
  const acreage = crop.acreage;

  const getStageTitle = (): string => {
    if (!stageKey) return 'Standard';
    const translationKey = `stage.${stageKey.toLowerCase()}`;
    const translated = t(translationKey, language);
    if (translated !== translationKey) return translated;
    return stageKey.charAt(0).toUpperCase() + stageKey.slice(1);
  };

  const getLocalizedCropName = (): string => {
    if (language === 'hi' && (crop.hindi_name || crop.hindiName)) {
      return crop.hindi_name || crop.hindiName;
    }
    return crop.name;
  };

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
      onPress={onPress}
    >
      {/* 1. Header Row */}
      <View style={styles.header}>
        <View style={styles.cropInfo}>
          <Text style={styles.cropIcon}>{crop.icon || '🌱'}</Text>
          <View>
            <Text style={[styles.cropName, { color: colors.textPrimary }]}>
              {getLocalizedCropName()}
            </Text>
            <Text style={[styles.varietyText, { color: colors.textSecondary }]}>
              {crop.variety || 'Standard Variety'}
            </Text>
          </View>
        </View>

        {/* Dynamic Status Badge (Needs Care vs On Track) */}
        {status === 'needs_care' ? (
          <View style={[styles.statusBadge, styles.statusNeedsCare]}>
            <AlertTriangle size={12} color="#DC2626" />
            <Text style={styles.statusTextNeedsCare}>{t('crop.needsCare', language)}</Text>
          </View>
        ) : (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isDark ? '#1A3320' : '#DCFCE7' },
            ]}
          >
            <CheckCircle2 size={12} color={colors.primary} />
            <Text style={[styles.statusTextOnTrack, { color: colors.primary }]}>
              {t('crop.onTrack', language)}
            </Text>
          </View>
        )}
      </View>

      {/* 2. Growth Stage Progress or "Planted: not set" */}
      <View style={styles.progressSection}>
        {hasPlantedDate && percentComplete !== undefined && percentComplete !== null ? (
          <>
            <View style={styles.progressHeader}>
              <Text style={[styles.stageLabel, { color: colors.textSecondary }]}>
                {t('home.stage', language)}:{' '}
                <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                  {getStageTitle()}
                </Text>
              </Text>
              <Text style={[styles.progressPercent, { color: colors.primary }]}>
                {percentComplete}%
              </Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: colors.pillBg }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(percentComplete, 100)}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
          </>
        ) : (
          <View style={[styles.unplantedNotice, { backgroundColor: colors.pillBg, borderColor: colors.border }]}>
            <Calendar size={13} color={colors.textMuted} />
            <Text style={[styles.unplantedText, { color: colors.textSecondary }]}>
              {t('crop.notPlantedYet', language)}
            </Text>
          </View>
        )}
      </View>

      {/* 3. Latest Issue Alert Banner (if any) */}
      {latestIssue && !latestIssue.resolved && (
        <View style={styles.issueBanner}>
          <ShieldAlert size={14} color="#B91C1C" />
          <Text style={styles.issueText} numberOfLines={1}>
            Issue: {latestIssue.disease_name} ({latestIssue.severity})
          </Text>
        </View>
      )}

      {/* 4. Footer Row */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.metaRow}>
          {acreage ? (
            <>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{acreage} Acres</Text>
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
            </>
          ) : null}
          {crop.days_since_planted !== undefined && crop.days_since_planted !== null ? (
            <>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {crop.days_since_planted}d growing
              </Text>
              <Text style={[styles.metaDot, { color: colors.textMuted }]}>•</Text>
            </>
          ) : null}
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {(crop.tasks || []).length} Tasks
          </Text>
        </View>

        <ChevronRight size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cropInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cropIcon: {
    fontSize: 26,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '800',
  },
  varietyText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  statusNeedsCare: {
    backgroundColor: '#FEE2E2',
  },
  statusTextNeedsCare: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  statusTextOnTrack: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressSection: {
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stageLabel: {
    fontSize: 12,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  unplantedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  unplantedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  issueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  issueText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '700',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaDot: {
    marginHorizontal: 6,
  },
});
