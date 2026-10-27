import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Easing,
  Image,
} from 'react-native';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquare,
  Plus,
  Camera,
  AlertTriangle,
  RotateCcw,
  Edit3,
  Check,
  Play,
  Pause,
  Sprout,
  Image as ImageIcon,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  useAudioRecorder,
  createAudioPlayer,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  IOSOutputFormat,
  AudioQuality,
  RecordingOptions,
  AudioPlayer,
} from 'expo-audio';
import {
  sendAssistantMessage,
  uploadMedia,
  getBaseUrl,
  apiRequest,
  AssistantMessageResponse,
} from '../services/apiClient';
import { AppLanguage } from '../types';
import { t } from '../constants/translations';
import { THEME } from '../constants/theme';

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  language: AppLanguage;
  onOpenScanner?: () => void;
  cropId?: string;
}

type VoiceState = 'idle' | 'recording' | 'processing' | 'speaking';

// 24kbps Rural Audio Recording Configuration (AAC / .m4a format at 16kHz Mono)
// 10-second voice note is approximately ~30 KB, ideal for low-bandwidth 2G/3G rural networks
const LOW_BITRATE_RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 24000,
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    sampleRate: 16000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.LOW,
    sampleRate: 16000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 24000,
  },
};

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  onClose,
  language,
  onOpenScanner,
  cropId,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const recorder = useAudioRecorder(LOW_BITRATE_RECORDING_OPTIONS);
  const playerRef = useRef<AudioPlayer | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingDurationSec, setRecordingDurationSec] = useState(0);

  // Conversation & AI Diagnosis State
  const [conversationId, setConversationId] = useState<string>(() => `conv-${Date.now()}`);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [isSynthesizingSpeech, setIsSynthesizingSpeech] = useState(false);
  const [detectedCrop, setDetectedCrop] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isFollowup, setIsFollowup] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [activeIssue, setActiveIssue] = useState<string | null>(null);
  const [hasMemory, setHasMemory] = useState<boolean>(false);
  const [responseSource, setResponseSource] = useState<'gemini_ai' | 'offline_reference' | null>(null);

  // Attached Media / Photo frames state
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  // Transcript Edit / Retry Fallback State
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscriptText, setEditedTranscriptText] = useState('');
  const [textInputQuery, setTextInputQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  // Pulse animation for recording wave state
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const durationTimerRef = useRef<any>(null);

  useEffect(() => {
    if (voiceState === 'recording') {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.35,
              duration: 700,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1.0,
              duration: 700,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0.2,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.7,
              duration: 700,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();

      setRecordingDurationSec(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDurationSec((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      pulseOpacity.setValue(0.6);
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [voiceState]);

  // Clean cleanup on modal close or unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const cleanupAudio = async () => {
    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }
    } catch {
      // ignore
    }
    try {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
      }
    } catch {
      // ignore
    }
    setIsPlayingAudio(false);
  };

  const playAudioUrl = async (audioUri: string) => {
    try {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const fullUri = audioUri.startsWith('http')
        ? audioUri
        : `${getBaseUrl()}${audioUri.startsWith('/') ? '' : '/'}${audioUri}`;

      const newPlayer = createAudioPlayer(fullUri);
      playerRef.current = newPlayer;
      setActiveAudioUrl(fullUri);
      setIsPlayingAudio(true);
      setVoiceState('speaking');

      newPlayer.addListener('playbackStatusUpdate', (status) => {
        if (status.currentTime >= status.duration && status.duration > 0) {
          setIsPlayingAudio(false);
          setVoiceState('idle');
        }
      });

      newPlayer.play();
    } catch (playbackErr) {
      console.warn('[VoiceAssistant] Playback error:', playbackErr);
      setIsPlayingAudio(false);
      setVoiceState('idle');
    }
  };

  const playVoiceResponse = async (b64Audio: string) => {
    try {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const soundUri = `data:audio/mp3;base64,${b64Audio}`;
      const newPlayer = createAudioPlayer(soundUri);
      playerRef.current = newPlayer;
      setIsPlayingAudio(true);
      setVoiceState('speaking');

      newPlayer.addListener('playbackStatusUpdate', (status) => {
        if (status.currentTime >= status.duration && status.duration > 0) {
          setIsPlayingAudio(false);
          setVoiceState('idle');
        }
      });

      newPlayer.play();
    } catch (playbackErr) {
      console.warn('[VoiceAssistant] Playback error:', playbackErr);
      setIsPlayingAudio(false);
      setVoiceState('idle');
    }
  };

  const togglePlayback = () => {
    const player = playerRef.current;
    if (!player) {
      if (activeAudioUrl) {
        playAudioUrl(activeAudioUrl);
      } else if (audioBase64) {
        playVoiceResponse(audioBase64);
      } else if (replyText) {
        handleSpeakText(replyText);
      }
      return;
    }

    try {
      if (player.playing) {
        player.pause();
        setIsPlayingAudio(false);
        setVoiceState('idle');
      } else {
        player.play();
        setIsPlayingAudio(true);
        setVoiceState('speaking');
      }
    } catch {
      if (activeAudioUrl) {
        playAudioUrl(activeAudioUrl);
      } else if (audioBase64) {
        playVoiceResponse(audioBase64);
      }
    }
  };

  const handleSpeakText = async (textToSpeak: string) => {
    if (activeAudioUrl) {
      playAudioUrl(activeAudioUrl);
      return;
    }
    setIsSynthesizingSpeech(true);
    try {
      const resp = await apiRequest<{ audio_base64?: string }>('/v1/voice/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `query_text=${encodeURIComponent(textToSpeak)}&language=${language}&return_audio=false`,
      });
      if (resp?.audio_base64) {
        setAudioBase64(resp.audio_base64);
        playVoiceResponse(resp.audio_base64);
      }
    } catch (e) {
      console.warn('TTS on-demand speech error:', e);
    } finally {
      setIsSynthesizingSpeech(false);
    }
  };

  // Attached Image Pickers (Camera / Gallery)
  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setErrorMsg(
          language === 'hi'
            ? 'गैलरी अनुमति आवश्यक है।'
            : 'Gallery permission is required to attach crop photos.'
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAttachedImages((prev) => [...prev, res.assets[0].uri]);
      }
    } catch (err: any) {
      console.warn('Image picker error:', err);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setErrorMsg(
          language === 'hi'
            ? 'कैमरा अनुमति आवश्यक है।'
            : 'Camera permission is required to take crop photos.'
        );
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setAttachedImages((prev) => [...prev, res.assets[0].uri]);
      }
    } catch (err: any) {
      console.warn('Camera capture error:', err);
    }
  };

  const removeAttachedImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Push-to-Talk / Tap-to-Record Handlers
  const startRecording = async () => {
    setErrorMsg(null);

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setErrorMsg(
          language === 'hi'
            ? 'माइक अनुमति आवश्यक है ताकि आप सवाल पूछ सकें।'
            : 'Microphone permission is required to record voice questions.'
        );
        return;
      }

      // Stop any audio playing
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
        setIsPlayingAudio(false);
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setVoiceState('recording');
    } catch (err: any) {
      setErrorMsg(`Recording error: ${err.message || 'Could not start audio recorder'}`);
      setVoiceState('idle');
    }
  };

  const stopRecordingAndSend = async () => {
    setVoiceState('processing');
    setErrorMsg(null);

    try {
      await recorder.stop();
      const recordedUri = recorder.uri;

      if (!recordedUri) {
        throw new Error('No audio file captured');
      }

      // Execute unified assistant message with voice mode
      await executeUnifiedMessage({
        inputMode: 'voice',
        audioUri: recordedUri,
        text: textInputQuery.trim() || undefined,
        imageUris: attachedImages,
      });
    } catch (err: any) {
      setErrorMsg(`Audio processing failed: ${err.message}`);
      setVoiceState('idle');
    }
  };

  const handleMicTap = () => {
    if (voiceState === 'recording') {
      stopRecordingAndSend();
    } else if (voiceState === 'idle' || voiceState === 'speaking') {
      startRecording();
    }
  };

  // Unified Assistant Pipeline: Funnels all entry points into POST /v1/assistant/message
  const executeUnifiedMessage = async (params: {
    inputMode: 'voice' | 'text';
    audioUri?: string;
    text?: string;
    imageUris?: string[];
  }) => {
    setVoiceState('processing');
    setErrorMsg(null);

    try {
      let audioMediaId: string | null = null;
      let imageMediaIds: string[] = [];

      // 1. Upload audio if present
      if (params.audioUri) {
        const audioUpload = await uploadMedia(params.audioUri, 'voice_notes');
        audioMediaId = audioUpload.media_id;
      }

      // 2. Upload any attached images / video frames
      if (params.imageUris && params.imageUris.length > 0) {
        for (const imgUri of params.imageUris) {
          const imgUpload = await uploadMedia(imgUri, 'specimens');
          if (imgUpload.media_id) {
            imageMediaIds.push(imgUpload.media_id);
          }
        }
      }

      // 3. Call Unified Message Endpoint
      const response: AssistantMessageResponse = await sendAssistantMessage({
        conversation_id: conversationId,
        input_mode: params.inputMode,
        audio_media_id: audioMediaId,
        image_media_ids: imageMediaIds.length > 0 ? imageMediaIds : null,
        text: params.text || null,
        language: language,
        crop_id: cropId || null,
      });

      const detectedTranscript =
        response.transcript || params.text || (params.audioUri ? 'Voice Note' : '');
      const reply = response.reply_text || '';

      setTranscript(detectedTranscript);
      setEditedTranscriptText(detectedTranscript);
      setReplyText(reply);
      setConfidence(response.confidence ?? 0.85);
      setIsFollowup(Boolean(response.is_followup));
      setFollowUpQuestion(response.follow_up_question || null);
      setDetectedCrop(response.detected_crop || null);
      setActiveAudioUrl(response.audio_url || null);
      setResponseSource((response.source as any) || 'gemini_ai');
      setAttachedImages([]);
      setTextInputQuery('');

      // If voice reply returned an audio_url, play it immediately!
      if (response.audio_url) {
        await playAudioUrl(response.audio_url);
      } else {
        setVoiceState('idle');
      }
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          (language === 'hi'
            ? 'सहायक से उत्तर प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।'
            : 'Failed to process assistant message. Please try again.')
      );
      setVoiceState('idle');
    }
  };

  const handleRetryWithEditedTranscript = async () => {
    if (!editedTranscriptText.trim()) return;
    setIsEditingTranscript(false);
    await executeUnifiedMessage({
      inputMode: 'text',
      text: editedTranscriptText.trim(),
      imageUris: attachedImages,
    });
  };

  const handleQuickQuestion = async (q: string) => {
    setTextInputQuery('');
    setTranscript(q);
    setEditedTranscriptText(q);
    await executeUnifiedMessage({
      inputMode: 'text',
      text: q,
      imageUris: attachedImages,
    });
  };

  const handleClose = async () => {
    await cleanupAudio();
    setVoiceState('idle');
    setTranscript(null);
    setReplyText(null);
    setAudioBase64(null);
    setActiveAudioUrl(null);
    setDetectedCrop(null);
    setActiveIssue(null);
    setErrorMsg(null);
    setTextInputQuery('');
    setIsEditingTranscript(false);
    setAttachedImages([]);
    onClose();
  };


  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <Sparkles size={22} color="#1D4ED8" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.headerMainTitle}>{t('voice.title', language)}</Text>
                <Text style={styles.headerTagline}>
                  {language === 'hi' ? '24kbps लो-बैंडविड्थ वॉइस AI' : 'Low-Bandwidth Voice Doctor'}
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
              <X size={22} color={THEME.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            {/* Title Greeting */}
            <View style={styles.greetingCenter}>
              <Text style={styles.greetingTitle}>
                {language === 'hi' ? 'नमस्ते किसान मित्र,' : 'Hello Farmer,'}
              </Text>
              <Text style={styles.greetingSubtitle}>
                {language === 'hi' ? 'आपकी क्या सहायता करूँ?' : 'How can I assist your crop today?'}
              </Text>
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

            {/* Listening / Recording State Visual Feedback (Waveform Animation) */}
            {voiceState === 'recording' && (
              <View style={styles.recordingFeedbackContainer}>
                <View style={styles.pulseWrapper}>
                  <Animated.View
                    style={[
                      styles.pulseRing,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseOpacity,
                      },
                    ]}
                  />
                  <View style={styles.pulseInnerCircle}>
                    <Mic size={32} color="#FFFFFF" />
                  </View>
                </View>

                <Text style={styles.recordingFeedbackTitle}>
                  {t('voice.listening', language)}
                </Text>
                <Text style={styles.recordingTimer}>{formatTimer(recordingDurationSec)}</Text>
                <Text style={styles.recordingFeedbackHint}>
                  {t('voice.tapToStop', language)}
                </Text>
              </View>
            )}

            {/* Processing State */}
            {voiceState === 'processing' && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#1D4ED8" />
                <Text style={styles.processingText}>{t('voice.processing', language)}</Text>
                <Text style={styles.processingSubText}>
                  {language === 'hi'
                    ? 'खेत की मेमोरी और ICAR कृषि सलाह लोड हो रही है...'
                    : 'Fetching farm history & agronomy recommendations...'}
                </Text>
              </View>
            )}

            {/* Conversation Display Area */}
            {transcript && voiceState !== 'recording' && voiceState !== 'processing' && (
              <View style={styles.conversationBox}>
                {/* Detected Context Pill & Low-Confidence Followup Alert */}
                <View style={styles.contextPillRow}>
                  {detectedCrop && (
                    <View style={styles.contextPill}>
                      <Sprout size={13} color="#15803D" />
                      <Text style={styles.contextPillText}>{detectedCrop}</Text>
                    </View>
                  )}
                  {confidence !== null && (
                    <View style={[styles.contextPill, { backgroundColor: isFollowup ? '#FEF3C7' : '#F0FDF4' }]}>
                      <Text style={[styles.contextPillText, { color: isFollowup ? '#B45309' : '#15803D', fontWeight: '700' }]}>
                        {Math.round(confidence * 100)}% {language === 'hi' ? 'सटीकता' : 'Confidence'}
                      </Text>
                    </View>
                  )}
                  {responseSource === 'offline_reference' && (
                    <View style={[styles.contextPill, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1 }]}>
                      <AlertTriangle size={12} color="#DC2626" />
                      <Text style={[styles.contextPillText, { color: '#DC2626', fontWeight: '700' }]}>
                        {language === 'hi' ? 'ऑफ़लाइन संदर्भ (ICAR)' : 'Offline Reference'}
                      </Text>
                    </View>
                  )}
                  {responseSource === 'gemini_ai' && (
                    <View style={[styles.contextPill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1 }]}>
                      <Sparkles size={12} color="#2563EB" />
                      <Text style={[styles.contextPillText, { color: '#2563EB', fontWeight: '700' }]}>
                        {language === 'hi' ? 'लाइव AI निदान' : 'Live AI Diagnosis'}
                      </Text>
                    </View>
                  )}
                  {activeIssue && (
                    <View style={[styles.contextPill, styles.issuePill]}>
                      <AlertTriangle size={12} color="#B45309" />
                      <Text style={[styles.contextPillText, styles.issuePillText]}>{activeIssue}</Text>
                    </View>
                  )}
                </View>

                {/* Follow-up question alert banner if confidence < 0.70 */}
                {isFollowup && (
                  <View style={styles.followupBanner}>
                    <AlertTriangle size={16} color="#B45309" style={{ marginRight: 6 }} />
                    <Text style={styles.followupBannerText}>
                      {language === 'hi'
                        ? 'स्पष्टीकरण आवश्यक (सटीकता < 70%): कृपया नीचे पूछे गए सवाल का जवाब दें'
                        : 'Clarification Needed (<70% Confidence): Please answer the follow-up question below'}
                    </Text>
                  </View>
                )}

                {/* Farmer Spoken Question with Edit / Fallback Option */}
                <View style={styles.userBubble}>
                  <View style={styles.userBubbleHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MessageSquare size={14} color="#475569" />
                      <Text style={styles.userBubbleLabel}>
                        {language === 'hi' ? 'आपका सवाल' : 'Your Spoken Question'}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.editBtn}
                      onPress={() => setIsEditingTranscript(!isEditingTranscript)}
                      hitSlop={8}
                    >
                      <Edit3 size={14} color="#2563EB" />
                      <Text style={styles.editBtnText}>
                        {isEditingTranscript
                          ? language === 'hi' ? 'रद्द करें' : 'Cancel'
                          : language === 'hi' ? 'सुधारें' : 'Edit'}
                      </Text>
                    </Pressable>
                  </View>

                  {isEditingTranscript ? (
                    <View style={styles.inlineEditBox}>
                      <TextInput
                        style={styles.inlineInput}
                        value={editedTranscriptText}
                        onChangeText={setEditedTranscriptText}
                        multiline
                        placeholder={language === 'hi' ? 'यहाँ सवाल सुधारें...' : 'Edit question here...'}
                      />
                      <Pressable
                        style={styles.askAgainBtn}
                        onPress={handleRetryWithEditedTranscript}
                      >
                        <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.askAgainBtnText}>{t('voice.askAgain', language)}</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.userText}>"{transcript}"</Text>
                  )}
                </View>

                {/* AI Plant Doctor Answer with Audio Playback Controls */}
                {replyText && (
                  <View style={[styles.aiBubble, isFollowup && styles.aiBubbleFollowup]}>
                    <View style={styles.aiHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Sparkles size={16} color={isFollowup ? '#B45309' : '#15803D'} />
                        <Text style={[styles.aiLabel, isFollowup && { color: '#B45309' }]}>
                          {isFollowup
                            ? language === 'hi' ? 'फॉलो-अप स्पष्टीकरण प्रश्न' : 'Follow-up Diagnostic Question'
                            : language === 'hi' ? 'कृषि वैज्ञानिक सलाह' : 'Plant Doctor Agronomy Advice'}
                        </Text>
                      </View>

                      {/* On-demand Speaker / Voice Playback button */}
                      {(activeAudioUrl || audioBase64) ? (
                        <Pressable
                          style={[
                            styles.replayPillBtn,
                            isPlayingAudio && styles.replayPillBtnActive,
                          ]}
                          onPress={togglePlayback}
                        >
                          {isPlayingAudio ? (
                            <>
                              <Pause size={13} color="#FFFFFF" />
                              <Text style={styles.replayPillTextActive}>{t('voice.pause', language)}</Text>
                            </>
                          ) : (
                            <>
                              <RotateCcw size={13} color="#15803D" />
                              <Text style={styles.replayPillText}>{t('voice.replay', language)}</Text>
                            </>
                          )}
                        </Pressable>
                      ) : (
                        <Pressable
                          style={styles.speakerBtn}
                          onPress={() => handleSpeakText(replyText)}
                        >
                          {isSynthesizingSpeech ? (
                            <ActivityIndicator size="small" color="#15803D" />
                          ) : (
                            <>
                              <Volume2 size={14} color="#15803D" />
                              <Text style={styles.speakerBtnText}>
                                {language === 'hi' ? 'सुनें' : 'Listen'}
                              </Text>
                            </>
                          )}
                        </Pressable>
                      )}
                    </View>

                    <Text style={styles.aiText}>{replyText}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Quick Prompts List for Instant Tap */}
            {!transcript && voiceState === 'idle' && (
              <View style={styles.quickSection}>
                <Text style={styles.quickHeading}>{t('voice.quickQuestions', language)}</Text>

                <Pressable
                  style={styles.quickChip}
                  onPress={() =>
                    handleQuickQuestion(
                      language === 'hi'
                        ? 'टमाटर के पत्ते मुड़ रहे हैं और पीले हो रहे हैं'
                        : 'Tomato leaves are curling upward and turning yellow'
                    )
                  }
                >
                  <Text style={styles.quickChipText}>
                    {language === 'hi'
                      ? '🍅 टमाटर के पत्ते पीले व मुड़ रहे हैं'
                      : '🍅 Tomato leaves curling and yellowing'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() =>
                    handleQuickQuestion(
                      language === 'hi'
                        ? 'गेहूं की फसल में फफूंद और काले धब्बे दिख रहे हैं'
                        : 'Wheat crop showing fungus and dark leaf spots'
                    )
                  }
                >
                  <Text style={styles.quickChipText}>
                    {language === 'hi'
                      ? '🌾 गेहूं में फफूंद या काले धब्बों का इलाज'
                      : '🌾 Wheat dark spots / fungus remedy'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() =>
                    handleQuickQuestion(
                      language === 'hi'
                        ? 'फूल और छोटे फल झड़ने से रोकने का उपाय'
                        : 'Best remedy for flower drop in flowering stage'
                    )
                  }
                >
                  <Text style={styles.quickChipText}>
                    {language === 'hi'
                      ? '🌸 फूल झड़ने से रोकने का जैविक उपाय'
                      : '🌸 Stop flower drop during flowering'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.quickChip}
                  onPress={() =>
                    handleQuickQuestion(
                      language === 'hi'
                        ? 'पत्तियों पर सफेद मक्खी और माहू कीट का स्प्रे'
                        : 'Pest spray for aphids and whitefly insects'
                    )
                  }
                >
                  <Text style={styles.quickChipText}>
                    {language === 'hi'
                      ? '🐛 रस चूसक कीड़ों (एफिड्स/सफेद मक्खी) का स्प्रे'
                      : '🐛 Organic spray for sucking pests'}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* Bottom Bar: Push-to-Talk / Tap-to-Record Capsule */}
          <View style={styles.bottomBarContainer}>
            {/* Attached Photo Thumbnail Strip */}
            {attachedImages.length > 0 && (
              <View style={styles.attachedThumbnailStrip}>
                {attachedImages.map((uri, idx) => (
                  <View key={idx} style={styles.attachedThumbWrapper}>
                    <Image source={{ uri }} style={styles.attachedThumbImage} />
                    <Pressable
                      style={styles.attachedThumbRemoveBtn}
                      onPress={() => removeAttachedImage(idx)}
                    >
                      <X size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
                <Text style={styles.attachedCountText}>
                  {attachedImages.length} {language === 'hi' ? 'फोटो संलग्न' : 'attached'}
                </Text>
              </View>
            )}

            <View style={styles.inputCapsule}>
              {/* Camera / Photo Attachment */}
              <Pressable
                style={styles.cameraIconBtn}
                onPress={handleCapturePhoto}
                onLongPress={handlePickImage}
              >
                <Camera size={20} color="#475569" />
              </Pressable>

              <Pressable
                style={[styles.cameraIconBtn, { marginLeft: -6 }]}
                onPress={handlePickImage}
              >
                <ImageIcon size={19} color="#475569" />
              </Pressable>

              <TextInput
                style={styles.capsuleInput}
                placeholder={
                  voiceState === 'recording'
                    ? language === 'hi' ? 'सुन रहे हैं...' : 'Listening...'
                    : language === 'hi' ? 'बोलें या सवाल लिखें...' : 'Speak or type query...'
                }
                placeholderTextColor="#94A3B8"
                value={textInputQuery}
                onChangeText={setTextInputQuery}
                editable={voiceState !== 'recording' && voiceState !== 'processing'}
                onSubmitEditing={() => {
                  if (textInputQuery.trim() || attachedImages.length > 0) {
                    executeUnifiedMessage({
                      inputMode: 'text',
                      text: textInputQuery.trim(),
                      imageUris: attachedImages,
                    });
                  }
                }}
              />

              {/* Push-to-Talk / Tap-to-Record Mic Button or Send Button */}
              {textInputQuery.trim().length > 0 && voiceState === 'idle' ? (
                <Pressable
                  style={[styles.blueMicBtn, { backgroundColor: '#15803D' }]}
                  onPress={() => {
                    executeUnifiedMessage({
                      inputMode: 'text',
                      text: textInputQuery.trim(),
                      imageUris: attachedImages,
                    });
                  }}
                >
                  <Check size={20} color="#FFFFFF" />
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.blueMicBtn,
                    voiceState === 'recording' && styles.micBtnRecording,
                    voiceState === 'speaking' && styles.micBtnSpeaking,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleMicTap}
                >
                  {voiceState === 'processing' ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : voiceState === 'recording' ? (
                    <MicOff size={22} color="#FFFFFF" />
                  ) : voiceState === 'speaking' ? (
                    <Volume2 size={22} color="#FFFFFF" />
                  ) : (
                    <Mic size={22} color="#FFFFFF" />
                  )}
                </Pressable>
              )}
            </View>

            <Text style={styles.bottomHelpHint}>
              {voiceState === 'recording'
                ? t('voice.tapToStop', language)
                : attachedImages.length > 0
                ? language === 'hi' ? 'फोटो के साथ बोलें या भेजें' : 'Speak or send with attached photo'
                : t('voice.tapToStart', language)}
            </Text>
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
    maxHeight: '92%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerTagline: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  body: {
    paddingVertical: 12,
    maxHeight: 400,
  },
  greetingCenter: {
    alignItems: 'center',
    marginVertical: 10,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  greetingSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  greetingDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
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
  recordingFeedbackContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginVertical: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
  },
  pulseWrapper: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#22C55E',
  },
  pulseInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  recordingFeedbackTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#166534',
  },
  recordingTimer: {
    fontSize: 18,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  recordingFeedbackHint: {
    fontSize: 12,
    color: '#4ADE80',
    fontWeight: '600',
    marginTop: 4,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    marginVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    gap: 8,
  },
  processingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 6,
  },
  processingSubText: {
    fontSize: 12,
    color: '#64748B',
  },
  conversationBox: {
    gap: 12,
    marginVertical: 10,
  },
  contextPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 5,
  },
  contextPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  issuePill: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  issuePillText: {
    color: '#B45309',
  },
  userBubble: {
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 16,
    width: '100%',
  },
  userBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userBubbleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  inlineEditBox: {
    marginTop: 6,
    gap: 8,
  },
  inlineInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 56,
  },
  askAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  askAgainBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  userText: {
    fontSize: 14,
    color: '#1E293B',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  aiBubble: {
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  replayPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  replayPillBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  replayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  replayPillTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiText: {
    fontSize: 14,
    color: '#14532D',
    lineHeight: 21,
    fontWeight: '500',
  },
  quickSection: {
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  quickHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    width: '100%',
  },
  quickChipText: {
    fontSize: 13,
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
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 8,
  },
  capsuleInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 6,
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
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  micBtnRecording: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  micBtnSpeaking: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
  },
  buttonPressed: {
    transform: [{ scale: 0.94 }],
  },
  bottomHelpHint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '500',
  },
  followupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  followupBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  aiBubbleFollowup: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  speakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  speakerBtnText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
  },
  attachedThumbnailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  attachedThumbWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#15803D',
  },
  attachedThumbImage: {
    width: '100%',
    height: '100%',
  },
  attachedThumbRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 4,
  },
});

