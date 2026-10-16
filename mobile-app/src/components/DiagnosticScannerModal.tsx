import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Image as ImageIcon,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Droplets,
  Stethoscope,
  Sparkles,
  Info,
  Leaf,
} from 'lucide-react-native';
import { diagnoseCropImage, getUserCrops, createUserCrop } from '../services/apiClient';
import { AppLanguage, DiagnosticResult } from '../types';
import { t } from '../constants/translations';
import { THEME } from '../constants/theme';

interface DiagnosticScannerModalProps {
  visible: boolean;
  onClose: () => void;
  language: AppLanguage;
  onConsultAgronomist?: (diseaseName: string) => void;
}

export const DiagnosticScannerModal: React.FC<DiagnosticScannerModalProps> = ({
  visible,
  onClose,
  language,
  onConsultAgronomist,
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<DiagnosticResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userCrops, setUserCrops] = useState<any[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [addedToCrops, setAddedToCrops] = useState(false);
  const [addingCrop, setAddingCrop] = useState(false);

  useEffect(() => {
    if (visible) {
      loadUserCrops();
      setAddedToCrops(false);
    }
  }, [visible]);

  const loadUserCrops = async () => {
    try {
      const data = await getUserCrops();
      if (Array.isArray(data)) {
        setUserCrops(data);
      }
    } catch (e) {
      // non-fatal
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to photograph plant specimens.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0].uri) {
        setImageUri(result.assets[0].uri);
        setScanResult(null);
        setErrorMsg(null);
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message);
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Gallery access is required to select plant images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0].uri) {
        setImageUri(result.assets[0].uri);
        setScanResult(null);
        setErrorMsg(null);
      }
    } catch (e: any) {
      Alert.alert('Gallery Error', e.message);
    }
  };

  const handleDiagnose = async () => {
    if (!imageUri && !userNotes.trim()) {
      setErrorMsg('Please snap a photo or enter symptom descriptions.');
      return;
    }
    setErrorMsg(null);
    setIsAnalyzing(true);
    try {
      const res = await diagnoseCropImage({
        imageUri: imageUri || undefined,
        notes: userNotes,
        language,
        farmCropId: selectedCropId || undefined,
      });

      if (!res || (!res.disease_name && !res.diseaseName)) {
        throw new Error('AI Diagnosis endpoint returned an invalid response structure.');
      }

      setScanResult({
        id: res.id,
        diseaseName: res.disease_name || res.diseaseName || 'Unknown Pathology',
        scientificName: res.scientific_name || res.scientificName,
        crop: res.crop || 'Crop Specimen',
        pathogenType: res.pathogen_type || res.pathogenType || 'Infectious Agent',
        severity: (res.severity as any) || 'Moderate',
        severityScore: res.severity_score || res.severityScore || 75,
        confidenceScore: res.confidence_score || res.confidenceScore || 92,
        symptoms: res.symptoms || [],
        organicRemedies: res.organic_remedies || res.organicRemedies || [],
        chemicalTreatments: res.chemical_treatments || res.chemicalTreatments || [],
        preventiveMeasures: res.preventive_measures || res.preventiveMeasures || [],
        advisoryNote: res.advisory_note || res.advisoryNote,
        imageUrl: imageUri || undefined,
      });
    } catch (err: any) {
      // Direct error state on network/backend failure - NO MOCK FALLBACK
      setErrorMsg(
        `Failed to connect to AI Diagnosis server (${err.message || 'Network request failed'}). Please check your backend or EXPO_PUBLIC_API_URL.`
      );
      setScanResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickAddCrop = async () => {
    if (!scanResult?.crop) return;
    setAddingCrop(true);
    try {
      await createUserCrop({
        custom_name: scanResult.crop,
        source: 'diagnosis',
      });
      setAddedToCrops(true);
      Alert.alert('Crop Added', `${scanResult.crop} has been added to your portfolio!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add crop to portfolio');
    } finally {
      setAddingCrop(false);
    }
  };

  const handleClose = () => {
    setImageUri(null);
    setUserNotes('');
    setScanResult(null);
    setErrorMsg(null);
    setSelectedCropId(null);
    setAddedToCrops(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Navigation Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t('scanner.title', language)}</Text>
            <Text style={styles.headerSubtitle}>रोग निदान • ICAR Calibrated Diagnosis</Text>
          </View>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <X size={22} color={THEME.colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Camera / Image Preview Card */}
          <View style={styles.imageCard}>
            {imageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <Pressable style={styles.repickBtn} onPress={() => setImageUri(null)}>
                  <X size={16} color="#FFFFFF" />
                  <Text style={styles.repickBtnText}>Remove</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <View style={styles.cameraCircle}>
                  <Camera size={38} color={THEME.colors.primary} />
                </View>
                <Text style={styles.placeholderTitle}>Snap a leaf or affected crop area</Text>
                <Text style={styles.placeholderSubtitle}>
                  For best accuracy, hold camera 6-8 inches away in clear sunlight.
                </Text>

                <View style={styles.actionRow}>
                  <Pressable style={styles.captureBtn} onPress={takePhoto}>
                    <Camera size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.captureBtnText}>{t('scanner.takePhoto', language)}</Text>
                  </Pressable>

                  <Pressable style={styles.galleryBtn} onPress={pickImage}>
                    <ImageIcon size={18} color={THEME.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.galleryBtnText}>{t('scanner.uploadGallery', language)}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Crop Selection / Attachment Row */}
          {userCrops.length > 0 && (
            <View style={styles.cropSelectCard}>
              <Text style={styles.sectionLabel}>{t('crop.linkToCrop', language)}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cropChipScroll}
              >
                <Pressable
                  style={[styles.cropSelectChip, !selectedCropId && styles.cropSelectChipActive]}
                  onPress={() => setSelectedCropId(null)}
                >
                  <Text style={[styles.cropSelectChipText, !selectedCropId && styles.cropSelectChipTextActive]}>
                    ✨ Auto-Detect
                  </Text>
                </Pressable>
                {userCrops.map((c) => {
                  const isSelected = selectedCropId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      style={[styles.cropSelectChip, isSelected && styles.cropSelectChipActive]}
                      onPress={() => setSelectedCropId(c.id)}
                    >
                      <Text style={[styles.cropSelectChipText, isSelected && styles.cropSelectChipTextActive]}>
                        {c.icon || '🌱'} {c.name || c.custom_name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Farmer Notes Input */}
          <View style={styles.notesCard}>
            <Text style={styles.sectionLabel}>Farmer Symptoms & Observations (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Yellow curling leaves, brown spots, seen 3 days ago..."
              placeholderTextColor={THEME.colors.textMuted}
              value={userNotes}
              onChangeText={setUserNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Error Message Box (No Mock Fallback) */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <AlertTriangle size={18} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Analyze Button */}
          {!scanResult && (
            <Pressable
              style={({ pressed }) => [
                styles.analyzeBtn,
                pressed && styles.buttonPressed,
                isAnalyzing && styles.buttonDisabled,
              ]}
              onPress={handleDiagnose}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.analyzeBtnText}>{t('scanner.analyzing', language)}</Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <Sparkles size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.analyzeBtnText}>Run AI Diagnosis</Text>
                </View>
              )}
            </Pressable>
          )}

          {/* Scan Results Breakdown */}
          {scanResult && (
            <View style={styles.resultsContainer}>
              {/* Mandatory Compliance Disclaimer Note */}
              <View style={styles.disclaimerBox}>
                <Info size={16} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.disclaimerText}>
                  {t('scanner.disclaimerNote', language)}
                </Text>
              </View>

              {/* Crop Attachment Confirmation or 1-Tap Add to Portfolio */}
              {selectedCropId ? (
                <View style={styles.cropAttachedBanner}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <Text style={styles.cropAttachedText}>
                    Linked to your tracked crop: {userCrops.find(c => c.id === selectedCropId)?.name || 'Selected Crop'}
                  </Text>
                </View>
              ) : scanResult.crop ? (
                <View style={styles.addCropPromptCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.addCropPromptHeader}>
                      <Leaf size={14} color="#15803D" />
                      <Text style={styles.addCropPromptTitle}>Detected: {scanResult.crop}</Text>
                    </View>
                    <Text style={styles.addCropPromptSub}>
                      Add this {scanResult.crop} to your portfolio to track its recovery and growth stages.
                    </Text>
                  </View>
                  <Pressable
                    style={[
                      styles.addCropPromptBtn,
                      addedToCrops && styles.addCropPromptBtnDone,
                    ]}
                    disabled={addedToCrops || addingCrop}
                    onPress={handleQuickAddCrop}
                  >
                    {addingCrop ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : addedToCrops ? (
                      <Text style={styles.addCropPromptBtnText}>✓ Added</Text>
                    ) : (
                      <Text style={styles.addCropPromptBtnText}>+ Add to Crops</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

              {/* Disease Title Banner */}
              <View style={styles.diagnosisCard}>
                <View style={styles.badgeRow}>
                  <View style={styles.pathogenBadge}>
                    <Text style={styles.pathogenBadgeText}>{scanResult.pathogenType}</Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      scanResult.severity === 'Severe'
                        ? styles.severitySevere
                        : styles.severityModerate,
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityBadgeText,
                        scanResult.severity === 'Severe'
                          ? styles.severityTextSevere
                          : styles.severityTextModerate,
                      ]}
                    >
                      {scanResult.severity} Severity ({scanResult.severityScore}%)
                    </Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceBadgeText}>
                      {scanResult.confidenceScore.toFixed(1)}% Match
                    </Text>
                  </View>
                </View>

                <Text style={styles.diseaseName}>{scanResult.diseaseName}</Text>
                {scanResult.scientificName && (
                  <Text style={styles.scientificName}>{scanResult.scientificName}</Text>
                )}

                {scanResult.advisoryNote && (
                  <View style={styles.advisoryBox}>
                    <Text style={styles.advisoryText}>{scanResult.advisoryNote}</Text>
                  </View>
                )}
              </View>

              {/* Symptoms */}
              {scanResult.symptoms.length > 0 && (
                <View style={styles.sectionCard}>
                  <Text style={styles.cardHeader}>Identified Symptoms</Text>
                  {scanResult.symptoms.map((s, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Organic Remedies */}
              {scanResult.organicRemedies.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.remedyHeader}>
                    <Droplets size={18} color="#16A34A" />
                    <Text style={[styles.cardHeader, { color: '#16A34A', marginLeft: 6 }]}>
                      Organic & Biological Control
                    </Text>
                  </View>
                  {scanResult.organicRemedies.map((r, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <CheckCircle2 size={15} color="#16A34A" style={{ marginTop: 2 }} />
                      <Text style={[styles.bulletText, { marginLeft: 8 }]}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Chemical Treatments */}
              {scanResult.chemicalTreatments.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.remedyHeader}>
                    <ShieldCheck size={18} color="#2563EB" />
                    <Text style={[styles.cardHeader, { color: '#2563EB', marginLeft: 6 }]}>
                      Recommended Chemical Spray
                    </Text>
                  </View>
                  {scanResult.chemicalTreatments.map((c, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <CheckCircle2 size={15} color="#2563EB" style={{ marginTop: 2 }} />
                      <Text style={[styles.bulletText, { marginLeft: 8 }]}>{c}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.bottomActions}>
                <Pressable
                  style={styles.consultBtn}
                  onPress={() => {
                    onClose();
                    onConsultAgronomist?.(scanResult.diseaseName);
                  }}
                >
                  <Stethoscope size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.consultBtnText}>Consult Agronomist</Text>
                </Pressable>

                <Pressable style={styles.newScanBtn} onPress={() => setScanResult(null)}>
                  <Text style={styles.newScanBtnText}>Scan Another</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8DE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F4EE',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8DE',
    marginBottom: 16,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  cameraCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  placeholderSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F4EE',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  galleryBtnText: {
    color: THEME.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 240,
    borderRadius: 14,
  },
  repickBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  repickBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8DE',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F7F9F5',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 17,
  },
  analyzeBtn: {
    backgroundColor: THEME.colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resultsContainer: {
    marginTop: 8,
    gap: 14,
  },
  diagnosisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pathogenBadge: {
    backgroundColor: '#F1F4EE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pathogenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  severityModerate: {
    backgroundColor: '#FEF3C7',
  },
  severitySevere: {
    backgroundColor: '#FEE2E2',
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  severityTextModerate: {
    color: '#D97706',
  },
  severityTextSevere: {
    color: '#DC2626',
  },
  confidenceBadge: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: THEME.colors.textMuted,
    marginBottom: 12,
  },
  advisoryBox: {
    backgroundColor: '#F8FAF5',
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.primary,
    padding: 10,
    borderRadius: 6,
  },
  advisoryText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8DE',
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 10,
  },
  remedyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  consultBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  consultBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  newScanBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDE3D6',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newScanBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  cropSelectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8DE',
    marginBottom: 14,
  },
  cropChipScroll: {
    gap: 8,
    paddingTop: 6,
  },
  cropSelectChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cropSelectChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  cropSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cropSelectChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  cropAttachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 12,
  },
  cropAttachedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  addCropPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginBottom: 12,
    gap: 12,
  },
  addCropPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  addCropPromptTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803D',
  },
  addCropPromptSub: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  addCropPromptBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCropPromptBtnDone: {
    backgroundColor: '#65A30D',
  },
  addCropPromptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
