import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  Leaf,
  FlaskConical,
  X,
  Plus,
  Calendar,
} from 'lucide-react-native';
import { CropGrowthStage, CropItem, CareTask, AppLanguage, PathologySpecimen } from '../types';
import { PATHOLOGY_SPECIMENS } from '../data/mockData';
import { getUserCrops } from '../services/apiClient';
import { CropDetailModal } from '../components/CropDetailModal';
import { t } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { THEME } from '../constants/theme';

interface CropScreenProps {
  crops?: CropItem[];
  language?: AppLanguage;
  onOpenScanner: () => void;
  onOpenAddCrop?: () => void;
}

export type DoctorScreenProps = CropScreenProps;

export const CropScreen: React.FC<CropScreenProps> = ({
  crops: initialCrops,
  language = 'hi',
  onOpenScanner,
  onOpenAddCrop,
}) => {
  const { colors, isDark } = useTheme();
  const [cropsList, setCropsList] = useState<any[]>(
    initialCrops && initialCrops.length > 0 ? initialCrops : []
  );
  const [loading, setLoading] = useState<boolean>(!initialCrops || initialCrops.length === 0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(
    initialCrops && initialCrops.length > 0 ? initialCrops[0].id : null
  );
  const [taskFilter, setTaskFilter] = useState<'All' | 'Spraying' | 'Irrigation' | 'Fertilization'>('All');
  const [selectedSpecimen, setSelectedSpecimen] = useState<PathologySpecimen | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCropForDetail, setSelectedCropForDetail] = useState<string | null>(null);

  const fetchCrops = useCallback(async () => {
    try {
      const res = await getUserCrops();
      if (Array.isArray(res)) {
        setCropsList(res);
        if (res.length > 0 && !selectedCropId) {
          setSelectedCropId(res[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not fetch user crops:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCropId]);

  useEffect(() => {
    fetchCrops();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCrops();
  };

  const activeCrop = cropsList.find((c) => c.id === selectedCropId) || cropsList[0];
  const stages: CropGrowthStage[] = ['Vegetative', 'Flowering', 'Fruiting', 'Harvesting'];

  const getTranslatedStage = (key?: string): string => {
    if (!key) return 'Vegetative';
    const translationKey = `stage.${key.toLowerCase()}`;
    const translated = t(translationKey, language);
    if (translated !== translationKey) return translated;
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  const currentStageIndex = activeCrop
    ? Math.max(0, stages.findIndex(s => s.toLowerCase() === (activeCrop.stage_key || activeCrop.stage || '').toLowerCase()))
    : 0;

  const rawTasks = activeCrop ? (activeCrop.tasks || []) : [];
  const filteredTasks = taskFilter === 'All'
    ? rawTasks
    : rawTasks.filter((t: any) => (t.task_type || t.type) === taskFilter);

  const handleToggleTask = (cropId: string, taskId: string) => {
    setCropsList((prev) =>
      prev.map((c) => {
        if (c.id !== cropId) return c;
        return {
          ...c,
          tasks: (c.tasks || []).map((t: any) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        };
      })
    );
  };

  const getLocalizedCropName = (crop: any): string => {
    if (!crop) return '';
    if (language === 'hi' && crop.hindi_name) return crop.hindi_name;
    return crop.name || crop.custom_name || 'Crop';
  };

  const getTaskTitle = (task: any) => {
    if (language === 'hi' && task.hindi_title) return task.hindi_title;
    return task.title || '';
  };

  const handleOpenDetail = (cropId: string) => {
    setSelectedCropForDetail(cropId);
    setDetailModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 1. Header Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('crop.headerTitle', language)}</Text>
        </View>

        {/* 2. Hero Scanner Card */}
        <Pressable
          style={[styles.heroCard, { backgroundColor: colors.primary }]}
          onPress={onOpenScanner}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroPill}>
              <Sparkles size={13} color="#7CDE3D" />
              <Text style={styles.heroPillText}>AI Leaf Scanner</Text>
            </View>
            <Text style={styles.heroTapText}>Tap to open →</Text>
          </View>

          <Text style={styles.heroTitle}>Notice yellowing or curled leaves?</Text>

          <View style={styles.heroBottom}>
            <Text style={styles.heroSubtitle}>
              Point camera at affected foliage for instant pathology identification and ICAR remedies.
            </Text>

            <View style={styles.heroCameraCircle}>
              <Camera size={20} color={colors.primaryDark} />
            </View>
          </View>
        </Pressable>

        {/* 3. Active Portfolio Section */}
        {loading ? (
          <View style={{ marginVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ marginTop: 8, fontSize: 13, color: colors.textMuted }}>
              Loading crops...
            </Text>
          </View>
        ) : cropsList.length === 0 ? (
          /* Empty Portfolio Card */
          <View style={[styles.emptyPortfolioCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.accentBg }]}>
              <Leaf size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyPortfolioTitle, { color: colors.textPrimary }]}>
              {t('crop.emptyTitle', language)}
            </Text>
            <Text style={[styles.emptyPortfolioSub, { color: colors.textSecondary }]}>
              {t('crop.emptySub', language)}
            </Text>

            <View style={styles.emptyActionRow}>
              <Pressable style={[styles.emptyScanBtn, { backgroundColor: colors.primary }]} onPress={onOpenScanner}>
                <Camera size={16} color="#FFFFFF" />
                <Text style={styles.emptyScanBtnText}>{t('scanner.takePhoto', language)}</Text>
              </Pressable>
              {onOpenAddCrop && (
                <Pressable style={[styles.emptyAddBtn, { backgroundColor: colors.accentBg, borderColor: colors.border }]} onPress={onOpenAddCrop}>
                  <Plus size={16} color={colors.primary} />
                  <Text style={[styles.emptyAddBtnText, { color: colors.primary }]}>Add Crop</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Active portfolio</Text>
              <View style={styles.portfolioRight}>
                {onOpenAddCrop && (
                  <Pressable style={styles.addCropBtn} onPress={onOpenAddCrop}>
                    <Plus size={13} color={colors.primary} />
                    <Text style={[styles.addCropText, { color: colors.primary }]}>Add Crop</Text>
                  </Pressable>
                )}
                <Text style={[styles.plotsBadge, { color: colors.textMuted }]}>{cropsList.length} CROPS</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cropCarousel}
            >
              {cropsList.map((crop) => {
                const isSelected = crop.id === selectedCropId;
                return (
                  <Pressable
                    key={crop.id}
                    style={[
                      styles.cropChip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedCropId(crop.id)}
                  >
                    <Text style={styles.cropChipIcon}>{crop.icon || '🌱'}</Text>
                    <Text
                      style={[
                        styles.cropChipName,
                        { color: colors.textSecondary },
                        isSelected && { color: colors.onPrimary || '#FFFFFF', fontWeight: '800' },
                      ]}
                      numberOfLines={1}
                    >
                      {getLocalizedCropName(crop)}
                    </Text>
                    {crop.acreage ? (
                      <View style={[styles.acreageBadge, isSelected && styles.acreageBadgeSelected]}>
                        <Text style={[styles.acreageText, { color: colors.textMuted }, isSelected && styles.acreageTextSelected]}>
                          {crop.acreage}ac
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 4. Growth Cycle Timeline Card for Active Crop */}
            {activeCrop && (
              <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.timelineTop}>
                  <View style={styles.timelineCropInfo}>
                    <View style={[styles.cropIconBox, { backgroundColor: colors.accentBg }]}>
                      <Text style={{ fontSize: 22 }}>{activeCrop.icon || '🌱'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activeCropTitle, { color: colors.textPrimary }]}>
                        {getLocalizedCropName(activeCrop)}
                      </Text>
                      <Text style={[styles.activeCropMeta, { color: colors.textMuted }]}>
                        {activeCrop.planted_date || activeCrop.plantedDate
                          ? `Planted: ${activeCrop.planted_date || activeCrop.plantedDate}`
                          : t('crop.notPlantedYet', language)}{' '}
                        • {activeCrop.variety || 'Standard'}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={[styles.viewDetailsBtn, { backgroundColor: colors.pillBg, borderColor: colors.border }]}
                    onPress={() => handleOpenDetail(activeCrop.id)}
                  >
                    <Text style={[styles.viewDetailsText, { color: colors.textPrimary }]}>Details →</Text>
                  </Pressable>
                </View>

                {/* Progress Bar & Stepper if planted */}
                {(activeCrop.planted_date || activeCrop.plantedDate) ? (
                  <View style={styles.stepperContainer}>
                    <View style={[styles.stepperTrack, { backgroundColor: colors.border }]} />
                    <View
                      style={[
                        styles.stepperProgressLine,
                        {
                          backgroundColor: colors.primary,
                          width: `${Math.max(
                            8,
                            (currentStageIndex / Math.max(1, stages.length - 1)) * 100
                          )}%`,
                        },
                      ]}
                    />

                    <View style={styles.stepperNodes}>
                      {stages.map((stg, i) => {
                        const isCurrent = i === currentStageIndex;
                        const isPassed = i < currentStageIndex;
                        return (
                          <View key={stg} style={styles.stepperNode}>
                            <View
                              style={[
                                styles.stepperCircle,
                                isPassed && [styles.stepperCirclePassed, { backgroundColor: colors.primary }],
                                isCurrent && [styles.stepperCircleCurrent, { backgroundColor: colors.primary }],
                              ]}
                            >
                              {isPassed ? (
                                <CheckCircle2 size={14} color="#FFFFFF" />
                              ) : isCurrent ? (
                                <Circle size={10} color="#FFFFFF" />
                              ) : (
                                <Text style={[styles.stepperNum, { color: colors.textMuted }]}>{i + 1}</Text>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.stepperLabel,
                                { color: colors.textMuted },
                                isCurrent && [styles.stepperLabelCurrent, { color: colors.primary }],
                                isPassed && [styles.stepperLabelPassed, { color: colors.textSecondary }],
                              ]}
                              numberOfLines={1}
                            >
                              {getTranslatedStage(stg)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <View style={[styles.unplantedBanner, { backgroundColor: isDark ? '#3D2800' : '#FEF3C7' }]}>
                    <Calendar size={16} color="#B45309" />
                    <Text style={styles.unplantedBannerText}>
                      Set planted date to unlock 4-stage growth progress & care schedules
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 5. Field Care Tasks Section */}
            {activeCrop && (
              <View style={styles.tasksSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Field Care Tasks</Text>
                  <View style={styles.taskFilterRow}>
                    {(['All', 'Spraying', 'Irrigation', 'Fertilization'] as const).map((filter) => (
                      <Pressable
                        key={filter}
                        style={[
                          styles.taskFilterBtn,
                          { backgroundColor: colors.card, borderColor: colors.border },
                          taskFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => setTaskFilter(filter)}
                      >
                        <Text
                          style={[
                            styles.taskFilterText,
                            { color: colors.textSecondary },
                            taskFilter === filter && { color: colors.onPrimary || '#FFFFFF', fontWeight: '700' },
                          ]}
                        >
                          {filter}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {filteredTasks.length === 0 ? (
                  <View style={[styles.emptyTasksBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.emptyTasksText, { color: colors.textMuted }]}>
                      No {taskFilter !== 'All' ? taskFilter : ''} tasks pending for this crop
                    </Text>
                  </View>
                ) : (
                  filteredTasks.map((task: any) => (
                    <Pressable
                      key={task.id}
                      style={[
                        styles.taskCard,
                        { backgroundColor: colors.card, borderColor: colors.cardBorder },
                        task.completed && styles.taskCardCompleted,
                      ]}
                      onPress={() => handleToggleTask(activeCrop.id, task.id)}
                    >
                      <View style={styles.taskCheckbox}>
                        {task.completed ? (
                          <CheckCircle2 size={20} color={colors.primary} />
                        ) : (
                          <Circle size={20} color={colors.textMuted} />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.taskBadgeRow}>
                          <View
                            style={[
                              styles.priorityBadge,
                              task.priority === 'High'
                                ? styles.priorityHigh
                                : task.priority === 'Medium'
                                ? styles.priorityMedium
                                : styles.priorityLow,
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityText,
                                task.priority === 'High'
                                  ? styles.priorityTextHigh
                                  : task.priority === 'Medium'
                                  ? styles.priorityTextMedium
                                  : styles.priorityTextLow,
                              ]}
                            >
                              {task.priority || 'Medium'} Priority
                            </Text>
                          </View>
                          <Text style={[styles.taskMetaText, { color: colors.textMuted }]}>
                            • {task.task_type || task.type || 'Field'}
                          </Text>
                          {task.dueDate && (
                            <Text style={[styles.taskMetaText, { color: colors.textMuted }]}>
                              • {task.dueDate}
                            </Text>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.taskTitle,
                            { color: colors.textPrimary },
                            task.completed && styles.taskTitleCompleted,
                          ]}
                        >
                          {getTaskTitle(task)}
                        </Text>

                        {task.notes && (
                          <View style={styles.taskNotesBox}>
                            <Text style={styles.taskNotesText}>⚠️ {task.notes}</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </>
        )}

        {/* 6. Pathology Specimen Encyclopedia Section */}
        <View style={styles.pathologySection}>
          <View style={styles.sectionHeaderCol}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pathology library</Text>
            <Text style={[styles.sectionSublabel, { color: colors.textMuted }]}>VERIFIED ICAR SPECIMENS</Text>
          </View>

          <View style={styles.specimensGrid}>
            {PATHOLOGY_SPECIMENS.map((specimen) => (
              <Pressable
                key={specimen.id}
                style={[
                  styles.specimenCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                onPress={() => setSelectedSpecimen(specimen)}
              >
                <View style={[styles.specimenHeaderBg, { backgroundColor: colors.pillBg }]}>
                  <View style={[styles.specimenIconCircle, { backgroundColor: colors.card }]}>
                    <ShieldAlert
                      size={24}
                      color={specimen.severity === 'Severe' ? '#DC2626' : '#D97706'}
                    />
                  </View>
                  <View
                    style={[
                      styles.pathogenBadge,
                      specimen.severity === 'Severe'
                        ? styles.pathogenBadgeSevere
                        : styles.pathogenBadgeModerate,
                    ]}
                  >
                    <Text style={styles.pathogenBadgeText}>{specimen.pathogenType}</Text>
                  </View>
                </View>

                <View style={styles.specimenBody}>
                  <Text style={[styles.specimenName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {specimen.name.split(' (')[0]}
                  </Text>
                  <Text style={[styles.specimenCrop, { color: colors.textMuted }]} numberOfLines={1}>
                    {specimen.crop}
                  </Text>

                  <View style={styles.specimenFooter}>
                    <Text style={[styles.remediesBtnText, { color: colors.primary }]}>Remedies</Text>
                    <ChevronRight size={14} color={colors.primary} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 7. Pathology Specimen Details Modal */}
      {selectedSpecimen && (
        <Modal
          visible={!!selectedSpecimen}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedSpecimen(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalEyebrow, { color: colors.primary }]}>ICAR PATHOLOGY REPORT</Text>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{selectedSpecimen.name}</Text>
                  <Text style={[styles.modalScientific, { color: colors.textMuted }]}>{selectedSpecimen.scientificName}</Text>
                </View>
                <Pressable
                  style={[styles.modalCloseBtn, { backgroundColor: colors.pillBg }]}
                  onPress={() => setSelectedSpecimen(null)}
                >
                  <X size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>{selectedSpecimen.description}</Text>

                {/* Symptoms */}
                <View style={[styles.remedyBlock, { backgroundColor: colors.pillBg, borderColor: colors.border }]}>
                  <View style={styles.remedyBlockHeader}>
                    <AlertTriangle size={16} color="#DC2626" />
                    <Text style={[styles.remedyBlockTitle, { color: colors.textPrimary }]}>Diagnostic Symptoms</Text>
                  </View>
                  {selectedSpecimen.symptoms.map((s, idx) => (
                    <Text key={idx} style={[styles.remedyItem, { color: colors.textSecondary }]}>
                      • {s}
                    </Text>
                  ))}
                </View>

                {/* Organic Remedies */}
                <View style={[styles.remedyBlock, { backgroundColor: colors.pillBg, borderColor: colors.border }]}>
                  <View style={styles.remedyBlockHeader}>
                    <Leaf size={16} color={colors.primary} />
                    <Text style={[styles.remedyBlockTitle, { color: colors.primary }]}>
                      Organic & Biological Control
                    </Text>
                  </View>
                  {selectedSpecimen.organicTreatment.map((s, idx) => (
                    <Text key={idx} style={[styles.remedyItem, { color: colors.textSecondary }]}>
                      • {s}
                    </Text>
                  ))}
                </View>

                {/* Chemical Remedies */}
                <View style={[styles.remedyBlock, { backgroundColor: colors.pillBg, borderColor: colors.border }]}>
                  <View style={styles.remedyBlockHeader}>
                    <FlaskConical size={16} color="#D97706" />
                    <Text style={[styles.remedyBlockTitle, { color: '#D97706' }]}>
                      Chemical ICAR Dosage
                    </Text>
                  </View>
                  {selectedSpecimen.chemicalTreatment.map((s, idx) => (
                    <Text key={idx} style={[styles.remedyItem, { color: colors.textSecondary }]}>
                      • {s}
                    </Text>
                  ))}
                </View>

                {/* Preventive Measures */}
                <View style={[styles.remedyBlock, { backgroundColor: colors.pillBg, borderColor: colors.border }]}>
                  <Text style={[styles.remedyBlockTitle, { color: colors.textPrimary }]}>Preventive Agronomy</Text>
                  {selectedSpecimen.preventiveMeasures.map((s, idx) => (
                    <Text key={idx} style={[styles.remedyItem, { color: colors.textSecondary }]}>
                      • {s}
                    </Text>
                  ))}
                </View>
              </ScrollView>

              <Pressable
                style={[styles.modalScanBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setSelectedSpecimen(null);
                  onOpenScanner();
                }}
              >
                <Camera size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.modalScanBtnText}>Scan Crop Leaf Now</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* 8. Full Crop Detail Modal */}
      <CropDetailModal
        visible={detailModalVisible}
        cropId={selectedCropForDetail}
        language={language}
        onClose={() => setDetailModalVisible(false)}
        onCropUpdated={fetchCrops}
        onCropDeleted={() => {
          setDetailModalVisible(false);
          fetchCrops();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyPortfolioCard: {
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyPortfolioTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyPortfolioSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emptyActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  emptyScanBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  viewDetailsBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unplantedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 8,
  },
  unplantedBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 0,
  },
  headerActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pingDot: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E8F5E9',
    fontFamily: 'monospace',
  },
  heroTapText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textDecorationLine: 'underline',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 10,
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(232, 245, 233, 0.9)',
    lineHeight: 17,
    maxWidth: '75%',
  },
  heroCameraCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderCol: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSublabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 2,
  },
  portfolioRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addCropText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  plotsBadge: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  cropCarousel: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 18,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  cropChipIcon: {
    fontSize: 14,
  },
  cropChipName: {
    fontSize: 12,
    fontWeight: '700',
  },
  acreageBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  acreageBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  acreageText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  acreageTextSelected: {
    color: '#FFFFFF',
  },
  timelineCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  timelineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineCropInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cropIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCropTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  activeCropMeta: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  stepperContainer: {
    position: 'relative',
    paddingVertical: 10,
  },
  stepperTrack: {
    position: 'absolute',
    top: 22,
    left: 20,
    right: 20,
    height: 2,
    borderRadius: 1,
  },
  stepperProgressLine: {
    position: 'absolute',
    top: 22,
    left: 20,
    height: 2,
    borderRadius: 1,
  },
  stepperNodes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepperNode: {
    alignItems: 'center',
    width: 65,
  },
  stepperCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepperCircleCurrent: {
    borderWidth: 3,
    borderColor: '#DCFCE7',
    transform: [{ scale: 1.15 }],
  },
  stepperCirclePassed: {},
  stepperNum: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepperLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  stepperLabelCurrent: {
    fontWeight: '800',
  },
  stepperLabelPassed: {
    fontWeight: '600',
  },
  tasksSection: {
    marginBottom: 20,
  },
  taskFilterRow: {
    flexDirection: 'row',
    gap: 4,
  },
  taskFilterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  taskFilterText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyTasksBox: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 10,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskCheckbox: {
    paddingTop: 2,
  },
  taskBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  priorityHigh: {
    backgroundColor: '#FEE2E2',
  },
  priorityMedium: {
    backgroundColor: '#FEF3C7',
  },
  priorityLow: {
    backgroundColor: '#F1F5F9',
  },
  priorityText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  priorityTextHigh: {
    color: '#DC2626',
  },
  priorityTextMedium: {
    color: '#D97706',
  },
  priorityTextLow: {
    color: '#475569',
  },
  taskMetaText: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  taskNotesBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
  },
  taskNotesText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  pathologySection: {
    marginBottom: 20,
  },
  specimensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specimenCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  specimenHeaderBg: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  specimenIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathogenBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  pathogenBadgeSevere: {
    backgroundColor: '#DC2626',
  },
  pathogenBadgeModerate: {
    backgroundColor: '#D97706',
  },
  pathogenBadgeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  specimenBody: {
    padding: 12,
  },
  specimenName: {
    fontSize: 12,
    fontWeight: '800',
  },
  specimenCrop: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontStyle: 'italic',
    marginTop: 2,
  },
  specimenFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  remediesBtnText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalEyebrow: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  modalScientific: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginTop: 14,
    marginBottom: 16,
  },
  modalDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  remedyBlock: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  remedyBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  remedyBlockTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  remedyItem: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  modalScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalScanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
