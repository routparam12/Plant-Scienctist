import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Home, Sprout, Mic, Calendar, User } from 'lucide-react-native';
import { AppLanguage, TabType } from '../types';
import { t } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CradleBottomNavProps {
  currentTab: TabType;
  language?: AppLanguage;
  onTabChange: (tab: TabType) => void;
  onOpenScanner: () => void;
  onOpenVoice?: () => void;
}

export const CradleBottomNav: React.FC<CradleBottomNavProps> = ({
  currentTab,
  language = 'en',
  onTabChange,
  onOpenScanner,
  onOpenVoice,
}) => {
  const { colors, isDark } = useTheme();

  const NAV_WIDTH = SCREEN_WIDTH;
  const NAV_HEIGHT = Platform.OS === 'ios' ? 76 : 68;
  const CENTER_X = NAV_WIDTH / 2;
  const SCOOP_START = 40; // Flat top line extends closer to center before curving
  const SCOOP_DEPTH = 34;  // Deep, natural U-shaped cradle scoop
  const CORNER_RADIUS = 20;

  // Natural $C^1$ Organic Cradle U-Curve matching reference image 2
  const cradlePath = `
    M 0,${CORNER_RADIUS}
    Q 0,0 ${CORNER_RADIUS},0
    L ${CENTER_X - SCOOP_START - 6},0
    C ${CENTER_X - SCOOP_START + 12},0 ${CENTER_X - 22},${SCOOP_DEPTH} ${CENTER_X},${SCOOP_DEPTH}
    C ${CENTER_X + 22},${SCOOP_DEPTH} ${CENTER_X + SCOOP_START - 12},0 ${CENTER_X + SCOOP_START + 6},0
    L ${NAV_WIDTH - CORNER_RADIUS},0
    Q ${NAV_WIDTH},0 ${NAV_WIDTH},${CORNER_RADIUS}
    L ${NAV_WIDTH},${NAV_HEIGHT}
    L 0,${NAV_HEIGHT}
    Z
  `;

  return (
    <View style={styles.container}>
      {/* SVG Background Layer providing the smooth organic curved scoop dock */}
      <View style={[styles.svgLayer, { height: NAV_HEIGHT }]}>
        <Svg width={NAV_WIDTH} height={NAV_HEIGHT}>
          <Path
            d={cradlePath}
            fill={colors.card}
            stroke={colors.border}
            strokeWidth={1}
          />
        </Svg>
      </View>

      {/* Symmetrical 5-Column Navigation Row */}
      <View style={[styles.barContent, { height: NAV_HEIGHT }]}>
        {/* Slot 1: Home (Shifted slightly right for optimal bezel margin) */}
        <Pressable
          style={[styles.tabSlot, { marginLeft: 8 }]}
          onPress={() => onTabChange('home')}
          android_ripple={{ color: isDark ? '#2C352B' : '#E8F5E9', borderless: true }}
        >
          <Home
            size={24}
            color={currentTab === 'home' ? colors.primary : colors.textMuted}
            fill={currentTab === 'home' ? colors.primary : 'transparent'}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textMuted },
              currentTab === 'home' && { color: colors.primary, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {t('nav.home', language)}
          </Text>
        </Pressable>

        {/* Slot 2: Crop */}
        <Pressable
          style={styles.tabSlot}
          onPress={() => onTabChange('doctor')}
          android_ripple={{ color: isDark ? '#2C352B' : '#E8F5E9', borderless: true }}
        >
          <Sprout
            size={24}
            color={currentTab === 'doctor' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textMuted },
              currentTab === 'doctor' && { color: colors.primary, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {t('nav.crop', language)}
          </Text>
        </Pressable>

        {/* Slot 3: Center FAB Pocket Spacer (84px wide) */}
        <View style={styles.fabPocketSlot} />

        {/* Slot 4: Expert */}
        <Pressable
          style={styles.tabSlot}
          onPress={() => onTabChange('appointment')}
          android_ripple={{ color: isDark ? '#2C352B' : '#E8F5E9', borderless: true }}
        >
          <Calendar
            size={24}
            color={currentTab === 'appointment' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textMuted },
              currentTab === 'appointment' && { color: colors.primary, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {t('nav.expert', language)}
          </Text>
        </Pressable>

        {/* Slot 5: Profile (Symmetrical margin from right bezel) */}
        <Pressable
          style={[styles.tabSlot, { marginRight: 8 }]}
          onPress={() => onTabChange('profile')}
          android_ripple={{ color: isDark ? '#2C352B' : '#E8F5E9', borderless: true }}
        >
          <User
            size={24}
            color={currentTab === 'profile' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: colors.textMuted },
              currentTab === 'profile' && { color: colors.primary, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {t('nav.profile', language)}
          </Text>
        </Pressable>
      </View>

      {/* Center Floating Voice Assistant Mic Button nested in the Cradle Scoop */}
      <View style={styles.fabWrapper}>
        <Pressable
          style={({ pressed }) => [
            styles.fabButton,
            { backgroundColor: colors.primary, shadowColor: '#000' },
            pressed && styles.fabPressed,
          ]}
          onPress={onOpenVoice || onOpenScanner}
        >
          <Mic size={26} color="#FFFFFF" strokeWidth={2.3} />
        </Pressable>
      </View>
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
  svgLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 16 : 4,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  fabPocketSlot: {
    width: 84, // Dedicated 84px center pocket slot
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  fabWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? -22 : -18,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fabGlowRing: {
    padding: 3,
    borderRadius: 34,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
});
