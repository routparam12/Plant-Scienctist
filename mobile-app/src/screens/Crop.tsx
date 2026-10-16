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
      const data = await getUserCrops();
      if (Array.isArray(data)) {
        setCropsList(data);
        if (data.length > 0) {
          setSelectedCropId((prev) =>
            prev && data.some((c) => c.id === prev) ? prev : data[0].id
          );
        } else {
          setSelectedCropId(null);
        }
      }
    } catch (e) {
      console.warn('Could not fetch user crops:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCrops();
  };

  const activeCrop = cropsList.find((c) => c.id === selectedCropId) || cropsList[0] || null;
  const stages: CropGrowthStage[] = ['Vegetative', 'Flowering', 'Fruiting', 'Harvesting'];

  const getStageTitle = (crop: any): string => {
    if (!crop) return 'Vegetative';
    const key = crop.stage_key || crop.stage || crop.reported_stage || 'vegetative';
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 1. Header with Eyebrow and 48px Circular Action */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DIAGNOSTIC SYSTEM // v2.4</Text>
            <Text style={styles.title}>{t('crop.headerTitle', language)}</Text>
          </View>

          <Pressable style={styles.headerActionBtn} onPress={onOpenScanner}>
            <Camera size={20} color={THEME.colors.primary} />
            <View style={styles.pingDot} />
          </Pressable>
        </View>

        {/* 2. Hero Scanner Card */}
        <Pressable style={styles.heroCard} onPress={onOpenScanner}>
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
              <Camera size={20} color="#2E7D32" />
            </View>
          </View>
        </Pressable>

        {/* 3. Active Portfolio Section */}
        {loading ? (
          <View style={{ marginVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={THEME.colors.primary} />
            <Text style={{ marginTop: 8, fontSize: 13, color: THEME.colors.textMuted }}>
              Loading crops...
            </Text>
          </View>
        ) : cropsList.length === 0 ? (
          /* Empty Portfolio Card */
          <View style={styles.emptyPortfolioCard}>
            <View style={styles.emptyIconBox}>
              <Leaf size={28} color="#2E7D32" />
            </View>
            <Text style={styles.emptyPortfolioTitle}>{t('crop.emptyTitle', language)}</Text>
            <Text style={styles.emptyPortfolioSub}>{t('crop.emptySub', language)}</Text>

            <View style={styles.emptyActionRow}>
              <Pressable style={styles.emptyScanBtn} onPress={onOpenScanner}>
                <Camera size={16} color="#FFFFFF" />
                <Text style={styles.emptyScanBtnText}>{t('scanner.takePhoto', language)}</Text>
              </Pressable>
              {onOpenAddCrop && (
                <Pressable style={styles.emptyAddBtn} onPress={onOpenAddCrop}>
                  <Plus size={16} color="#2E7D32" />
                  <Text style={styles.emptyAddBtnText}>{t('home.addCrop', language)}</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active portfolio</Text>
              <View style={styles.portfolioRight}>
                {onOpenAddCrop && (
                  <Pressable style={styles.addCropBtn} onPress={onOpenAddCrop}>
                    <Plus size={13} color="#2E7D32" />
                    <Text style={styles.addCropText}>Add Crop</Text>
                  </Pressable>
                )}
                <Text style={styles.plotsBadge}>{cropsList.length} CROPS</Text>
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
                    style={[styles.cropChip, isSelected && styles.cropChipSelected]}
                    onPress={() => setSelectedCropId(crop.id)}
                  >
                    <Text style={styles.cropChipIcon}>{crop.icon || '🌱'}</Text>
                    <Text
                      style={[styles.cropChipName, isSelected && styles.cropChipNameSelected]}
                      numberOfLines={1}
                    >
                      {getLocalizedCropName(crop)}
                    </Text>
                    {crop.acreage ? (
                      <View style={[styles.acreageBadge, isSelected && styles.acreageBadgeSelected]}>
                        <Text style={[styles.acreageText, isSelected && styles.acreageTextSelected]}>
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
              <View style={styles.timelineCard}>
                <View style={styles.timelineTop}>
                  <View style={styles.timelineCropInfo}>
                    <View style={styles.cropIconBox}>
                      <Text style={{ fontSize: 22 }}>{activeCrop.icon || '🌱'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activeCropTitle}>{getLocalizedCropName(activeCrop)}</Text>
                      <Text style={styles.activeCropMeta}>
                        {activeCrop.planted_date || activeCrop.plantedDate
                          ? `Planted: ${activeCrop.planted_date || activeCrop.plantedDate}`
                          : t('crop.notPlantedYet', language)}{' '}
                        • {activeCrop.variety || 'Standard'}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.viewDetailsBtn}
                    onPress={() => handleOpenDetail(activeCrop.id)}
                  >
                    <Text style={styles.viewDetailsText}>Details →</Text>
                  </Pressable>
                </View>

                {/* Progress Bar & Stepper if planted, otherwise notice */}
                {(activeCrop.planted_date || activeCrop.plantedDate) ? (
                  <View style={styles.stepperContainer}>
                    <View style={styles.stepperTrack} />
                    <View
                      style={[
                        styles.stepperProgressLine,
                        {
                          width: `${Math.max(
                            8,
                            (currentStageIndex / Math.max(1, stages.length - 1)) * 100
                          )}%`,
                        },
                      ]}
                    />

                    <View style={styles.stepperNodes}>
                      {stages.map((stg, idx) => {
                        const isPassed = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;

                        return (
                          <View key={stg} style={styles.stepperNode}>
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
                            >
                              {stg}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={styles.unplantedBanner}
                    onPress={() => handleOpenDetail(activeCrop.id)}
                  >
                    <Calendar size={14} color="#B45309" />
                    <Text style={styles.unplantedBannerText}>
                      {t('crop.notPlantedYet', language)} — Tap to set date
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* 5. Actionable Care Tasks */}
            {activeCrop && (
              <View style={styles.tasksSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Care tasks</Text>

                  <View style={styles.taskFilterRow}>
                    {(['All', 'Spraying', 'Irrigation', 'Fertilization'] as const).map((filter) => {
                      const isSelected = taskFilter === filter;
                      return (
                        <Pressable
                          key={filter}
                          style={[styles.taskFilterBtn, isSelected && styles.taskFilterBtnSelected]}
                          onPress={() => setTaskFilter(filter)}
                        >
                          <Text style={[styles.taskFilterText, isSelected && styles.taskFilterTextSelected]}>
                            {filter === 'Fertilization' ? 'Fertilizer' : filter}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {filteredTasks.length === 0 ? (
                  <View style={styles.emptyTasksBox}>
                    <Text style={styles.emptyTasksText}>No tasks found for this category.</Text>
                  </View>
                ) : (
                  filteredTasks.map((task: any) => (
                    <Pressable
                      key={task.id}
                      style={[styles.taskCard, task.completed && styles.taskCardCompleted]}
                      onPress={() => handleToggleTask(activeCrop.id, task.id)}
                    >
                      <Pressable
                        style={styles.taskCheckbox}
                        onPress={() => handleToggleTask(activeCrop.id, task.id)}
                      >
                        {task.completed ? (
                          <CheckCircle2 size={20} color="#2E7D32" />
                        ) : (
                          <Circle size={20} color="#94A3B8" />
                        )}
                      </Pressable>

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
                          <Text style={styles.taskMetaText}>• {task.task_type || task.type || 'Field'}</Text>
                          {task.dueDate && <Text style={styles.taskMetaText}>• {task.dueDate}</Text>}
                        </View>

                        <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
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
            <Text style={styles.sectionTitle}>Pathology library</Text>
            <Text style={styles.sectionSublabel}>VERIFIED ICAR SPECIMENS</Text>
          </View>

          <View style={styles.specimensGrid}>
            {PATHOLOGY_SPECIMENS.map((specimen) => (
              <Pressable
                key={specimen.id}
                style={styles.specimenCard}
                onPress={() => setSelectedSpecimen(specimen)}
              >
                <View style={styles.specimenHeaderBg}>
                  <View style={styles.specimenIconCircle}>
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
                  <Text style={styles.specimenName} numberOfLines={1}>
                    {specimen.name.split(' (')[0]}
                  </Text>
                  <Text style={styles.specimenCrop} numberOfLines={1}>
                    {specimen.crop}
                  </Text>

                  <View style={styles.specimenFooter}>
                    <Text style={styles.remediesBtnText}>Remedies</Text>
                    <ChevronRight size={14} color="#2E7D32" />
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
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalEyebrow}>ICAR PATHOLOGY REPORT</Text>
                  <Text style={styles.modalTitle}>{selectedSpecimen.name}</Text>
                  <Text style={styles.modalScientific}>{selectedSpecimen.scientificName}</Text>
                </View>
                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedSpecimen(null)}
                >
                  <X size={18} color="#475569" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Description */}
                <Text style={styles.modalDesc}>{selectedSpecimen.description}</Text>

                {/* Symptoms */}
                <View style={styles.remedyBlock}>
                  <View style={styles.remedyBlockHeader}>
                    <AlertTriangle size={16} color="#DC2626" />
                    <Text style={styles.remedyBlockTitle}>Diagnostic Symptoms</Text>
                  </View>
                  {selectedSpecimen.symptoms.map((s, idx) => (
                    <Text key={idx} style={styles.remedyItem}>
                      • {s}
                    </Text>
                  ))}
                </View>

                {/* Organic Remedies */}
                <View style={styles.remedyBlock}>
                  <View style={styles.remedyBlockHeader}>
                    <Leaf size={16} color="#2E7D32" />
                    <Text style={[styles.remedyBlockTitle, { color: '#2E7D32' }]}>
                      Organic & Biological Control
                    </Text>
                  </View>
                  {selectedSpecimen.organicTreatment.map((s, idx) => (
                    <Text key={idx} style={styles.remedyItem}>
                      • {s}
                    </Text>
                  ))}
                </View>

                {/* Chemical Remedies */}
                <View style={styles.remedyBlock}>
                  <View style={styles.remedyBlockHeader}>
                    <FlaskConical size={16} color="#D97706" />
                    <Text style={[styles.remedyBlockTitle, { color: '#D97706' }]}>
                      Chemical ICAR Dosage
                    </Text>
                  </View>
                  {selectedSpecimen.chemicalTreatment.map((s, idx) => (
                    <Text key={idx} style={styles.remedyItem}>
                      • {s}
                    </Text>
                  ))}
                </View>

                {/* Preventive Measures */}
                <View style={styles.remedyBlock}>
                  <Text style={styles.remedyBlockTitle}>Preventive Agronomy</Text>
                  {selectedSpecimen.preventiveMeasures.map((s, idx) => (
                    <Text key={idx} style={styles.remedyItem}>
                      • {s}
                    </Text>
                  ))}
                </View>
              </ScrollView>

              <Pressable
                style={styles.modalScanBtn}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  emptyPortfolioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8DE',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyPortfolioTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1C18',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyPortfolioSub: {
    fontSize: 13,
    color: '#64748B',
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
    backgroundColor: '#2E7D32',
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
    backgroundColor: '#E8F5E9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
    gap: 6,
  },
  emptyAddBtnText: {
    color: '#2E7D32',
    fontSize: 13,
    fontWeight: '700',
  },
  viewDetailsBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  unplantedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
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
    backgroundColor: '#F7F9F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1C18',
    marginTop: 2,
  },
  headerActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: '#2E7D32',
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#1A1C18',
  },
  sectionSublabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#64748B',
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
    color: '#2E7D32',
    fontFamily: 'monospace',
  },
  plotsBadge: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748B',
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    gap: 6,
  },
  cropChipSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  cropChipIcon: {
    fontSize: 14,
  },
  cropChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  cropChipNameSelected: {
    color: '#FFFFFF',
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
    color: '#64748B',
  },
  acreageTextSelected: {
    color: '#FFFFFF',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCropTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1C18',
  },
  activeCropMeta: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748B',
    marginTop: 2,
  },
  stagePill: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.15)',
  },
  stagePillText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#2E7D32',
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
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 1,
  },
  stepperProgressLine: {
    position: 'absolute',
    top: 22,
    left: 20,
    height: 2,
    backgroundColor: '#2E7D32',
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
    backgroundColor: '#2E7D32',
    borderWidth: 3,
    borderColor: '#DCFCE7',
    transform: [{ scale: 1.15 }],
  },
  stepperCirclePassed: {
    backgroundColor: '#2E7D32',
  },
  stepperNum: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepperNumActive: {
    color: '#FFFFFF',
  },
  stepperLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#94A3B8',
    textAlign: 'center',
  },
  stepperLabelCurrent: {
    color: '#2E7D32',
    fontWeight: '800',
  },
  stepperLabelPassed: {
    color: '#334155',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  taskFilterBtnSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  taskFilterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  taskFilterTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyTasksBox: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyTasksText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 10,
    gap: 10,
  },
  taskCardCompleted: {
    backgroundColor: 'rgba(0,0,0,0.02)',
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
    color: '#94A3B8',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C18',
    lineHeight: 18,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  specimenHeaderBg: {
    height: 90,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  specimenIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
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
    color: '#1A1C18',
  },
  specimenCrop: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748B',
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
    color: '#2E7D32',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#2E7D32',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1C18',
    marginTop: 2,
  },
  modalScientific: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginTop: 14,
    marginBottom: 16,
  },
  modalDesc: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 14,
  },
  remedyBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    color: '#1E293B',
  },
  remedyItem: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 17,
    marginTop: 4,
  },
  modalScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalScanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
