import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { TabType, AppLanguage } from './src/types';
import { authStorage } from './src/services/authStorage';
import { CradleBottomNav } from './src/components/CradleBottomNav';
import { OnboardingLoginModal } from './src/components/OnboardingLoginModal';
import { DiagnosticScannerModal } from './src/components/DiagnosticScannerModal';
import { VoiceAssistantModal } from './src/components/VoiceAssistantModal';
import { AddCropModal } from './src/components/AddCropModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { CropScreen as DoctorScreen } from './src/screens/Crop';
import { ExpertScreen as AppointmentScreen } from './src/screens/Expert';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { QuickSetupModal } from './src/components/QuickSetupModal';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { THEME } from './src/constants/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>
            {this.state.error?.message || 'An unexpected error occurred in the application.'}
          </Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retryBtnText}>Reload App</Text>
          </Pressable>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function MainAppContent() {
  const { isDark, colors } = useTheme();
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [language, setLanguage] = useState<AppLanguage>('hi');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAddCropOpen, setIsAddCropOpen] = useState(false);
  const [activeFarmId, setActiveFarmId] = useState<string>('default-farm');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isExploringGuest, setIsExploringGuest] = useState(false);
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsAuthChecking(true);
    try {
      const savedLang = await authStorage.getLanguage();
      if (savedLang) {
        setLanguage(savedLang);
      }
      const user = await authStorage.getUser();
      if (user) {
        setCurrentUser(user);
        if (user.preferred_language === 'en' || user.preferred_language === 'hi') {
          setLanguage(user.preferred_language);
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleLanguageChange = async (newLang: AppLanguage) => {
    setLanguage(newLang);
    await authStorage.saveLanguage(newLang);
  };

  const handleOpenAddCrop = (farmId: string) => {
    setActiveFarmId(farmId);
    setIsAddCropOpen(true);
  };

  const handleLogout = async () => {
    await authStorage.clearSession();
    setCurrentUser(null);
    setIsExploringGuest(false);
  };

  // 1. Initial Loading Spinner Container
  if (isAuthChecking) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ExpoStatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.primary }]}>Plant Scientist 🪻</Text>
      </SafeAreaView>
    );
  }

  // 2. Strict Entry Gate: Full-Screen Onboarding Landing Page
  if (!currentUser && !isExploringGuest) {
    return (
      <SafeAreaView style={[styles.landingRoot, { backgroundColor: colors.bg }]}>
        <ExpoStatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingLoginModal
          visible={true}
          language={language}
          onLanguageChange={handleLanguageChange}
          onExploreGuest={() => setIsExploringGuest(true)}
          onLoginSuccess={(user, isNewUser) => {
            setCurrentUser(user);
            setIsExploringGuest(false);
            if (isNewUser) {
              setIsQuickSetupOpen(true);
            }
          }}
        />
      </SafeAreaView>
    );
  }

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeScreen
            key={`home-${refreshKey}`}
            language={language}
            onOpenAddCrop={handleOpenAddCrop}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onNavigateToTab={setCurrentTab}
          />
        );
      case 'doctor':
        return (
          <DoctorScreen
            key={`doctor-${refreshKey}`}
            language={language}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAddCrop={() => handleOpenAddCrop(activeFarmId)}
          />
        );
      case 'appointment':
        return <AppointmentScreen language={language} />;
      case 'profile':
        return (
          <ProfileScreen
            language={language}
            onLanguageChange={handleLanguageChange}
            onOpenLogin={() => setIsLoginOpen(true)}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ExpoStatusBar style={isDark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        {/* Active Screen Tab */}
        <View style={styles.screenContainer}>
          {renderActiveTab()}
        </View>

        {/* Global Cradle Bottom Navigation Bar */}
        <CradleBottomNav
          currentTab={currentTab}
          language={language}
          onTabChange={setCurrentTab}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenVoice={() => setIsVoiceOpen(true)}
        />

        {/* Modals */}
        <OnboardingLoginModal
          visible={isLoginOpen}
          language={language}
          onLanguageChange={handleLanguageChange}
          onClose={() => setIsLoginOpen(false)}
          onExploreGuest={() => {
            setIsLoginOpen(false);
            setIsExploringGuest(true);
          }}
          onLoginSuccess={(user, isNewUser) => {
            setCurrentUser(user);
            setIsLoginOpen(false);
            setIsExploringGuest(false);
            if (isNewUser) {
              setIsQuickSetupOpen(true);
            }
          }}
        />

        <DiagnosticScannerModal
          visible={isScannerOpen}
          onClose={() => {
            setIsScannerOpen(false);
            setRefreshKey((k) => k + 1);
          }}
          language={language}
          onConsultAgronomist={() => {
            setCurrentTab('appointment');
          }}
        />

        <VoiceAssistantModal
          visible={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          language={language}
        />

        <AddCropModal
          visible={isAddCropOpen}
          farmId={activeFarmId}
          onClose={() => setIsAddCropOpen(false)}
          onCropAdded={() => {
            setIsAddCropOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />

        <QuickSetupModal
          visible={isQuickSetupOpen}
          language={language}
          userEmail={currentUser?.email}
          onComplete={() => {
            setIsQuickSetupOpen(false);
            setRefreshKey((k) => k + 1);
          }}
          onSkip={() => {
            setIsQuickSetupOpen(false);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <MainAppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F9F5',
  },
  landingRoot: {
    flex: 1,
    backgroundColor: '#F6FBF7',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F6FBF7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D6832',
    marginTop: 8,
  },
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F7F9F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#556052',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
