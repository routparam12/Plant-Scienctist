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
  Mic,
} from 'lucide-react-native';
import { diagnoseCropImage, getUserCrops, createUserCrop } from '../services/apiClient';
import { AppLanguage, DiagnosticResult } from '../types';
import { t } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
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
  const { colors, isDark } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [isDictating, setIsDictating] = useState(false);
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
      setErrorMsg(null);
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
      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].uri) {
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
      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].uri) {
        setImageUri(result.assets[0].uri);
        setScanResult(null);
        setErrorMsg(null);
      }
    } catch (e: any) {
      Alert.alert('Gallery Error', e.message);
    }
  };

  const handleSimulateDictation = () => {
    setIsDictating(true);
    setTimeout(() => {
      const spokenText =
        language === 'hi'
          ? 'पत्तियों में ऊपर की ओर घुमाव है, निचले तने पर भूरे रंग के धब्बे हैं और फल गिर रहे हैं।'
          : 'Leaves are yellowing with upward curling along upper margins and dark spots on lower stem.';
      setUserNotes((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
      setIsDictating(false);
      setErrorMsg(null);
    }, 1000);
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        {/* Navigation Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t('scanner.title', language)}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              रोग निदान • ICAR Calibrated Diagnosis
            </Text>
          </View>
          <Pressable onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.pillBg }]}>
            <X size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Camera / Image Preview Card */}
          <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
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
                <View style={[styles.cameraCircle, { backgroundColor: colors.accentBg }]}>
                  <Camera size={38} color={colors.primary} />
                </View>
                <Text style={[styles.placeholderTitle, { color: colors.textPrimary }]}>
                  Snap a leaf or affected crop area
                </Text>
                <Text style={[styles.placeholderSubtitle, { color: colors.textMuted }]}>
                  For best accuracy, hold camera 6-8 inches away in clear sunlight.
                </Text>

                <View style={styles.actionRow}>
                  <Pressable style={[styles.captureBtn, { backgroundColor: colors.primary }]} onPress={takePhoto}>
                    <Camera size={18} color={colors.onPrimary || '#FFFFFF'} style={{ marginRight: 6 }} />
                    <Text style={[styles.captureBtnText, { color: colors.onPrimary || '#FFFFFF' }]}>
                      {t('scanner.takePhoto', language)}
                    </Text>
                  </Pressable>

                  <Pressable style={[styles.galleryBtn, { backgroundColor: colors.pillBg }]} onPress={pickImage}>
                    <ImageIcon size={18} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.galleryBtnText, { color: colors.primary }]}>
                      {t('scanner.uploadGallery', language)}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Crop Selection / Attachment Row */}
          {userCrops.length > 0 && (
            <View style={[styles.cropSelectCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
                {t('crop.linkToCrop', language)}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cropChipScroll}
              >
                <Pressable
                  style={[
                    styles.cropSelectChip,
                    { backgroundColor: colors.pillBg, borderColor: colors.border },
                    !selectedCropId && { backgroundColor: colors.accentBg, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedCropId(null)}
                >
                  <Text
                    style={[
                      styles.cropSelectChipText,
                      { color: colors.textSecondary },
                      !selectedCropId && { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    ✨ Auto-Detect
                  </Text>
                </Pressable>
                {userCrops.map((c) => {
                  const isSelected = selectedCropId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.cropSelectChip,
                        { backgroundColor: colors.pillBg, borderColor: colors.border },
                        isSelected && { backgroundColor: colors.accentBg, borderColor: colors.primary },
                      ]}
                      onPress={() => setSelectedCropId(c.id)}
                    >
                      <Text
                        style={[
                          styles.cropSelectChipText,
                          { color: colors.textSecondary },
                          isSelected && { color: colors.primary, fontWeight: '700' },
                        ]}
                      >
                        {c.icon || '🌱'} {c.name || c.custom_name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Farmer Notes Input with Inline Speech Dictation */}
          <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.notesCardHeader}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary, flex: 1, marginBottom: 0 }]}>
                {language === 'hi' ? 'लक्षण व विवरण (ऐच्छिक)' : 'Farmer Symptoms & Observations'}
              </Text>

              <Pressable
                style={[
                  styles.inlineMicBtn,
                  { backgroundColor: colors.accentBg, borderColor: colors.border },
                  isDictating && { backgroundColor: colors.primary },
                ]}
                onPress={handleSimulateDictation}
                disabled={isDictating}
              >
                {isDictating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Mic size={12} color={colors.primary} />
                    <Text style={[styles.inlineMicBtnText, { color: colors.primary }]}>
                      {language === 'hi' ? 'बोलकर बताएं' : 'Speak Symptoms'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder={
                language === 'hi'
                  ? 'उदा. पत्तियों में पीलापन, भूरे धब्बे, 3 दिन से समस्या...'
                  : 'e.g. Yellow curling leaves, brown spots, seen 3 days ago...'
              }
              placeholderTextColor={colors.textMuted}
              value={userNotes}
              onChangeText={(txt) => {
                setUserNotes(txt);
                if (txt.trim() || imageUri) setErrorMsg(null);
              }}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Error Message Box */}
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
                { backgroundColor: colors.primary },
                !imageUri && !userNotes.trim() && { opacity: 0.7 },
                pressed && styles.buttonPressed,
                isAnalyzing && styles.buttonDisabled,
              ]}
              onPress={handleDiagnose}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.onPrimary || '#FFFFFF'} style={{ marginRight: 8 }} />
                  <Text style={[styles.analyzeBtnText, { color: colors.onPrimary || '#FFFFFF' }]}>
                    {t('scanner.analyzing', language)}
                  </Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <Sparkles size={20} color={colors.onPrimary || '#FFFFFF'} style={{ marginRight: 8 }} />
                  <Text style={[styles.analyzeBtnText, { color: colors.onPrimary || '#FFFFFF' }]}>
                    {!imageUri && !userNotes.trim()
                      ? language === 'hi'
                        ? 'फोटो लें या लक्षण बताएं'
                        : 'Snap Photo or Speak Symptoms'
                      : 'Run AI Diagnosis'}
                  </Text>
                </View>
              )}
            </Pressable>
          )}

          {/* Scan Results Breakdown */}
          {scanResult && (
            <View style={styles.resultsContainer}>
              {/* Mandatory Compliance Disclaimer Note */}
              <View style={[styles.disclaimerBox, { backgroundColor: isDark ? '#3D2800' : '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Info size={16} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.disclaimerText}>
                  {t('scanner.disclaimerNote', language)}
                </Text>
              </View>

              {/* Crop Attachment Confirmation or 1-Tap Add to Portfolio */}
              {selectedCropId ? (
                <View style={[styles.cropAttachedBanner, { backgroundColor: colors.accentBg, borderColor: colors.border }]}>
                  <CheckCircle2 size={16} color={colors.primary} />
                  <Text style={[styles.cropAttachedText, { color: colors.primary }]}>
                    Linked to your tracked crop: {userCrops.find(c => c.id === selectedCropId)?.name || 'Selected Crop'}
                  </Text>
                </View>
              ) : scanResult.crop ? (
                <View style={[styles.addCropPromptCard, { backgroundColor: colors.accentBg, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.addCropPromptHeader}>
                      <Leaf size={14} color={colors.primary} />
                      <Text style={[styles.addCropPromptTitle, { color: colors.primary }]}>
                        Detected: {scanResult.crop}
                      </Text>
                    </View>
                    <Text style={[styles.addCropPromptSub, { color: colors.textSecondary }]}>
                      Add this {scanResult.crop} to your portfolio to track its recovery and growth stages.
                    </Text>
                  </View>
                  <Pressable
                    style={[
                      styles.addCropPromptBtn,
                      { backgroundColor: colors.primary },
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
              <View style={[styles.diagnosisCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <View style={styles.badgeRow}>
                  <View style={[styles.pathogenBadge, { backgroundColor: colors.pillBg }]}>
                    <Text style={[styles.pathogenBadgeText, { color: colors.textSecondary }]}>
                      {scanResult.pathogenType}
                    </Text>
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
                  <View style={[styles.confidenceBadge, { backgroundColor: colors.accentBg }]}>
                    <Text style={[styles.confidenceBadgeText, { color: colors.primary }]}>
                      {scanResult.confidenceScore.toFixed(1)}% Match
                    </Text>
                  </View>
                </View>

                <Text style={[styles.diseaseName, { color: colors.textPrimary }]}>{scanResult.diseaseName}</Text>
                {scanResult.scientificName && (
                  <Text style={[styles.scientificName, { color: colors.textMuted }]}>{scanResult.scientificName}</Text>
                )}

                {scanResult.advisoryNote && (
                  <View style={[styles.advisoryBox, { backgroundColor: colors.pillBg, borderLeftColor: colors.primary }]}>
                    <Text style={[styles.advisoryText, { color: colors.textPrimary }]}>{scanResult.advisoryNote}</Text>
                  </View>
                )}
              </View>

              {/* Symptoms */}
              {scanResult.symptoms.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.cardHeader, { color: colors.textPrimary }]}>Identified Symptoms</Text>
                  {scanResult.symptoms.map((s, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.bulletText, { color: colors.textPrimary }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Organic Remedies */}
              {scanResult.organicRemedies.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.remedyHeader}>
                    <Droplets size={18} color={colors.primary} />
                    <Text style={[styles.cardHeader, { color: colors.primary, marginLeft: 6 }]}>
                      Organic & Biological Control
                    </Text>
                  </View>
                  {scanResult.organicRemedies.map((r, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <CheckCircle2 size={15} color={colors.primary} style={{ marginTop: 2 }} />
                      <Text style={[styles.bulletText, { color: colors.textPrimary, marginLeft: 8 }]}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Chemical Treatments */}
              {scanResult.chemicalTreatments.length > 0 && (
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.remedyHeader}>
                    <ShieldCheck size={18} color="#2563EB" />
                    <Text style={[styles.cardHeader, { color: '#2563EB', marginLeft: 6 }]}>
                      Recommended Chemical Spray
                    </Text>
                  </View>
                  {scanResult.chemicalTreatments.map((c, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <CheckCircle2 size={15} color="#2563EB" style={{ marginTop: 2 }} />
                      <Text style={[styles.bulletText, { color: colors.textPrimary, marginLeft: 8 }]}>{c}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.bottomActions}>
                <Pressable
                  style={[styles.consultBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    onClose();
                    onConsultAgronomist?.(scanResult.diseaseName);
                  }}
                >
                  <Stethoscope size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.consultBtnText}>Consult Agronomist</Text>
                </Pressable>

                <Pressable
                  style={[styles.newScanBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setScanResult(null)}
                >
                  <Text style={[styles.newScanBtnText, { color: colors.textPrimary }]}>Scan Another</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  placeholderSubtitle: {
    fontSize: 12,
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
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  captureBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  galleryBtnText: {
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
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  notesCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inlineMicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  inlineMicBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  notesInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
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
    borderWidth: 1,
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
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnText: {
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
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pathogenBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pathogenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  confidenceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  advisoryBox: {
    borderLeftWidth: 3,
    padding: 10,
    borderRadius: 6,
  },
  advisoryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
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
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  newScanBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cropSelectCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
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
    borderWidth: 1,
  },
  cropSelectChipActive: {},
  cropSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cropSelectChipTextActive: {},
  cropAttachedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cropAttachedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addCropPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
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
  },
  addCropPromptSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  addCropPromptBtn: {
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
