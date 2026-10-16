import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ShieldAlert,
  Sparkles,
  Droplets,
  Leaf,
  FlaskConical,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { getUserCropDetail, updateUserCrop, deleteUserCrop, resolveDiagnosis } from '../services/apiClient';
import { AppLanguage } from '../types';
import { t } from '../constants/translations';
import { THEME } from '../constants/theme';

interface CropDetailModalProps {
  visible: boolean;
  cropId: string | null;
  language?: AppLanguage;
  onClose: () => void;
  onCropUpdated?: () => void;
  onCropDeleted?: () => void;
}

export const CropDetailModal: React.FC<CropDetailModalProps> = ({
  visible,
  cropId,
  language = 'en',
  onClose,
  onCropUpdated,
  onCropDeleted,
}) => {
  const [crop, setCrop] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingDate, setUpdatingDate] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'All' | 'Spraying' | 'Irrigation' | 'Fertilization'>('All');

  useEffect(() => {
    if (visible && cropId) {
      loadCropDetail(cropId);
    } else {
      setCrop(null);
      setErrorMsg(null);
    }
  }, [visible, cropId]);

  const loadCropDetail = async (id: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getUserCropDetail(id);
      setCrop(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load crop details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrop = () => {
    if (!cropId) return;
    Alert.alert(
      t('crop.deleteCrop', language),
      'Are you sure you want to remove this crop from your portfolio?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserCrop(cropId);
              onCropDeleted?.();
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete crop');
            }
          },
        },
      ]
    );
  };

  const handleSetPlantedTiming = async (timing: 'today' | '1week' | '2weeks' | '1month') => {
    if (!cropId) return;
    const now = Date.now();
    let dateStr = new Date(now).toISOString().split('T')[0];
    if (timing === '1week') {
      dateStr = new Date(now - 7 * 86400000).toISOString().split('T')[0];
    } else if (timing === '2weeks') {
      dateStr = new Date(now - 14 * 86400000).toISOString().split('T')[0];
    } else if (timing === '1month') {
      dateStr = new Date(now - 30 * 86400000).toISOString().split('T')[0];
    }

    setUpdatingDate(true);
    try {
      await updateUserCrop(cropId, { planted_date: dateStr });
      await loadCropDetail(cropId);
      onCropUpdated?.();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update planted date');
    } finally {
      setUpdatingDate(false);
    }
  };

  const handleToggleDiagnosisResolve = async (diagnosisId: string, currentResolved: boolean) => {
    try {
      const updated = await resolveDiagnosis(diagnosisId, !currentResolved);
      setCrop((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          diagnoses: (prev.diagnoses || []).map((d: any) =>
            d.id === diagnosisId ? { ...d, resolved: updated.resolved, resolved_at: updated.resolved_at } : d
          ),
          status: updated.resolved ? 'on_track' : 'needs_care',
        };
      });
      onCropUpdated?.();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update issue status');
    }
  };

  const getLocalizedName = (item: any): string => {
    if (!item) return '';
    if (language === 'hi' && item.hindi_name) return item.hindi_name;
    return item.name || item.custom_name || 'Crop';
  };

  const getStageTitle = (key?: string): string => {
    if (!key) return 'Standard';
    const translationKey = `stage.${key.toLowerCase()}`;
    const translated = t(translationKey, language);
    if (translated !== translationKey) return translated;
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  const stagesList = crop?.stages && crop.stages.length > 0
    ? crop.stages
    : [
        { name: 'Vegetative', duration_days: 30 },
        { name: 'Flowering', duration_days: 25 },
        { name: 'Fruiting', duration_days: 35 },
        { name: 'Harvest', duration_days: 15 },
      ];

  const currentStageIndex = stagesList.findIndex((s: any) => {
    const stageName = (s.name || '').toLowerCase();
    const activeKey = (crop?.stage_key || '').toLowerCase();
    return stageName === activeKey || activeKey.includes(stageName);
  });
  const resolvedStageIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  const tasksList = crop?.tasks || [];
  const filteredTasks = taskFilter === 'All'
    ? tasksList
    : tasksList.filter((t: any) => t.task_type === taskFilter || t.type === taskFilter);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Pressable onPress={onClose} style={styles.iconBtn}>
            <X size={22} color={THEME.colors.textPrimary} />
          </Pressable>

          <Text style={styles.headerTitle}>{t('crop.detailTitle', language)}</Text>

          <Pressable onPress={handleDeleteCrop} style={styles.iconBtn}>
            <Trash2 size={20} color="#DC2626" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading crop portfolio record...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.centerContainer}>
            <AlertTriangle size={36} color="#DC2626" />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Pressable style={styles.retryBtn} onPress={() => cropId && loadCropDetail(cropId)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : crop ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Crop Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileTop}>
                <View style={styles.cropIconBox}>
                  <Text style={{ fontSize: 32 }}>{crop.icon || '🌱'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropName}>{getLocalizedName(crop)}</Text>
                  <Text style={styles.cropVariety}>{crop.variety || 'Standard Variety'}</Text>
                  <View style={styles.pillRow}>
                    {crop.acreage ? (
                      <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>{crop.acreage} Acres</Text>
                      </View>
                    ) : null}
                    <View style={styles.sourcePill}>
                      <Text style={styles.sourcePillText}>
                        {crop.source === 'diagnosis' ? 'AI Scan' : crop.source === 'voice' ? 'Voice' : 'Manual'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Status Badge */}
                {crop.status === 'needs_care' ? (
                  <View style={[styles.statusBadge, styles.statusNeedsCare]}>
                    <AlertTriangle size={13} color="#DC2626" />
                    <Text style={styles.statusTextNeedsCare}>{t('crop.needsCare', language)}</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.statusOnTrack]}>
                    <CheckCircle2 size={13} color="#16A34A" />
                    <Text style={styles.statusTextOnTrack}>{t('crop.onTrack', language)}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 2. Timeline & Growth Stage Card */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('crop.timeline', language)}</Text>
                {crop.planted_date && (
                  <Text style={styles.plantedDateText}>Planted: {crop.planted_date}</Text>
                )}
              </View>

              {crop.planted_date ? (
                <>
                  <View style={styles.progressSummary}>
                    <View>
                      <Text style={styles.progressBigText}>
                        {getStageTitle(crop.stage_key || crop.reported_stage)}
                      </Text>
                      <Text style={styles.progressSubText}>
                        {crop.days_since_planted !== null ? `${crop.days_since_planted} days growing` : ''}
                        {crop.days_to_harvest !== null && crop.days_to_harvest !== undefined
                          ? ` • ${crop.days_to_harvest} ${t('crop.daysRemaining', language)}`
                          : ''}
                      </Text>
                    </View>
                    <View style={styles.percentCircle}>
                      <Text style={styles.percentNumber}>{crop.percent_complete ?? 0}%</Text>
                    </View>
                  </View>

                  {/* Stage Stepper Visualization */}
                  <View style={styles.stepperContainer}>
                    <View style={styles.stepperTrack} />
                    <View
                      style={[
                        styles.stepperFill,
                        {
                          width: `${Math.max(
                            8,
                            (resolvedStageIndex / Math.max(1, stagesList.length - 1)) * 100
                          )}%`,
                        },
                      ]}
                    />

                    <View style={styles.stepperNodes}>
                      {stagesList.map((stg: any, idx: number) => {
                        const isPassed = idx < resolvedStageIndex;
                        const isCurrent = idx === resolvedStageIndex;
                        const stageLabel = stg.name || `Stage ${idx + 1}`;

                        return (
                          <View key={idx} style={styles.stepperNode}>
                            <View
                              style={[
                                styles.stepperCircle,
                                isCurrent && styles.stepperCircleCurrent,
                                isPassed && styles.stepperCirclePassed,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.stepperNum,
                                  (isCurrent || isPassed) && styles.stepperNumActive,
                                ]}
                              >
                                {isPassed ? '✓' : idx + 1}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.stepperLabel,
                                isCurrent && styles.stepperLabelCurrent,
                                isPassed && styles.stepperLabelPassed,
                              ]}
                              numberOfLines={1}
                            >
                              {stageLabel}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </>
              ) : (
                /* Unplanted Notice + Quick Timing Picker */
                <View style={styles.unplantedBox}>
                  <View style={styles.unplantedHeader}>
                    <Calendar size={18} color="#D97706" />
                    <Text style={styles.unplantedTitle}>{t('crop.notPlantedYet', language)}</Text>
                  </View>
                  <Text style={styles.unplantedDesc}>
                    When did you sow or plant this crop? Setting the date automatically calculates growth stages and harvest time.
                  </Text>

                  {updatingDate ? (
                    <ActivityIndicator color={THEME.colors.primary} style={{ marginVertical: 12 }} />
                  ) : (
                    <View style={styles.timingChipsRow}>
                      <Pressable style={styles.timingChip} onPress={() => handleSetPlantedTiming('today')}>
                        <Text style={styles.timingChipText}>Today</Text>
                      </Pressable>
                      <Pressable style={styles.timingChip} onPress={() => handleSetPlantedTiming('1week')}>
                        <Text style={styles.timingChipText}>1 week ago</Text>
                      </Pressable>
                      <Pressable style={styles.timingChip} onPress={() => handleSetPlantedTiming('2weeks')}>
                        <Text style={styles.timingChipText}>2 weeks ago</Text>
                      </Pressable>
                      <Pressable style={styles.timingChip} onPress={() => handleSetPlantedTiming('1month')}>
                        <Text style={styles.timingChipText}>1 month ago</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* 3. Actionable Care Tasks */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('crop.tasksTitle', language)}</Text>

                <View style={styles.taskFilterRow}>
                  {(['All', 'Spraying', 'Irrigation', 'Fertilization'] as const).map((filter) => {
                    const isSelected = taskFilter === filter;
                    return (
                      <Pressable
                        key={filter}
                        style={[styles.taskFilterChip, isSelected && styles.taskFilterChipActive]}
                        onPress={() => setTaskFilter(filter)}
                      >
                        <Text
                          style={[
                            styles.taskFilterText,
                            isSelected && styles.taskFilterTextActive,
                          ]}
                        >
                          {filter === 'Fertilization' ? 'Fertilizer' : filter}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {filteredTasks.length === 0 ? (
                <View style={styles.emptyTasksBox}>
                  <Text style={styles.emptyTasksText}>No tasks pending for this category.</Text>
                </View>
              ) : (
                filteredTasks.map((task: any) => {
                  const isCompleted = !!task.completed;
                  return (
                    <View
                      key={task.id}
                      style={[styles.taskItem, isCompleted && styles.taskItemCompleted]}
                    >
                      <Pressable
                        style={styles.taskCheckbox}
                        onPress={() => {
                          setCrop((prev: any) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              tasks: (prev.tasks || []).map((t: any) =>
                                t.id === task.id ? { ...t, completed: !t.completed } : t
                              ),
                            };
                          });
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={20} color="#16A34A" />
                        ) : (
                          <Circle size={20} color="#94A3B8" />
                        )}
                      </Pressable>

                      <View style={{ flex: 1 }}>
                        <View style={styles.taskMetaRow}>
                          <View
                            style={[
                              styles.priorityTag,
                              task.priority === 'High'
                                ? styles.priorityTagHigh
                                : styles.priorityTagMedium,
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityTagText,
                                task.priority === 'High'
                                  ? styles.priorityTagTextHigh
                                  : styles.priorityTagTextMedium,
                              ]}
                            >
                              {task.priority || 'Medium'}
                            </Text>
                          </View>
                          {task.task_type && <Text style={styles.taskMetaTag}>• {task.task_type}</Text>}
                        </View>

                        <Text style={[styles.taskItemTitle, isCompleted && styles.taskItemTitleCompleted]}>
                          {language === 'hi' && task.hindi_title
                            ? task.hindi_title
                            : task.title}
                        </Text>

                        {task.notes && (
                          <Text style={styles.taskItemNotes}>⚠️ {task.notes}</Text>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* 4. Health & Pathology History */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('crop.diagnosesTitle', language)}</Text>
                <Text style={styles.diagnosesCountText}>
                  {(crop.diagnoses || []).length} records
                </Text>
              </View>

              {(!crop.diagnoses || crop.diagnoses.length === 0) ? (
                <View style={styles.emptyDiagnosisBox}>
                  <Leaf size={24} color="#16A34A" />
                  <Text style={styles.emptyDiagnosisTitle}>No Diseases or Pathogens Recorded</Text>
                  <Text style={styles.emptyDiagnosisSub}>
                    Foliage appears in healthy condition. Use the AI Leaf Scanner whenever you notice curled leaves or spots.
                  </Text>
                </View>
              ) : (
                crop.diagnoses.map((diag: any) => {
                  const isResolved = !!diag.resolved;
                  const displayImage = diag.signed_image_url || diag.image_url;

                  return (
                    <View key={diag.id} style={styles.diagnosisCard}>
                      <View style={styles.diagnosisCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.diseaseTitle}>{diag.disease_name}</Text>
                          {diag.scientific_name ? (
                            <Text style={styles.diseaseScientific}>{diag.scientific_name}</Text>
                          ) : null}
                        </View>

                        <View
                          style={[
                            styles.severityBadge,
                            diag.severity === 'Severe'
                              ? styles.severityBadgeSevere
                              : styles.severityBadgeModerate,
                          ]}
                        >
                          <Text
                            style={[
                              styles.severityBadgeText,
                              diag.severity === 'Severe'
                                ? styles.severityBadgeTextSevere
                                : styles.severityBadgeTextModerate,
                            ]}
                          >
                            {diag.severity}
                          </Text>
                        </View>
                      </View>

                      {/* Specimen Leaf Image if uploaded */}
                      {displayImage ? (
                        <Image source={{ uri: displayImage }} style={styles.diagnosisImage} resizeMode="cover" />
                      ) : null}

                      {/* Symptoms & ICAR Treatments */}
                      {diag.symptoms && diag.symptoms.length > 0 && (
                        <View style={styles.remedyBox}>
                          <Text style={styles.remedyHeader}>Diagnostic Symptoms:</Text>
                          <Text style={styles.remedyBody}>
                            {diag.symptoms.slice(0, 3).join(' • ')}
                          </Text>
                        </View>
                      )}

                      {diag.organic_remedies && diag.organic_remedies.length > 0 && (
                        <View style={[styles.remedyBox, { backgroundColor: '#F0FDF4' }]}>
                          <Text style={[styles.remedyHeader, { color: '#16A34A' }]}>
                            Organic & Biological Remedy:
                          </Text>
                          <Text style={styles.remedyBody}>
                            {diag.organic_remedies.slice(0, 2).join(' • ')}
                          </Text>
                        </View>
                      )}

                      {/* Resolution Toggle Button */}
                      <View style={styles.diagnosisCardFooter}>
                        <View style={styles.statusIndicator}>
                          {isResolved ? (
                            <View style={styles.resolvedPill}>
                              <CheckCircle2 size={12} color="#16A34A" />
                              <Text style={styles.resolvedPillText}>Issue Resolved</Text>
                            </View>
                          ) : (
                            <View style={styles.activePill}>
                              <AlertTriangle size={12} color="#DC2626" />
                              <Text style={styles.activePillText}>Active Problem</Text>
                            </View>
                          )}
                        </View>

                        <Pressable
                          style={[
                            styles.resolveBtn,
                            isResolved && styles.resolveBtnActive,
                          ]}
                          onPress={() => handleToggleDiagnosisResolve(diag.id, isResolved)}
                        >
                          <Text
                            style={[
                              styles.resolveBtnText,
                              isResolved && styles.resolveBtnTextActive,
                            ]}
                          >
                            {isResolved
                              ? t('crop.markActive', language)
                              : t('crop.markResolved', language)}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F5',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8DE',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: THEME.colors.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8DE',
    marginBottom: 14,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cropIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropName: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  cropVariety: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  sourcePill: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
  },
  statusNeedsCare: {
    backgroundColor: '#FEE2E2',
  },
  statusOnTrack: {
    backgroundColor: '#DCFCE7',
  },
  statusTextNeedsCare: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  statusTextOnTrack: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8DE',
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  plantedDateText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  progressSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF5',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  progressBigText: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  progressSubText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  percentCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.primary,
  },
  percentNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  stepperContainer: {
    position: 'relative',
    paddingTop: 10,
    paddingBottom: 4,
  },
  stepperTrack: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: '#E2E8DE',
  },
  stepperFill: {
    position: 'absolute',
    top: 24,
    left: 20,
    height: 3,
    backgroundColor: THEME.colors.primary,
  },
  stepperNodes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperNode: {
    alignItems: 'center',
    width: 68,
  },
  stepperCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepperCircleCurrent: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#E8F5E9',
    borderWidth: 3,
  },
  stepperCirclePassed: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primary,
  },
  stepperNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepperNumActive: {
    color: '#FFFFFF',
  },
  stepperLabel: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
  },
  stepperLabelCurrent: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  stepperLabelPassed: {
    color: THEME.colors.textPrimary,
  },
  unplantedBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  unplantedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  unplantedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  unplantedDesc: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 12,
  },
  timingChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timingChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timingChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  taskFilterRow: {
    flexDirection: 'row',
    gap: 4,
  },
  taskFilterChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  taskFilterChipActive: {
    backgroundColor: THEME.colors.primary,
  },
  taskFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  taskFilterTextActive: {
    color: '#FFFFFF',
  },
  emptyTasksBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAF5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8DE',
  },
  taskItemCompleted: {
    opacity: 0.6,
  },
  taskCheckbox: {
    marginRight: 10,
    marginTop: 2,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  priorityTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  priorityTagHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityTagMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityTagTextHigh: {
    color: '#DC2626',
  },
  priorityTagTextMedium: {
    color: '#D97706',
  },
  taskMetaTag: {
    fontSize: 11,
    color: THEME.colors.textMuted,
  },
  taskItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  taskItemTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  taskItemNotes: {
    fontSize: 11,
    color: '#D97706',
    marginTop: 4,
  },
  diagnosesCountText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  emptyDiagnosisBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  emptyDiagnosisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginTop: 8,
  },
  emptyDiagnosisSub: {
    fontSize: 12,
    color: '#15803D',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  diagnosisCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  diagnosisCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  diseaseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  diseaseScientific: {
    fontSize: 12,
    fontStyle: 'italic',
    color: THEME.colors.textSecondary,
    marginTop: 1,
  },
  severityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  severityBadgeSevere: {
    backgroundColor: '#FEE2E2',
  },
  severityBadgeModerate: {
    backgroundColor: '#FEF3C7',
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  severityBadgeTextSevere: {
    color: '#DC2626',
  },
  severityBadgeTextModerate: {
    color: '#D97706',
  },
  diagnosisImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginVertical: 8,
  },
  remedyBox: {
    backgroundColor: '#F5F5F4',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  remedyHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#57534E',
    marginBottom: 2,
  },
  remedyBody: {
    fontSize: 12,
    color: '#292524',
    lineHeight: 16,
  },
  diagnosisCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
  },
  statusIndicator: {},
  resolvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resolvedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  resolveBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  resolveBtnActive: {
    backgroundColor: '#64748B',
  },
  resolveBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  resolveBtnTextActive: {
    color: '#FFFFFF',
  },
});
