import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Sparkles, MapPin, Check, ArrowRight } from 'lucide-react-native';
import { updateProfile, completeOnboarding, createUserCrop } from '../services/apiClient';
import { AppLanguage } from '../types';

interface QuickSetupModalProps {
  visible: boolean;
  language: AppLanguage;
  onComplete: () => void;
  onSkip: () => void;
  userEmail?: string;
}

const COMMON_CROPS = [
  { id: 'crop-tomato', name: 'Tomato', hindi: 'टमाटर', marathi: 'टोमॅटो', icon: '🍅' },
  { id: 'crop-wheat', name: 'Wheat', hindi: 'गेहूँ', marathi: 'गहू', icon: '🌾' },
  { id: 'crop-paddy', name: 'Rice / Paddy', hindi: 'धान', marathi: 'भात', icon: '🍚' },
  { id: 'crop-onion', name: 'Onion', hindi: 'प्याज़', marathi: 'कांदा', icon: '🧅' },
  { id: 'crop-potato', name: 'Potato', hindi: 'आलू', marathi: 'बटाटा', icon: '🥔' },
  { id: 'crop-cotton', name: 'Cotton', hindi: 'कपास', marathi: 'कापूस', icon: '🌿' },
  { id: 'crop-chilli', name: 'Chilli', hindi: 'मिर्च', marathi: 'मिरची', icon: '🌶️' },
  { id: 'crop-soybean', name: 'Soybean', hindi: 'सोयाबीन', marathi: 'सोयाबीन', icon: '🌱' },
];

export const QuickSetupModal: React.FC<QuickSetupModalProps> = ({
  visible,
  language,
  onComplete,
  onSkip,
  userEmail,
}) => {
  const defaultName = userEmail ? userEmail.split('@')[0] : '';
  const [fullName, setFullName] = useState(defaultName);
  const [location, setLocation] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCrop = (cropId: string) => {
    setSelectedCrops((prev) =>
      prev.includes(cropId) ? prev.filter((id) => id !== cropId) : [...prev, cropId]
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // 1. Parse location (e.g. "Baramati, Pune")
      const locParts = location.split(',').map((p) => p.trim());
      const village = locParts[0] || undefined;
      const district = locParts[1] || locParts[0] || undefined;

      // 2. Save profile details
      await updateProfile({
        full_name: fullName.trim() || defaultName || 'Farmer',
        village,
        district,
        preferred_language: language,
      });

      // 3. Create initial user crops for any selected crops
      for (const cropId of selectedCrops) {
        const cropObj = COMMON_CROPS.find((c) => c.id === cropId);
        if (cropObj) {
          try {
            await createUserCrop({
              crop_type_id: cropObj.id,
              custom_name: cropObj.name,
              source: 'manual',
            });
          } catch (cropErr) {
            console.warn(`Could not seed initial crop ${cropObj.name}:`, cropErr);
          }
        }
      }

      // 4. Mark onboarding completed
      try {
        await completeOnboarding();
      } catch {
        // Ignore if already marked or optional fields missing
      }

      onComplete();
    } catch (e) {
      console.warn('Quick setup save error:', e);
      // Even on non-critical error, let the farmer proceed to HomeScreen
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onSkip}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContent}>
          {/* Decorative Drag Handle */}
          <View style={styles.handleBar} />

          {/* Welcome Eyebrow & Headline */}
          <View style={styles.header}>
            <View style={styles.eyebrowBadge}>
              <Sparkles size={13} color="#2E7D32" />
              <Text style={styles.eyebrowText}>
                {language === 'hi' ? 'स्वागत है' : 'WELCOME'}
              </Text>
            </View>
            <Text style={styles.title}>
              {language === 'hi'
                ? 'नमस्ते! आपके खेत की शुरुआत करें'
                : 'Welcome! Set Up Your Farm'}
            </Text>
            <Text style={styles.subtitle}>
              {language === 'hi'
                ? 'हम आपको किस नाम से पुकारें और आप क्या उगाते हैं?'
                : 'What should we call you, and what are you growing?'}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
            {/* 1. Name Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {language === 'hi' ? 'आपका नाम' : 'Your Name'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder={language === 'hi' ? 'उदा. रमेश पाटिल' : 'e.g. Ramesh Patil'}
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* 2. Location Input */}
            <View style={styles.fieldContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <MapPin size={13} color="#64748B" />
                <Text style={styles.fieldLabel}>
                  {language === 'hi'
                    ? 'गाँव या ज़िला (वैकल्पिक)'
                    : 'Village or District (Optional)'}
                </Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder={
                  language === 'hi' ? 'उदा. बारामती, पुणे' : 'e.g. Baramati, Pune'
                }
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* 3. Crop Selector Chips */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {language === 'hi'
                  ? 'आप क्या उगा रहे हैं? (चुनें)'
                  : 'What do you grow? (Select any)'}
              </Text>
              <View style={styles.cropChipsGrid}>
                {COMMON_CROPS.map((crop) => {
                  const isSelected = selectedCrops.includes(crop.id);
                  const cropLabel =
                    language === 'hi'
                      ? crop.hindi
                      : crop.name;

                  return (
                    <Pressable
                      key={crop.id}
                      style={[styles.cropChip, isSelected && styles.cropChipSelected]}
                      onPress={() => toggleCrop(crop.id)}
                    >
                      <Text style={styles.cropIcon}>{crop.icon}</Text>
                      <Text
                        style={[styles.cropChipText, isSelected && styles.cropChipTextSelected]}
                      >
                        {cropLabel}
                      </Text>
                      {isSelected && <Check size={12} color="#FFFFFF" style={{ marginLeft: 2 }} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Action Footer: Save & Zero-friction Skip */}
          <View style={styles.actionRow}>
            <Pressable style={styles.skipBtn} onPress={onSkip} disabled={isSubmitting}>
              <Text style={styles.skipBtnText}>
                {language === 'hi' ? 'अभी छोड़ें' : 'Skip for now'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveBtnText}>
                    {language === 'hi'
                      ? 'शुरू करें'
                      : 'Get Started'}
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    marginBottom: 16,
  },
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  cropChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cropChipSelected: {
    backgroundColor: '#0D6832',
    borderColor: '#0D6832',
  },
  cropIcon: {
    fontSize: 14,
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  cropChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#0D6832',
    shadowColor: '#0D6832',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
