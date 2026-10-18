import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  CloudRain,
  Wind,
  Droplet,
  ShieldCheck,
  MapPin,
  RefreshCw,
  Info,
  Thermometer,
  Layers,
} from 'lucide-react-native';
import { WeatherPayload } from '../services/weatherService';
import { AppLanguage } from '../types';
import { useTheme } from '../context/ThemeContext';

interface WeatherAdvisoryModalProps {
  visible: boolean;
  language?: AppLanguage;
  weatherData: WeatherPayload | null;
  activeCropName?: string;
  isRefreshingGps?: boolean;
  onRefreshGps?: () => void;
  onClose: () => void;
}

export const WeatherAdvisoryModal: React.FC<WeatherAdvisoryModalProps> = ({
  visible,
  language = 'en',
  weatherData,
  activeCropName = 'Tomato',
  isRefreshingGps = false,
  onRefreshGps,
  onClose,
}) => {
  const { colors, isDark } = useTheme();

  if (!weatherData) return null;

  const isRainyAlert = weatherData.maxRainProb >= 50;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1E293B' : '#DBEAFE' }]}>
                <CloudRain size={20} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {language === 'hi' ? 'मौसम व छिड़काव परामर्श' : 'Weather & Spray Advisory'}
                </Text>
                <View style={styles.locRow}>
                  <MapPin size={12} color={colors.primary} />
                  <Text style={[styles.locText, { color: colors.textSecondary }]}>
                    {weatherData.locationName}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              {onRefreshGps && (
                <Pressable
                  style={[styles.refreshGpsBtn, { backgroundColor: colors.pillBg }]}
                  onPress={onRefreshGps}
                  disabled={isRefreshingGps}
                >
                  {isRefreshingGps ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <RefreshCw size={12} color={colors.primary} />
                      <Text style={[styles.refreshGpsText, { color: colors.primary }]}>
                        GPS
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              <Pressable style={styles.closeBtn} onPress={onClose}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Live Weather Metrics Header Card */}
            <View style={[styles.liveMetricsCard, { backgroundColor: colors.pillBg, borderColor: colors.border }]}>
              <View style={styles.liveTempRow}>
                <View>
                  <Text style={[styles.liveTempText, { color: colors.textPrimary }]}>
                    {weatherData.temperature}°C
                  </Text>
                  <Text style={[styles.liveConditionText, { color: colors.textSecondary }]}>
                    {weatherData.conditionLabel}
                  </Text>
                </View>
                <Text style={{ fontSize: 38 }}>
                  {isRainyAlert ? '🌧️' : '⛅'}
                </Text>
              </View>

              <View style={styles.metricsDetailGrid}>
                <View style={styles.metricItem}>
                  <Droplet size={14} color="#2563EB" />
                  <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                    Humidity {weatherData.humidity}%
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Wind size={14} color="#059669" />
                  <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                    Wind {weatherData.windSpeed} km/h
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Thermometer size={14} color="#D97706" />
                  <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                    Soil {weatherData.soilTemperature}°C
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Layers size={14} color="#8B5CF6" />
                  <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                    Moisture {weatherData.soilMoisture} m³/m³
                  </Text>
                </View>
              </View>
            </View>

            {/* Detailed Blue Spray Advisory Box */}
            <View style={styles.sprayBanner}>
              <View style={styles.sprayBannerTop}>
                <View style={styles.rainBadge}>
                  <CloudRain size={14} color="#1D4ED8" />
                  <Text style={styles.rainBadgeText}>
                    {isRainyAlert
                      ? `Rain Alert (${weatherData.maxRainProb}% prob)`
                      : 'Optimal Spray Window'}
                  </Text>
                </View>
                <Text style={styles.sprayCropBadge}>{activeCropName} • Crop Care</Text>
              </View>

              <Text style={styles.sprayHeadline}>{weatherData.sprayHeadline}</Text>
              <Text style={styles.spraySubheadline}>{weatherData.spraySubheadline}</Text>

              {/* Treatment Dosage Recommendations */}
              <View style={styles.dosageBlock}>
                <View style={styles.dosageRow}>
                  <ShieldCheck size={14} color="#2563EB" style={{ marginTop: 2 }} />
                  <Text style={styles.dosageText}>
                    <Text style={{ fontWeight: '800' }}>Chemical:</Text> {weatherData.recommendedChemical}
                  </Text>
                </View>
                <View style={[styles.dosageRow, { marginTop: 6 }]}>
                  <Droplet size={14} color="#16A34A" style={{ marginTop: 2 }} />
                  <Text style={styles.dosageText}>
                    <Text style={{ fontWeight: '800' }}>Organic:</Text> {weatherData.recommendedOrganic}
                  </Text>
                </View>
              </View>
            </View>

            {/* 7-Day Rain & Spray Calendar (M T W T F S S) */}
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              {language === 'hi' ? '7-दिवसीय वर्षा पूर्वानुमान व स्प्रे कैलेंडर' : '7-Day Rain & Spray Calendar'}
            </Text>

            <View style={styles.calendarGrid}>
              {weatherData.dailyForecasts.map((df, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dayBox,
                    { backgroundColor: colors.pillBg, borderColor: colors.border },
                    df.isHighRisk && styles.dayBoxHighlight,
                  ]}
                >
                  <Text style={[styles.dayName, df.isHighRisk && styles.dayTextHighlight]}>
                    {df.day}
                  </Text>
                  <Text style={{ fontSize: 16, marginVertical: 4 }}>
                    {df.isHighRisk ? '🌧️' : '☀️'}
                  </Text>
                  <Text style={[styles.dayRain, df.isHighRisk && styles.dayRainHighlight]}>
                    {df.rainProb}%
                  </Text>
                  <Text
                    style={[
                      styles.dayTemp,
                      { color: colors.textMuted },
                      df.isHighRisk && { color: '#BFDBFE' },
                    ]}
                  >
                    {df.maxTemp}°
                  </Text>
                </View>
              ))}
            </View>

            {/* Advisory Compliance Disclaimer Note */}
            <View style={styles.disclaimerBox}>
              <Info size={14} color="#92400E" style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={styles.disclaimerText}>
                Open-Meteo IMD radar forecasts refresh every 60 minutes. Always check local wind speeds before foliar application.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  refreshGpsText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  scrollBody: {
    marginTop: 14,
  },
  liveMetricsCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  liveTempRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveTempText: {
    fontSize: 32,
    fontWeight: '800',
  },
  liveConditionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricsDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '46%',
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sprayBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  sprayBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  rainBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  sprayCropBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  sprayHeadline: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
    lineHeight: 20,
  },
  spraySubheadline: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 16,
    marginBottom: 12,
  },
  dosageBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dosageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  dosageText: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayBox: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 2,
  },
  dayBoxHighlight: {
    backgroundColor: '#0047FF',
    borderColor: '#0047FF',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  dayTextHighlight: {
    color: '#FFFFFF',
  },
  dayRain: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3B82F6',
  },
  dayRainHighlight: {
    color: '#BFDBFE',
  },
  dayTemp: {
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
});
