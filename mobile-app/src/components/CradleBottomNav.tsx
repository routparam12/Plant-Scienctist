import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Sprout, Stethoscope, Camera, Calendar, User, Mic } from 'lucide-react-native';
import { AppLanguage, TabType } from '../types';
import { t } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';

interface CradleBottomNavProps {
  currentTab: TabType;
  language?: AppLanguage;
  onTabChange: (tab: TabType) => void;
  onOpenScanner: () => void;
  onOpenVoice: () => void;
}

export const CradleBottomNav: React.FC<CradleBottomNavProps> = ({
  currentTab,
  language = 'en',
  onTabChange,
  onOpenScanner,
  onOpenVoice,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {/* Left Tabs */}
        <Pressable
          style={styles.tabButton}
          onPress={() => onTabChange('home')}
          android_ripple={{ color: isDark ? '#2C352B' : '#E8F5E9', borderless: true }}
        >
          <Sprout
            size={22}
            color={currentTab === 'home' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textMuted },
              currentTab === 'home' && { color: colors.primary, fontWeight: '700' },
            ]}
          >
            {t('nav.home', language)}
          </Text>
        </Pressable>

        <Pressable
          style={styles.tabButton}
          onPress={() => onTabChange('doctor')}
          android_ripple={{ color: isDark ? '#2C352B' : '#E8F5E9', borderless: true }}
        >
          <Stethoscope
            size={22}
            color={currentTab === 'doctor' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textMuted },
              currentTab === 'doctor' && { color: colors.primary, fontWeight: '700' },
            ]}
          >
            {t('nav.crop', language)}
          </Text>
        </Pressable>

        {/* Center Space for Cradle Scanner Button */}
        <View style={styles.centerSpacer} />

        {/* Right Tabs */}
        <Pressable
          style={styles.tabButton}
          onPress={() => onTabChange('appointment')}
          android_ripple={{ color: isDark ? '#2C352B' : '#E8F5E9', borderless: true }}
        >
          <Calendar
            size={22}
            color={currentTab === 'appointment' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textMuted },
              currentTab === 'appointment' && { color: colors.primary, fontWeight: '700' },
            ]}
          >
            {t('nav.expert', language)}
          </Text>
        </Pressable>

        <Pressable
          style={styles.tabButton}
          onPress={() => onTabChange('profile')}
          android_ripple={{ color: isDark ? '#2C352B' : '#E8F5E9', borderless: true }}
        >
          <User
            size={22}
            color={currentTab === 'profile' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textMuted },
              currentTab === 'profile' && { color: colors.primary, fontWeight: '700' },
            ]}
          >
            {t('nav.profile', language)}
          </Text>
        </Pressable>
      </View>

      {/* Center Floating Action Button: Plant Scanner */}
      <View style={styles.fabContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary, borderColor: colors.card },
            pressed && styles.fabPressed,
          ]}
          onPress={onOpenScanner}
        >
          <Camera size={26} color="#FFFFFF" strokeWidth={2.3} />
        </Pressable>
        <Text style={[styles.fabLabel, { color: colors.primary }]}>Scan Plant</Text>
      </View>

      {/* Floating Voice Assistant Trigger */}
      <Pressable
        style={({ pressed }) => [
          styles.voiceFab,
          pressed && styles.voiceFabPressed,
        ]}
        onPress={onOpenVoice}
      >
        <Mic size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },
  centerSpacer: {
    width: 60,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  voiceFab: {
    position: 'absolute',
    bottom: 76,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  voiceFabPressed: {
    transform: [{ scale: 0.93 }],
    backgroundColor: '#D97706',
  },
});
