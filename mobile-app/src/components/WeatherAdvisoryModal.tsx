import React, { useState, useEffect } from 'react';
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
  Calendar,
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

function getWMOConditionLabel(code: number, lang: AppLanguage = 'en'): string {
  if (code === 0) return lang === 'hi' ? 'साफ आसमान' : 'Clear Sky';
  if (code >= 1 && code <= 3) return lang === 'hi' ? 'आंशिक रूप से बादल' : 'Partly Cloudy';
  if (code >= 45 && code <= 48) return lang === 'hi' ? 'कोहरा' : 'Foggy';
  if (code >= 51 && code <= 57) return lang === 'hi' ? 'हल्की बूंदाबांदी' : 'Light Drizzle';
  if (code >= 61 && code <= 67) return lang === 'hi' ? 'मध्यम वर्षा' : 'Moderate Rain';
  if (code >= 80 && code <= 82) return lang === 'hi' ? 'वर्षा की बौछारें' : 'Rain Showers';
  if (code >= 95) return lang === 'hi' ? 'गरज के साथ बारिश' : 'Thunderstorm';
  return lang === 'hi' ? 'आंशिक रूप से बादल' : 'Partly Cloudy';
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
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  useEffect(() => {
    if (visible && weatherData?.dailyForecasts?.length) {
      // Default to first high-risk rain day or today (0)
      const highRiskIdx = weatherData.dailyForecasts.findIndex((df) => df.rainProb >= 50);
      setSelectedDayIdx(highRiskIdx >= 0 ? highRiskIdx : 0);
    }
  }, [visible, weatherData]);

  if (!weatherData) return null;

  const dailyForecasts = weatherData.dailyForecasts || [];
  const selectedDay = dailyForecasts[selectedDayIdx] || dailyForecasts[0] || {
    day: 'M',
    fullDayName: 'Today',
    dateStr: '',
    rainProb: weatherData.maxRainProb,
    precipitationMm: 0,
    maxTemp: weatherData.temperature,
    minTemp: weatherData.temperature - 8,
    isHighRisk: weatherData.maxRainProb >= 50,
    weatherCode: weatherData.weatherCode,
  };

  const isSelectedRainy = selectedDay.rainProb >= 50;
  const conditionText = getWMOConditionLabel(selectedDay.weatherCode, language);

  // Dynamic Spray Advisory Headline & Subheadline for Selected Day
  let dayHeadline = '';
  let daySubheadline = '';

  if (isSelectedRainy) {
    dayHeadline = language === 'hi'
      ? `${selectedDay.fullDayName} को बारिश की संभावना (${selectedDay.rainProb}%)। छिड़काव स्थगित करें।`
      : `Rain expected on ${selectedDay.fullDayName} (${selectedDay.rainProb}% prob). Delay foliar spray.`;
    daySubheadline = language === 'hi'
      ? `राडार चेतावनी: ${selectedDay.precipitationMm || 5} मिमी वर्षा का अनुमान। छिड़काव से रसायन बहने का जोखिम।`
      : `Radar alert: ${selectedDay.precipitationMm || 5}mm expected precipitation on ${selectedDay.fullDayName}. Spraying may result in chemical wash-off.`;
  } else {
    dayHeadline = language === 'hi'
      ? `${selectedDay.fullDayName} को उत्तम छिड़काव का समय। कम वर्षा जोखिम (${selectedDay.rainProb}%)।`
      : `Ideal Spraying Window on ${selectedDay.fullDayName}. Low rain risk (${selectedDay.rainProb}%).`;
    daySubheadline = language === 'hi'
      ? `अनुकूल मौसम: घोल के अवशोषण के लिए बेहतरीन स्थितियां।`
      : `Clear skies with low rain risk. Excellent absorption window for foliar sprays.`;
  }

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
            {/* Live Weather Metrics Header Card for Selected Day */}
            <View style={[styles.liveMetricsCard, { backgroundColor: colors.pillBg, borderColor: colors.border }]}>
              <View style={styles.liveTempRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={[styles.liveTempText, { color: colors.textPrimary }]}>
                      {selectedDay.maxTemp}°C
                    </Text>
                    <Text style={[styles.dayBadgeText, { color: colors.primary }]}>
                      • {selectedDay.fullDayName}
                    </Text>
                  </View>
                  <Text style={[styles.liveConditionText, { color: colors.textSecondary }]}>
                    {conditionText} • Low {selectedDay.minTemp}°C
                  </Text>
                </View>
                <Text style={{ fontSize: 38 }}>
                  {isSelectedRainy ? '🌧️' : selectedDay.rainProb >= 25 ? '⛅' : '☀️'}
                </Text>
              </View>

              <View style={styles.metricsDetailGrid}>
                <View style={styles.metricItem}>
                  <Droplet size={14} color="#2563EB" />
                  <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                    Rain Prob {selectedDay.rainProb}%
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <CloudRain size={14} color="#2563EB" />
                  <Text style={[styles.metricText, { color: colors.textSecondary }]}>
                    Precip {selectedDay.precipitationMm} mm
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
              </View>
            </View>

            {/* Detailed Blue Spray Advisory Box for Selected Day */}
            <View style={styles.sprayBanner}>
              <View style={styles.sprayBannerTop}>
                <View style={styles.rainBadge}>
                  <CloudRain size={14} color="#1D4ED8" />
                  <Text style={styles.rainBadgeText}>
                    {isSelectedRainy
                      ? `Rain Alert (${selectedDay.rainProb}% prob)`
                      : 'Optimal Spray Window'}
                  </Text>
                </View>
                <Text style={styles.sprayCropBadge}>{activeCropName} • Crop Care</Text>
              </View>

              <Text style={styles.sprayHeadline}>{dayHeadline}</Text>
              <Text style={styles.spraySubheadline}>{daySubheadline}</Text>

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

            {/* Interactive 7-Day Rain & Spray Calendar */}
            <View style={styles.calendarHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                {language === 'hi' ? '7-दिवसीय वर्षा पूर्वानुमान व स्प्रे कैलेंडर' : '7-Day Rain & Spray Calendar'}
              </Text>
              <Text style={[styles.tapHintText, { color: colors.primary }]}>
                {language === 'hi' ? 'दिन पर टैप करें →' : 'Tap day to view →'}
              </Text>
            </View>

            <View style={styles.calendarGrid}>
              {dailyForecasts.map((df, idx) => {
                const isSelected = idx === selectedDayIdx;
                const isHighRisk = df.rainProb >= 50;

                return (
                  <Pressable
                    key={idx}
                    style={[
                      styles.dayBox,
                      { backgroundColor: colors.pillBg, borderColor: colors.border },
                      isHighRisk && styles.dayBoxHighRisk,
                      isSelected && [styles.dayBoxSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
                    ]}
                    onPress={() => setSelectedDayIdx(idx)}
                  >
                    <Text
                      style={[
                        styles.dayName,
                        { color: colors.textPrimary },
                        isHighRisk && styles.dayNameHighRisk,
                        isSelected && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {df.day}
                    </Text>
                    <Text style={{ fontSize: 16, marginVertical: 4 }}>
                      {df.rainProb >= 50 ? '🌧️' : df.rainProb >= 25 ? '⛅' : '☀️'}
                    </Text>
                    <Text
                      style={[
                        styles.dayRain,
                        { color: colors.textSecondary },
                        isHighRisk && styles.dayRainHighRisk,
                        isSelected && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {df.rainProb}%
                    </Text>
                    <Text
                      style={[
                        styles.dayTemp,
                        { color: colors.textMuted },
                        isHighRisk && { color: '#BFDBFE' },
                        isSelected && { color: 'rgba(255,255,255,0.85)' },
                      ]}
                    >
                      {df.maxTemp}°
                    </Text>
                  </Pressable>
                );
              })}
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
  dayBadgeText: {
    fontSize: 13,
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
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  tapHintText: {
    fontSize: 11,
    fontWeight: '700',
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
    borderWidth: 1.5,
    flex: 1,
    marginHorizontal: 2,
  },
  dayBoxHighRisk: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  dayBoxSelected: {
    transform: [{ scale: 1.05 }],
  },
  dayName: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayNameHighRisk: {
    color: '#1D4ED8',
  },
  dayRain: {
    fontSize: 10,
    fontWeight: '800',
  },
  dayRainHighRisk: {
    color: '#1D4ED8',
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
