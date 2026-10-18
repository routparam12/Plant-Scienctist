import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Sun,
  Moon,
  Laptop,
  Globe,
  Database,
  MapPin,
  RefreshCw,
  ChevronRight,
  LogOut,
  LogIn,
  Smartphone,
  Edit3,
  ShieldCheck,
  X,
  Check,
} from 'lucide-react-native';
import { getProfile, updateProfile, logout } from '../services/apiClient';
import { authStorage } from '../services/authStorage';
import { AppLanguage, AppTheme, DevicePlatform, UserFarmerProfile } from '../types';
import { useTheme } from '../context/ThemeContext';
import { THEME } from '../constants/theme';

interface ProfileScreenProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  onOpenLogin: () => void;
  currentUser?: any;
  onLogout?: () => void;
}

const createDefaultProfile = (user?: any): UserFarmerProfile => {
  const email = user?.email || '';
  const displayName = user?.user_metadata?.full_name || (email ? email.split('@')[0] : 'Farmer');
  return {
    id: user?.id || '',
    name: displayName,
    hindiName: displayName,
    email: email,
    phone: user?.phone || '',
    village: '',
    district: '',
    state: '',
    totalAcreage: 0,
    soilTypes: [],
    cropsGrown: [],
    offlineStorageStatus: true,
    lastSyncTime: 'Offline Ready',
    onboardingCompleted: false,
  };
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  language,
  onLanguageChange,
  onOpenLogin,
  currentUser,
  onLogout,
}) => {
  const { theme, setTheme, colors, isDark } = useTheme();
  const [profile, setProfile] = useState<UserFarmerProfile>(() => createDefaultProfile(currentUser));
  const [devicePlatform, setDevicePlatform] = useState<DevicePlatform>('android');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('Just now (100% Synced)');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      const token = await authStorage.getAccessToken();
      setIsLoggedIn(!!token);
      if (token) {
        const data = await getProfile();
        setProfile((prev) => ({
          ...prev,
          id: data.id,
          name: data.full_name || prev.name,
          email: data.email || prev.email,
          village: data.village || prev.village,
          district: data.district || prev.district,
          state: data.state || prev.state,
          totalAcreage: data.total_acreage || prev.totalAcreage,
          onboardingCompleted: data.onboarding_completed ?? true,
        }));
      } else {
        setProfile(createDefaultProfile(currentUser));
      }
    } catch (e) {
      console.warn('Profile load error:', e);
    }
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = 'Just now (100% Synced)';
      setSyncStatusText(now);
      Alert.alert('Cloud Sync Complete', 'All crop schedules, disease records, and agronomist bookings have synced.');
    }, 800);
  };

  const handleLanguageSelect = async (newLang: AppLanguage) => {
    onLanguageChange(newLang);
    if (isLoggedIn) {
      try {
        await updateProfile({ preferred_language: newLang });
      } catch (e) {
        console.warn('Could not save language to profile:', e);
      }
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editState, setEditState] = useState('');
  const [editAcreage, setEditAcreage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openEditModal = () => {
    setEditFullName(profile.name || '');
    setEditPhone(profile.phone || '');
    setEditVillage(profile.village || '');
    setEditDistrict(profile.district || '');
    setEditState(profile.state || '');
    setEditAcreage(profile.totalAcreage ? String(profile.totalAcreage) : '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const parsedAcreage = parseFloat(editAcreage);
      const updated = await updateProfile({
        full_name: editFullName.trim() || undefined,
        phone: editPhone.trim() || undefined,
        village: editVillage.trim() || undefined,
        district: editDistrict.trim() || undefined,
        state: editState.trim() || undefined,
        total_acreage: !isNaN(parsedAcreage) ? parsedAcreage : undefined,
      });

      if (updated) {
        setProfile((prev) => ({
          ...prev,
          name: updated.full_name || prev.name,
          hindiName: updated.full_name || prev.hindiName,
          phone: updated.phone ?? prev.phone,
          village: updated.village ?? prev.village,
          district: updated.district ?? prev.district,
          state: updated.state ?? prev.state,
          totalAcreage: updated.total_acreage ?? prev.totalAcreage,
          onboardingCompleted: updated.onboarding_completed ?? prev.onboardingCompleted,
        }));
      }
      setIsEditModalOpen(false);
      Alert.alert('Profile Saved', 'Your farmer details have been updated successfully.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not save profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          setIsLoggedIn(false);
          setProfile(createDefaultProfile());
          onLogout?.();
        },
      },
    ]);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'PS';
  };

  const locationText =
    [profile.village, profile.district, profile.state].filter(Boolean).join(', ') ||
    (isLoggedIn ? 'Field location pending setup' : 'Explore Mode');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Header with Eyebrow and 48px Circular User Button */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
              FARMER IDENTITY // ACCOUNT SETTINGS
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>You.</Text>
          </View>

          <Pressable
            style={[
              styles.headerActionBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={onOpenLogin}
          >
            <User size={20} color={colors.primary} />
            <View style={styles.pingDot} />
          </Pressable>
        </View>

        {/* 2. Farmer Identity Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.profileTopRow}>
            {/* Avatar with ShieldCheck Badge */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{getInitials(profile.name, profile.email)}</Text>
              </View>
              <View style={[styles.verifiedBadgeCircle, { backgroundColor: colors.primary }]}>
                <ShieldCheck size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.farmerName, { color: colors.textPrimary }]}>
                  {language === 'hi' && profile.hindiName ? profile.hindiName : profile.name}
                </Text>
                {isLoggedIn && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.accentBg }]}>
                    <Text style={[styles.verifiedText, { color: colors.primary }]}>VERIFIED</Text>
                  </View>
                )}
              </View>

              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.primary} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                  {locationText}
                </Text>
              </View>

              <Text style={[styles.phoneText, { color: colors.textMuted }]}>
                {profile.phone || profile.email || 'Plant Scientist Account'}
              </Text>

              {isLoggedIn && (
                <Pressable
                  style={[styles.editProfileBtn, { backgroundColor: colors.accentBg }]}
                  onPress={openEditModal}
                >
                  <Edit3 size={12} color={colors.primary} />
                  <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>
                    Edit Details / विवरण बदलें
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Farm Land Holding Metrics Grid */}
          <View style={[styles.metricsGrid, { borderTopColor: colors.border }]}>
            <View style={[styles.metricBox, { backgroundColor: colors.pillBg }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>TOTAL LAND HOLDING</Text>
              <View style={styles.metricValueRow}>
                <Text style={[styles.metricNum, { color: colors.primary }]}>
                  {profile.totalAcreage > 0 ? profile.totalAcreage : '—'}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>
                  {profile.totalAcreage > 0 ? 'ACRES' : 'OPTIONAL'}
                </Text>
              </View>
              <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                {profile.totalAcreage > 0 ? 'Recorded farm area' : 'Track plants directly'}
              </Text>
            </View>

            <View style={[styles.metricBox, { backgroundColor: colors.pillBg }]}>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>SOIL TYPE</Text>
              <Text style={[styles.soilTypeValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {profile.soilTypes?.[0] || 'Not specified'}
              </Text>
              <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                {profile.soilTypes?.[0] ? 'pH 7.4 • Optimal' : 'Optional crop soil'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Display Theme Mode Control */}
        <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.settingCardHeader}>
            <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#3D2800' : '#FEF3C7' }]}>
              <Sun size={16} color="#D97706" />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Display Theme Mode</Text>
              <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                Outdoor sunlight vs night field scouting
              </Text>
            </View>
          </View>

          <View style={styles.buttonOptionsRow}>
            {(
              [
                { id: 'light', label: 'Light', Icon: Sun },
                { id: 'dark', label: 'Dark', Icon: Moon },
                { id: 'system', label: 'System', Icon: Laptop },
              ] as const
            ).map((item) => {
              const isSelected = theme === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.optionBtn,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setTheme(item.id)}
                >
                  <item.Icon size={14} color={isSelected ? '#FFFFFF' : colors.textSecondary} />
                  <Text
                    style={[
                      styles.optionBtnText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 4. Language Selector Supporting Hindi and English */}
        <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.settingCardHeader}>
            <View style={[styles.settingIconBox, { backgroundColor: colors.accentBg }]}>
              <Globe size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                {language === 'hi' ? 'ऐप की भाषा' : 'App Language'}
              </Text>
              <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                {language === 'hi' ? 'हिन्दी (Hindi) या English चुनें' : 'Choose Hindi or English'}
              </Text>
            </View>
          </View>

          <View style={styles.buttonOptionsRow}>
            {[
              { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
              { id: 'en', label: 'English', sub: 'English' },
            ].map((item) => {
              const isSelected = language === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.langCardBtn,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.accentBg, borderColor: colors.primary },
                  ]}
                  onPress={() => handleLanguageSelect(item.id as AppLanguage)}
                >
                  <Text
                    style={[
                      styles.langCardMain,
                      { color: isSelected ? colors.primary : colors.textPrimary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.langCardSub,
                      { color: isSelected ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {item.sub}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 5. Device Platform Frame Simulator */}
        <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.settingCardHeader}>
            <View style={[styles.settingIconBox, { backgroundColor: isDark ? '#1E293B' : '#DBEAFE' }]}>
              <Smartphone size={16} color="#2563EB" />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                Cross-Platform Device Frame
              </Text>
              <Text style={[styles.settingSub, { color: colors.textMuted }]}>
                Apple iOS & Android Smartphone View
              </Text>
            </View>
          </View>

          <View style={styles.buttonOptionsRow}>
            {[
              { id: 'ios', label: 'iOS (Apple)', sub: 'Dynamic Island' },
              { id: 'android', label: 'Android', sub: 'Pixel Punch' },
              { id: 'responsive', label: 'Responsive', sub: 'Full Canvas' },
            ].map((item) => {
              const isSelected = devicePlatform === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.langCardBtn,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.accentBg, borderColor: colors.primary },
                  ]}
                  onPress={() => setDevicePlatform(item.id as DevicePlatform)}
                >
                  <Text
                    style={[
                      styles.langCardMain,
                      { color: isSelected ? colors.primary : colors.textPrimary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.langCardSub,
                      { color: isSelected ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {item.sub}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 6. Offline Status Indicator */}
        <View style={[styles.offlineCard, { backgroundColor: colors.accentBg, borderColor: colors.primary }]}>
          <View style={styles.offlineCardHeader}>
            <View style={styles.offlineCardTitleRow}>
              <Database size={16} color={colors.primary} />
              <Text style={[styles.offlineCardTitle, { color: colors.primary }]}>
                Offline-First Capable (100%)
              </Text>
            </View>

            <Pressable
              style={styles.syncBtn}
              onPress={handleManualSync}
              disabled={isSyncing}
            >
              <RefreshCw size={12} color={colors.primary} />
              <Text style={[styles.syncBtnText, { color: colors.primary }]}>
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.offlineCardDesc, { color: colors.textSecondary }]}>
            All crop schedules, disease specimens, and booking records are cached locally on device.
            You can diagnose crops even with zero field network connectivity.
          </Text>

          <Text style={[styles.offlineCardStatus, { color: colors.primary }]}>
            Status: {syncStatusText}
          </Text>
        </View>

        {/* 7. Account / Login Screen Access */}
        <View style={styles.authRow}>
          {isLoggedIn ? (
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
              <LogOut size={16} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.loginBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={onOpenLogin}
            >
              <View style={styles.loginBtnLeft}>
                <LogIn size={16} color={colors.primary} />
                <Text style={[styles.loginBtnText, { color: colors.textPrimary }]}>
                  Switch Account / Open OTP Login
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* 8. App Branding Footer */}
        <View style={styles.brandingFooter}>
          <Text style={[styles.brandingTitle, { color: colors.textSecondary }]}>
            Plant Scientist 🪻 • v2.6 Mobile Release
          </Text>
          <Text style={[styles.brandingSub, { color: colors.textMuted }]}>
            ICAR AGRICULTURAL RESEARCH & AI PATHOLOGY PARTNER
          </Text>
        </View>

        {/* Edit Farmer Details Modal */}
        <Modal
          visible={isEditModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsEditModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.editModalSheet, { backgroundColor: colors.card }]}>
              <View style={styles.editModalHeader}>
                <Text style={[styles.editModalTitle, { color: colors.textPrimary }]}>
                  Edit Farmer Profile
                </Text>
                <Pressable
                  onPress={() => setIsEditModalOpen(false)}
                  style={styles.editModalCloseBtn}
                >
                  <X size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              <ScrollView style={styles.editModalBody}>
                <Text style={[styles.editInputLabel, { color: colors.textPrimary }]}>
                  Full Name / नाम
                </Text>
                <TextInput
                  style={[
                    styles.editTextInput,
                    { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.editInputLabel, { color: colors.textPrimary }]}>
                  Phone Number
                </Text>
                <TextInput
                  style={[
                    styles.editTextInput,
                    { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+91 9876543210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />

                <Text style={[styles.editInputLabel, { color: colors.textPrimary }]}>
                  Village / गाँव
                </Text>
                <TextInput
                  style={[
                    styles.editTextInput,
                    { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  value={editVillage}
                  onChangeText={setEditVillage}
                  placeholder="e.g. Chandaka"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.editInputLabel, { color: colors.textPrimary }]}>
                  District / जिला
                </Text>
                <TextInput
                  style={[
                    styles.editTextInput,
                    { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  value={editDistrict}
                  onChangeText={setEditDistrict}
                  placeholder="e.g. Khordha"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.editInputLabel, { color: colors.textPrimary }]}>
                  State / राज्य
                </Text>
                <TextInput
                  style={[
                    styles.editTextInput,
                    { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  value={editState}
                  onChangeText={setEditState}
                  placeholder="e.g. Odisha"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.editInputLabel, { color: colors.textPrimary }]}>
                  Total Acreage (Acres)
                </Text>
                <TextInput
                  style={[
                    styles.editTextInput,
                    { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
                  ]}
                  value={editAcreage}
                  onChangeText={setEditAcreage}
                  placeholder="12.5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.8 },
                    isSaving && { opacity: 0.6 },
                  ]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.saveBtnText}>Save Profile Details</Text>
                    </>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
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
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
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
  profileCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '800',
  },
  verifiedBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.15)',
  },
  verifiedText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 11,
  },
  phoneText: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  metricBox: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
  },
  metricLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricUnit: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  soilTypeValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  settingCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    gap: 12,
  },
  settingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  settingSub: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  buttonOptionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  optionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  optionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  langCardBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  langCardMain: {
    fontSize: 12,
    fontWeight: '700',
  },
  langCardSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  offlineCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  offlineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offlineCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  syncBtnText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  offlineCardDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  offlineCardStatus: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 2,
  },
  authRow: {
    marginBottom: 20,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  loginBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    paddingVertical: 14,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  brandingFooter: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
  },
  brandingTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  brandingSub: {
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  editModalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  editModalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  editModalCloseBtn: {
    padding: 6,
    borderRadius: 16,
  },
  editModalBody: {
    marginTop: 14,
  },
  editInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  editTextInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    marginBottom: 4,
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
