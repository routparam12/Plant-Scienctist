import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Phone, KeyRound, CheckCircle2, ArrowRight, ShieldCheck, Globe, Info, Sprout } from 'lucide-react-native';
import { requestOtp, verifyOtp } from '../services/apiClient';
import { authStorage } from '../services/authStorage';
import { AppLanguage } from '../types';
import { t } from '../constants/translations';
import { THEME } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface OnboardingLoginModalProps {
  visible: boolean;
  language?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  onClose?: () => void;
  onExploreGuest?: () => void;
  onLoginSuccess: (user: any, isNewUser?: boolean) => void;
  isFullScreen?: boolean;
}

export const OnboardingLoginModal: React.FC<OnboardingLoginModalProps> = ({
  visible,
  language = 'en',
  onLanguageChange,
  onClose,
  onExploreGuest,
  onLoginSuccess,
}) => {
  const [authTab, setAuthTab] = useState<'email' | 'mobile'>('email');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoBannerMsg, setInfoBannerMsg] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(true);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(false);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const cycleLanguage = () => {
    if (!onLanguageChange) return;
    const nextLang: AppLanguage = language === 'en' ? 'hi' : 'en';
    onLanguageChange(nextLang);
  };

  const getLanguageLabel = () => {
    if (language === 'hi') return 'हिंदी';
    return 'English';
  };

  const handleTabSwitch = (tab: 'email' | 'mobile') => {
    setErrorMsg(null);
    setInfoBannerMsg(null);
    setAuthTab(tab);
  };

  const handleSendOtp = async () => {
    setErrorMsg(null);
    setInfoBannerMsg(null);

    if (authTab === 'mobile') {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
      setInfoBannerMsg(t('auth.mobileNotice', language));
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await requestOtp(email.trim().toLowerCase());
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP. Please check your connection or server URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setErrorMsg(null);
    setInfoBannerMsg(null);
    setLoading(true);
    try {
      const result = await verifyOtp(email.trim().toLowerCase(), otp.trim());
      onLoginSuccess(result.user, result.is_new_user ?? false);
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleExplore = () => {
    reset();
    if (onExploreGuest) {
      onExploreGuest();
    } else {
      onClose?.();
    }
  };

  const reset = () => {
    setAuthTab('email');
    setStep('input');
    setEmail('');
    setOtp('');
    setErrorMsg(null);
    setInfoBannerMsg(null);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={handleExplore}>
      <SafeAreaView style={styles.fullScreenContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.mainWrapper}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              keyboardVisible && styles.scrollContentKeyboard,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Top Bar: Language Selector Left, Explore App Right */}
            <View style={[styles.topBar, keyboardVisible && styles.topBarKeyboard]}>
              <Pressable style={styles.langBtn} onPress={cycleLanguage}>
                <Globe size={14} color="#0D6832" />
                <Text style={styles.langBtnText}>{getLanguageLabel()}</Text>
              </Pressable>

              <Pressable style={styles.skipBtn} onPress={handleExplore}>
                <Text style={styles.skipBtnText}>{t('auth.exploreApp', language)} →</Text>
              </Pressable>
            </View>

            {/* Brand Header: Smooth 60fps layout animation */}
            <View style={[styles.brandHeader, keyboardVisible && styles.brandHeaderKeyboard]}>
              <View style={[styles.logoBadge, keyboardVisible && styles.logoBadgeKeyboard]}>
                <Sprout size={keyboardVisible ? 24 : 34} color="#0D6832" />
              </View>
              <Text style={[styles.brandTitle, keyboardVisible && styles.brandTitleKeyboard]}>
                Plant Scientist
              </Text>
              {!keyboardVisible && (
                <Text style={styles.brandSubtitle}>
                  Smart Farming Companion & AI Plant Pathology
                </Text>
              )}
            </View>

            {/* Main White Login Card */}
            <View style={[styles.cardContainer, keyboardVisible && styles.cardContainerKeyboard]}>
              {errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {infoBannerMsg && (
                <View style={styles.infoBox}>
                  <Info size={15} color="#D97706" style={{ marginRight: 6, marginTop: 1 }} />
                  <Text style={styles.infoText}>{infoBannerMsg}</Text>
                </View>
              )}

              {step === 'input' ? (
                <View style={styles.content}>
                  <Text style={styles.cardTitle}>{t('auth.loginTitle', language)}</Text>
                  <Text style={styles.cardSubtitle}>{t('auth.loginSubtitle', language)}</Text>

                  {/* Dual Tab Switcher */}
                  <View style={styles.tabToggleRow}>
                    <Pressable
                      style={[styles.tabBtn, authTab === 'email' && styles.tabBtnActive]}
                      onPress={() => handleTabSwitch('email')}
                    >
                      <Mail
                        size={15}
                        color={authTab === 'email' ? '#0D6832' : '#556052'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.tabBtnText,
                          authTab === 'email' && styles.tabBtnTextActive,
                        ]}
                      >
                        {t('auth.tabEmail', language)}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.tabBtn, authTab === 'mobile' && styles.tabBtnActive]}
                      onPress={() => handleTabSwitch('mobile')}
                    >
                      <Phone
                        size={15}
                        color={authTab === 'mobile' ? '#0D6832' : '#556052'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.tabBtnText,
                          authTab === 'mobile' && styles.tabBtnTextActive,
                        ]}
                      >
                        {t('auth.tabMobile', language)}
                      </Text>
                      <View style={styles.soonPill}>
                        <Text style={styles.soonPillText}>soon</Text>
                      </View>
                    </Pressable>
                  </View>

                  {/* Inputs */}
                  {authTab === 'mobile' ? (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('auth.mobileLabel', language)}</Text>
                      <View style={styles.mobileInputRow}>
                        <View style={styles.countryCodePill}>
                          <Text style={styles.countryCodeText}>+91</Text>
                        </View>
                        <TextInput
                          style={styles.mobileTextInput}
                          placeholder={t('auth.mobilePlaceholder', language)}
                          placeholderTextColor={THEME.colors.textMuted}
                          value={mobileNumber}
                          onChangeText={(val) => {
                            setMobileNumber(val);
                            setErrorMsg(null);
                            setInfoBannerMsg(null);
                          }}
                          keyboardType="phone-pad"
                          maxLength={10}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('auth.emailLabel', language)}</Text>
                      <View style={styles.emailInputRow}>
                        <Mail size={16} color="#0D6832" style={{ marginRight: 8 }} />
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('auth.emailPlaceholder', language)}
                          placeholderTextColor={THEME.colors.textMuted}
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            setErrorMsg(null);
                            setInfoBannerMsg(null);
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>
                  )}

                  {/* Action Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.buttonPressed,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={handleSendOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>{t('auth.sendOtp', language)}</Text>
                        <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </Pressable>

                  {authTab === 'email' && email.trim().length > 3 && (
                    <Pressable
                      style={{ marginTop: 14, alignItems: 'center', paddingVertical: 4 }}
                      onPress={() => {
                        setErrorMsg(null);
                        setStep('otp');
                      }}
                    >
                      <Text style={{ fontSize: 13, color: '#0D6832', fontWeight: '700' }}>
                        {language === 'hi' ? 'पहले से ओटीपी है? यहाँ कोड दर्ज करें →' : 'Already received OTP? Enter code here →'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <View style={styles.content}>
                  <Text style={styles.cardTitle}>{t('auth.verifyTitle', language)}</Text>
                  <Text style={styles.cardSubtitle}>
                    {t('auth.verifySubtitle', language)}{' '}
                    <Text style={{ fontWeight: '700', color: '#0D6832' }}>{email}</Text>
                  </Text>

                  <View style={styles.emailInputRow}>
                    <KeyRound size={18} color="#0D6832" style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.textInput, styles.otpInput]}
                      placeholder="123456"
                      placeholderTextColor={THEME.colors.textMuted}
                      value={otp}
                      onChangeText={(text) => {
                        setOtp(text);
                        setErrorMsg(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.buttonPressed,
                      loading && styles.buttonDisabled,
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryButtonText}>{t('auth.verifyBtn', language)}</Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable onPress={() => setStep('input')} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>{t('auth.backToEmail', language)}</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Footer */}
            {!keyboardVisible && (
              <View style={styles.externalFooter}>
                <View style={styles.footerNote}>
                  <ShieldCheck size={15} color="#0D6832" />
                  <Text style={styles.footerText}>{t('auth.noPassword', language)}</Text>
                </View>

                <Text style={styles.termsText}>{t('auth.termsText', language)}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F6FBF7',
  },
  mainWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  scrollContentKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topBarKeyboard: {
    marginBottom: 4,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    gap: 5,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D6832',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandHeaderKeyboard: {
    marginBottom: 6,
    gap: 6,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoBadgeKeyboard: {
    width: 48,
    height: 48,
    borderRadius: 16,
    marginBottom: 2,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D6832',
  },
  brandTitleKeyboard: {
    fontSize: 20,
  },
  brandSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8DE',
  },
  cardContainerKeyboard: {
    padding: 18,
    borderRadius: 22,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 18,
    lineHeight: 18,
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E8F3EC',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    position: 'relative',
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2.5,
    borderBottomColor: '#0D6832',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#556052',
  },
  tabBtnTextActive: {
    fontWeight: '800',
    color: '#0D6832',
  },
  soonPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginLeft: 4,
  },
  soonPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  mobileInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryCodePill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D6832',
  },
  mobileTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDE3D6',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F5',
    borderWidth: 1.5,
    borderColor: '#DDE3D6',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    color: '#B45309',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  content: {
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    height: 52,
    fontSize: 15,
    color: THEME.colors.textPrimary,
  },
  otpInput: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  primaryButton: {
    backgroundColor: '#0D6832',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    backgroundColor: THEME.colors.primaryDark,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backBtn: {
    alignSelf: 'center',
    marginTop: 10,
    padding: 4,
  },
  backBtnText: {
    fontSize: 12,
    color: '#0D6832',
    fontWeight: '600',
  },
  externalFooter: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 5,
  },
  footerText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 12,
  },
});
