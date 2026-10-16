import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { X, Sprout, Check, Plus, RefreshCw, Calendar } from 'lucide-react-native';
import { createUserCrop, getCropsCatalog } from '../services/apiClient';
import { THEME } from '../constants/theme';

interface AddCropModalProps {
  visible: boolean;
  farmId?: string;
  onClose: () => void;
  onCropAdded: (newCrop?: any) => void;
}

type PlantedTiming = 'unknown' | 'today' | '1week' | '2weeks' | '1month';

export const AddCropModal: React.FC<AddCropModalProps> = ({
  visible,
  onClose,
  onCropAdded,
}) => {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<any | null>(null);
  const [customName, setCustomName] = useState('');
  const [variety, setVariety] = useState('');
  const [acreage, setAcreage] = useState('');
  const [plantedTiming, setPlantedTiming] = useState<PlantedTiming>('today');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadCatalog();
    }
  }, [visible]);

  const loadCatalog = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getCropsCatalog();
      setCatalog(data);
      if (data.length > 0) {
        setSelectedCrop(data[0]);
        setCustomName(data[0].name);
        setVariety(data[0].variety || '');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load crops catalog. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getPlantedDateValue = (timing: PlantedTiming): string | undefined => {
    const now = Date.now();
    if (timing === 'today') {
      return new Date(now).toISOString().split('T')[0];
    } else if (timing === '1week') {
      return new Date(now - 7 * 86400000).toISOString().split('T')[0];
    } else if (timing === '2weeks') {
      return new Date(now - 14 * 86400000).toISOString().split('T')[0];
    } else if (timing === '1month') {
      return new Date(now - 30 * 86400000).toISOString().split('T')[0];
    }
    return undefined; // Don't know / not set
  };

  const handleSubmit = async () => {
    const isCatalog = !!selectedCrop?.id;
    const finalName = isCatalog ? selectedCrop.name : customName.trim();

    if (!isCatalog && !finalName) {
      setErrorMsg('Please specify a crop name.');
      return;
    }

    const acresNum = acreage.trim() ? parseFloat(acreage) : undefined;
    const plantedDate = getPlantedDateValue(plantedTiming);

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await createUserCrop({
        crop_type_id: selectedCrop?.id,
        custom_name: !selectedCrop?.id ? finalName : undefined,
        variety: variety.trim() || undefined,
        acreage: acresNum && acresNum > 0 ? acresNum : undefined,
        planted_date: plantedDate,
        source: 'manual',
      });
      onCropAdded(res);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add crop');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Sprout size={20} color={THEME.colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Add Crop to Your Farm</Text>
                <Text style={styles.subtitle}>फसल जोड़ें • Plant Sowing & Variety</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={THEME.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                {catalog.length === 0 && (
                  <Pressable style={styles.retryBtn} onPress={loadCatalog}>
                    <RefreshCw size={14} color="#DC2626" />
                    <Text style={styles.retryBtnText}>Retry Catalog</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Quick Select from Catalog */}
            <Text style={styles.label}>1. Select Standard Crop (Catalog)</Text>
            {loading ? (
              <ActivityIndicator color={THEME.colors.primary} style={{ marginVertical: 12 }} />
            ) : catalog.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catalogScroll}>
                {catalog.map((c) => {
                  const isSelected = selectedCrop?.id === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      style={[styles.catalogChip, isSelected && styles.catalogChipSelected]}
                      onPress={() => {
                        setSelectedCrop(c);
                        setCustomName(c.name);
                        setVariety(c.variety || '');
                      }}
                    >
                      <Text style={styles.cropIcon}>{c.icon || '🌱'}</Text>
                      <Text style={[styles.cropChipName, isSelected && styles.cropChipNameSelected]}>
                        {c.name.split('(')[0].trim()}
                      </Text>
                      {isSelected && <Check size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Or Custom Crop Name */}
            <Text style={styles.label}>Crop Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Tomato (Abhinav) or Custom Crop"
              placeholderTextColor={THEME.colors.textMuted}
              value={customName}
              onChangeText={(txt) => {
                setCustomName(txt);
                if (selectedCrop && selectedCrop.name !== txt) {
                  setSelectedCrop(null); // Switching to custom
                }
              }}
            />

            {/* Variety */}
            <Text style={styles.label}>Variety / Hybrid (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Syngenta Abhinav F1"
              placeholderTextColor={THEME.colors.textMuted}
              value={variety}
              onChangeText={setVariety}
            />

            {/* When Planted Timing Chips (Replaces Growth Stage) */}
            <View style={styles.timingHeader}>
              <Calendar size={16} color={THEME.colors.primary} />
              <Text style={styles.labelWithIcon}>When was it planted? (बुवाई कब हुई?)</Text>
            </View>
            <View style={styles.timingChipsRow}>
              {[
                { id: 'today', label: 'Today', sub: 'आज' },
                { id: '1week', label: '1 week ago', sub: '१ सप्ताह' },
                { id: '2weeks', label: '2 weeks ago', sub: '२ सप्ताह' },
                { id: '1month', label: 'A month ago', sub: '१ महीना' },
                { id: 'unknown', label: "Don't know", sub: 'तारीख नहीं पता' },
              ].map((item) => {
                const isSelected = plantedTiming === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.timingChip, isSelected && styles.timingChipSelected]}
                    onPress={() => setPlantedTiming(item.id as PlantedTiming)}
                  >
                    <Text style={[styles.timingChipMain, isSelected && styles.timingChipMainSelected]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.timingChipSub, isSelected && styles.timingChipSubSelected]}>
                      {item.sub}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Acreage (Optional) */}
            <Text style={styles.label}>Farm Land Acreage (Optional / ऐच्छिक एकड़)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2.5 (leave blank if not tracking acreage)"
              placeholderTextColor={THEME.colors.textMuted}
              value={acreage}
              onChangeText={setAcreage}
              keyboardType="decimal-pad"
            />

            {/* Submit */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>Add to My Crops (फसल जोड़ें)</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EA',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    marginTop: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 14,
    marginBottom: 6,
  },
  timingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  labelWithIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  catalogScroll: {
    marginBottom: 8,
  },
  catalogChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  catalogChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  cropIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  cropChipName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  cropChipNameSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  timingChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  timingChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timingChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: THEME.colors.primary,
  },
  timingChipMain: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  timingChipMainSelected: {
    color: THEME.colors.primary,
  },
  timingChipSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  timingChipSubSelected: {
    color: '#2E7D32',
  },
  submitBtn: {
    backgroundColor: THEME.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 22,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  retryBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
});
