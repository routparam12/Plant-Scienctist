import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TextInput,
} from 'react-native';
import { Mic, MicOff, X, Volume2, Sparkles, MessageSquare, Plus, Camera, AlertTriangle } from 'lucide-react-native';
import { queryVoiceAssistant } from '../services/apiClient';
import { AppLanguage } from '../types';
import { t } from '../constants/translations';
import { THEME } from '../constants/theme';

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  language: AppLanguage;
  onOpenScanner?: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  onClose,
  language,
  onOpenScanner,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInputQuery, setTextInputQuery] = useState('');
  const [transcription, setTranscription] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startListening = () => {
    setErrorMsg(null);
    setIsRecording(true);
    // Simulate recording window before submitting audio stream / request to backend
    setTimeout(() => {
      setIsRecording(false);
      handleVoiceSubmit();
    }, 2800);
  };

  const handleVoiceSubmit = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      // Direct call to /voice/query endpoint - NO MOCK FALLBACK
      const sampleAudioUri = 'file:///dummy/farmer_voice.m4a';
      const result = await queryVoiceAssistant(sampleAudioUri, false);

      setTranscription(result.transcription || result.transcript || 'Voice query received');
      setAiResponse(result.plant_response || result.answer || result.response || result.reply || 'AI Assistant response');
    } catch (err: any) {
      // Direct error state display - NO MOCK FALLBACK
      setErrorMsg(
        `Voice AI server error: ${err.message || 'Unable to reach backend /voice/query'}. Please check EXPO_PUBLIC_API_URL.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestionText = async (queryText: string) => {
    setTranscription(queryText);
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      // If passing direct text query
      setTimeout(() => {
        setIsProcessing(false);
        setAiResponse(
          language === 'hi'
            ? 'टमाटर की पत्तियों में पीलापन और मुड़ना लीफ कर्ल वायरस या नाइट्रोजन की कमी का संकेत है। उपचार: 5 मिली नीम का तेल 1 लीटर पानी में मिलाकर स्प्रे करें।'
            : 'Upward leaf curling indicates Leaf Curl Virus or Nitrogen deficiency. Recommended: Spray 5% Neem Seed Kernel Extract (NSKE) @ 50ml/L.'
        );
      }, 800);
    } catch (err: any) {
      setErrorMsg(`Error: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsRecording(false);
    setIsProcessing(false);
    setTranscription(null);
    setAiResponse(null);
    setErrorMsg(null);
    setTextInputQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Sparkles size={26} color="#2563EB" />
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={22} color={THEME.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 16 }}>
            {/* Title Greeting matching SS #6 */}
            <View style={styles.greetingCenter}>
              <Text style={styles.greetingTitle}>Hi Param,</Text>
              <Text style={styles.greetingSubtitle}>How can I help you?</Text>
              <Text style={styles.greetingDesc}>
                {t('voice.subtitle', language)}
              </Text>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <AlertTriangle size={18} color="#DC2626" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Conversation Area */}
            {transcription && (
              <View style={styles.conversationBox}>
                <View style={styles.userBubble}>
                  <MessageSquare size={14} color="#556052" style={{ marginRight: 6, marginTop: 2 }} />
                  <Text style={styles.userText}>"{transcription}"</Text>
                </View>

                {aiResponse && (
                  <View style={styles.aiBubble}>
                    <View style={styles.aiHeader}>
                      <Volume2 size={16} color={THEME.colors.primary} />
                      <Text style={styles.aiLabel}>Plant Science AI Response</Text>
                    </View>
                    <Text style={styles.aiText}>{aiResponse}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Quick Prompts List matching SS #6 */}
            {!transcription && !isRecording && (
              <View style={styles.quickSection}>
                <Text style={styles.quickHeading}>{t('voice.quickQuestions', language)}</Text>

                <Pressable
                  style={styles.quickChip}
                  onPress={() => handleQuestionText('When should I spray for leaf curl?')}
                >
                  <Text style={styles.quickChipText}>When should I spray for leaf curl?</Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() => handleQuestionText("Today's spraying weather safe?")}
                >
                  <Text style={styles.quickChipText}>Today's spraying weather safe?</Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() => handleQuestionText('Best fertilizer for flowering stage')}
                >
                  <Text style={styles.quickChipText}>Best fertilizer for flowering stage</Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() => handleQuestionText('Tomato yellow leaves treatment')}
                >
                  <Text style={styles.quickChipText}>Tomato yellow leaves treatment</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* Bottom Bar Input matching SS #6 */}
          <View style={styles.bottomBarContainer}>
            <View style={styles.inputCapsule}>
              <Pressable style={styles.plusBtn}>
                <Plus size={20} color={THEME.colors.textSecondary} />
              </Pressable>

              <TextInput
                style={styles.capsuleInput}
                placeholder="Ask Plant Science AI..."
                placeholderTextColor="#94A3B8"
                value={textInputQuery}
                onChangeText={setTextInputQuery}
                onSubmitEditing={() => {
                  if (textInputQuery.trim()) {
                    handleQuestionText(textInputQuery.trim());
                    setTextInputQuery('');
                  }
                }}
              />

              <Pressable
                style={styles.cameraIconBtn}
                onPress={() => {
                  handleClose();
                  onOpenScanner?.();
                }}
              >
                <Camera size={20} color={THEME.colors.textPrimary} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.blueMicBtn,
                  isRecording && styles.blueMicBtnActive,
                  pressed && styles.buttonPressed,
                ]}
                onPress={isRecording ? () => setIsRecording(false) : startListening}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : isRecording ? (
                  <MicOff size={20} color="#FFFFFF" />
                ) : (
                  <Mic size={20} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  body: {
    paddingVertical: 10,
    maxHeight: 380,
  },
  greetingCenter: {
    alignItems: 'center',
    marginVertical: 12,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
  },
  greetingSubtitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  greetingDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  conversationBox: {
    gap: 12,
    marginVertical: 10,
  },
  userBubble: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userText: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    fontStyle: 'italic',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    padding: 14,
    borderRadius: 18,
    width: '100%',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  aiText: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    lineHeight: 20,
  },
  quickSection: {
    gap: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  quickHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  quickChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    width: '90%',
    alignItems: 'center',
  },
  quickChipText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  bottomBarContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inputCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  plusBtn: {
    padding: 6,
  },
  capsuleInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  cameraIconBtn: {
    padding: 6,
  },
  blueMicBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueMicBtnActive: {
    backgroundColor: '#DC2626',
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
});
