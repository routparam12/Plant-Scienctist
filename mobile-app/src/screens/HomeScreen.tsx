import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CloudRain,
  Wind,
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Camera,
  Mic,
  Bell,
  MapPin,
  Navigation,
  X,
  Settings,
  Edit3,
  BookOpen,
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Location from 'expo-location';
import { getFarms, getUserCrops, getProfile, getHomeContext, updateUserLocation } from '../services/apiClient';
import { AppLanguage, Farm } from '../types';
import { fetchAgronomyNews, NewsArticle } from '../services/newsService';
import { CropCard } from '../components/CropCard';
import { CropDetailModal } from '../components/CropDetailModal';
import { WeatherAdvisoryModal } from '../components/WeatherAdvisoryModal';
import { fetchWeatherAndSprayAdvisory, WeatherPayload } from '../services/weatherService';
import { t, getGreeting } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { THEME } from '../constants/theme';

interface HomeScreenProps {
  language?: AppLanguage;
  onOpenAddCrop: (farmId: string) => void;
  onOpenScanner: () => void;
  onOpenVoice: () => void;
  onNavigateToTab?: (tab: 'home' | 'doctor' | 'appointment' | 'profile') => void;
}

function getWeatherConditionText(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 67) return 'Light Rain / Drizzle';
  if (code >= 80 && code <= 99) return 'Rain Showers';
  return 'Partly Cloudy';
}

function formatDisplayName(name?: string): string {
  if (!name || !name.trim()) return 'Paramjeet';
  let clean = name.trim();
  if (clean.includes('@')) {
    clean = clean.split('@')[0];
  }
  if (clean.includes('.')) {
    clean = clean.split('.')[0];
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// Module-level session animation flag (runs typewriter ONCE per app session)
let hasAnimatedGreetingThisSession = false;

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language = 'en',
  onOpenAddCrop,
  onOpenScanner,
  onOpenVoice,
  onNavigateToTab,
}) => {
  const { colors, isDark } = useTheme();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [homeContext, setHomeContext] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCropForDetail, setSelectedCropForDetail] = useState<string | null>(null);

  // Dynamic Greeting & Typewriter state
  const [displayedGreeting, setDisplayedGreeting] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Location State & Bottom Sheet
  const [displayedLocation, setDisplayedLocation] = useState('Gurugram, Haryana');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Dynamic Live Weather State & Modal
  const [weatherData, setWeatherData] = useState<WeatherPayload | null>(null);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  // Live Krishi Jagran News State
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);

  const handleOpenLiveNewsArticle = async (url: string) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.card,
        controlsColor: colors.primary,
      });
    } catch (e) {
      Alert.alert('Browser Error', 'Could not open article link.');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [cropsRes, farmsRes, profileRes, contextRes] = await Promise.allSettled([
        getUserCrops(),
        getFarms(),
        getProfile(),
        getHomeContext(),
      ]);

      let userCropNames: string[] = [];
      if (cropsRes.status === 'fulfilled' && Array.isArray(cropsRes.value)) {
        setCrops(cropsRes.value);
        userCropNames = cropsRes.value.map((c: any) => c.name || c.custom_name);
      }
      if (farmsRes.status === 'fulfilled' && Array.isArray(farmsRes.value)) {
        setFarms(farmsRes.value);
      }
      if (profileRes.status === 'fulfilled' && profileRes.value) {
        setProfile(profileRes.value);
      }
      if (contextRes.status === 'fulfilled' && contextRes.value) {
        setHomeContext(contextRes.value);
      }

      // Fetch Live Krishi Jagran RSS News
      const liveNews = await fetchAgronomyNews(language, userCropNames);
      setNewsArticles(liveNews);
    } catch (e) {
      console.warn('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute full target greeting with formatted user first name
  const userFirstName = formatDisplayName(
    homeContext?.first_name || (profile?.full_name ? profile.full_name : 'Paramjeet')
  );

  const fullGreetingText = getGreeting({
    firstName: userFirstName,
    isNewSignup: homeContext?.is_new_signup ?? false,
    inactiveDays: homeContext?.inactive_days ?? 0,
    currentHour: new Date().getHours(),
    language,
  });

  // Typewriter Animation Effect (runs ONCE per session)
  useEffect(() => {
    if (!fullGreetingText) return;

    if (hasAnimatedGreetingThisSession) {
      setDisplayedGreeting(fullGreetingText);
      setIsTyping(false);
      return;
    }

    hasAnimatedGreetingThisSession = true;
    setIsTyping(true);
    let index = 0;

    const timer = setInterval(() => {
      index += 1;
      setDisplayedGreeting(fullGreetingText.slice(0, index));

      if (index >= fullGreetingText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 45);

    return () => clearInterval(timer);
  }, [fullGreetingText]);

  // Initial Signup / Saved Location initialization & Weather Fetch
  useEffect(() => {
    const loc =
      homeContext?.current_location ||
      homeContext?.signup_location ||
      (profile?.village || profile?.district
        ? { city: profile.district || profile.village, state: profile.state || 'Haryana' }
        : null);

    let locStr = 'Gurugram, Haryana';
    if (loc?.city && loc?.state) {
      locStr = `${loc.city}, ${loc.state}`;
    } else if (loc?.city) {
      locStr = loc.city;
    }

    setDisplayedLocation(locStr);
    fetchLiveWeather(locStr, loc?.latitude, loc?.longitude);
  }, [homeContext, profile]);

  const fetchLiveWeather = async (locName: string, paramLat?: number, paramLon?: number) => {
    try {
      const data = await fetchWeatherAndSprayAdvisory({
        lat: paramLat,
        lon: paramLon,
        locationName: locName,
        language,
      });
      setWeatherData(data);
    } catch (err) {
      console.warn('Weather fetch error:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    if (displayedLocation) {
      fetchLiveWeather(displayedLocation);
    }
  };

  const handleOpenLocationSheet = () => {
    setIsLocationModalOpen(true);
  };

  const handleRequestGpsLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Denied',
          'Permission to access location was denied. You can continue using your signup location or enter location manually.',
          [
            { text: 'OK' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings().catch(() => {}),
            },
          ]
        );
        setIsLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (geocoded && geocoded.length > 0) {
        const place = geocoded[0];
        const city = place.city || place.subregion || place.district || place.name || 'Gurugram';
        const state = place.region || place.country || 'Haryana';
        const newLocStr = `${city}, ${state}`;

        setDisplayedLocation(newLocStr);
        fetchLiveWeather(newLocStr, latitude, longitude);

        await updateUserLocation({
          city,
          state,
          latitude,
          longitude,
          source: 'device',
        });
      }
      setIsLocationModalOpen(false);
    } catch (err: any) {
      Alert.alert('GPS Location Error', err.message || 'Could not fetch current GPS location.');
    } finally {
      setIsLocating(false);
    }
  };

  const currentFarm = farms[0];
  const allCrops = crops;
  const activeCropName = allCrops[0]?.name || 'Tomato';

  const filteredCrops =
    selectedCategory === 'All'
      ? allCrops
      : allCrops.filter((c) => {
          const cat = c.category || c.name || '';
          return cat.toLowerCase().includes(selectedCategory.toLowerCase());
        });

  const categories = [
    { id: 'All', label: language === 'hi' ? 'सभी' : 'All' },
    { id: 'Tomato', label: language === 'hi' ? 'टमाटर' : 'Tomato' },
    { id: 'Wheat', label: language === 'hi' ? 'गेहूं' : 'Wheat' },
    { id: 'Rice', label: language === 'hi' ? 'चावल' : 'Rice' },
    { id: 'Cotton', label: language === 'hi' ? 'कपास' : 'Cotton' },
    { id: 'Chili', label: language === 'hi' ? 'मिर्च' : 'Chili' },
  ];

  const handleOpenCropDetail = (cropId: string) => {
    setSelectedCropForDetail(cropId);
    setDetailModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 1. Header with Typewriter Greeting & Anti-Clipped Flower Emoji */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
                {displayedGreeting}
              </Text>
              <Text style={styles.emojiGlyph}>🪻</Text>
              {isTyping ? <Text style={styles.cursorText}>|</Text> : null}
            </View>

            {/* Clickable Location Button Underneath */}
            <Pressable style={styles.locationButton} onPress={handleOpenLocationSheet}>
              <MapPin size={14} color={colors.primary} />
              <Text style={[styles.farmLocationText, { color: colors.textSecondary }]}>
                {displayedLocation} ›
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.bellBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => Alert.alert('Notifications', 'No urgent weather or pest alerts for your district.')}
          >
            <Bell size={20} color={colors.textPrimary} />
            <View style={styles.bellBadge} />
          </Pressable>
        </View>

        {/* 2. Voice & Camera Capsule Input Bar */}
        <Pressable
          style={[styles.capsuleBar, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={onOpenVoice}
        >
          <View style={[styles.capsuleMicBtn, { backgroundColor: colors.primary }]}>
            <Mic size={18} color={colors.onPrimary || '#FFFFFF'} />
          </View>
          <View style={styles.capsuleTextContainer}>
            <Text style={[styles.capsulePlaceholder, { color: colors.textMuted }]}>
              {t('home.askPlaceholder', language)}
            </Text>
          </View>
          <View style={[styles.capsuleSpeakBadge, { backgroundColor: colors.accentBg, borderColor: colors.border }]}>
            <Text style={[styles.capsuleSpeakBadgeText, { color: colors.primary }]}>
              {language === 'hi' ? '🎙️ बोलें' : '🎙️ Speak'}
            </Text>
          </View>
        </Pressable>

        {/* 3. Agronomy Quick Action Grid */}
        <View style={styles.toolkitSection}>
          <Text style={[styles.toolkitEyebrow, { color: colors.textMuted }]}>
            {language === 'hi' ? 'कृषि टूलकिट' : 'AGRONOMY TOOLKIT'}
          </Text>
          <View style={styles.toolkitGrid}>
            <Pressable style={[styles.toolkitCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={onOpenScanner}>
              <View style={[styles.toolkitIconBox, { backgroundColor: colors.toolkitDoctorBg }]}>
                <Camera size={18} color={colors.toolkitDoctorIcon} />
              </View>
              <Text style={[styles.toolkitLabel, { color: colors.textPrimary }]}>
                {language === 'hi' ? 'एआई डॉक्टर' : 'AI Doctor'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.toolkitCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() =>
                Alert.alert(
                  'Soil Health Status',
                  'Red Loamy Soil • Organic Carbon: 0.68% (Optimal) • Soil pH: 6.8 • Available Nitrogen: 280 kg/ha'
                )
              }
            >
              <View style={[styles.toolkitIconBox, { backgroundColor: colors.toolkitSoilBg }]}>
                <Text style={{ fontSize: 16 }}>🧪</Text>
              </View>
              <Text style={[styles.toolkitLabel, { color: colors.textPrimary }]}>
                {language === 'hi' ? 'मिट्टी जांच' : 'Soil Test'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.toolkitCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() =>
                Alert.alert(
                  'Farm Satellite Boundaries',
                  `Main Farm: ${currentFarm?.totalAcreage || 14.5} Acres\nSoil Type: Alluvial Loam\nSurvey No: 412/A, ${displayedLocation}`
                )
              }
            >
              <View style={[styles.toolkitIconBox, { backgroundColor: colors.toolkitMapBg }]}>
                <Text style={{ fontSize: 16 }}>🗺️</Text>
              </View>
              <Text style={[styles.toolkitLabel, { color: colors.textPrimary }]}>
                {language === 'hi' ? 'खेत नक्शा' : 'Farm Map'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.toolkitCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => onNavigateToTab?.('appointment')}
            >
              <View style={[styles.toolkitIconBox, { backgroundColor: colors.toolkitExpertBg }]}>
                <Text style={{ fontSize: 16 }}>👨‍⚕️</Text>
              </View>
              <Text style={[styles.toolkitLabel, { color: colors.textPrimary }]}>
                {language === 'hi' ? 'विशेषज्ञ' : 'Experts'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4. Single Consolidated Compact Weather Card */}
        <Pressable
          style={[styles.weatherCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => setIsWeatherModalOpen(true)}
        >
          <View style={styles.weatherCardTop}>
            <View style={styles.weatherTitleRow}>
              <CloudRain size={16} color={colors.primary} />
              <Text style={[styles.weatherSectionTitle, { color: colors.textPrimary }]}>
                {language === 'hi' ? 'आज का मौसम' : "TODAY'S WEATHER METRICS"}
              </Text>
            </View>
            <Text style={[styles.weatherExpandText, { color: colors.primary }]}>
              {language === 'hi' ? '7-दिन पूर्वानुमान →' : '7-DAY FORECAST →'}
            </Text>
          </View>

          <View style={styles.weatherMainRow}>
            <View>
              <View style={styles.tempRow}>
                <Text style={[styles.tempText, { color: colors.textPrimary }]}>
                  {weatherData ? `${weatherData.temperature}°C` : '29°C'}
                </Text>
                <Text style={[styles.tempLocText, { color: colors.textSecondary }]}>
                  {displayedLocation}
                </Text>
              </View>
              <Text style={[styles.weatherSubtext, { color: colors.textMuted }]}>
                {weatherData
                  ? `${weatherData.conditionLabel} • Humidity ${weatherData.humidity}% • Wind ${weatherData.windSpeed} km/h`
                  : 'Partly Cloudy • Humidity 76% • Wind 9 km/h'}
              </Text>
            </View>

            <View style={[styles.weatherIconCircle, { backgroundColor: colors.accentBg }]}>
              <Text style={{ fontSize: 24 }}>
                {weatherData && weatherData.maxRainProb >= 50 ? '🌧️' : '⛅'}
              </Text>
            </View>
          </View>

          {/* Compact 1-line Rain Alert Pill inside Weather Card when rain probability is high */}
          {weatherData && weatherData.maxRainProb >= 50 && (
            <View style={styles.compactRainPill}>
              <Text style={styles.compactRainPillText} numberOfLines={1}>
                🌧️ Rain Alert ({weatherData.maxRainProb}% prob) — Delay foliar spray • Tap for details →
              </Text>
            </View>
          )}
        </Pressable>

        {/* 5. Crop Category Filter Pills */}
        <View style={styles.categoryHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {language === 'hi' ? `सक्रिय फसलें (${filteredCrops.length})` : `Active Portfolio (${filteredCrops.length})`}
          </Text>
          {filteredCrops.length > 0 && (
            <Pressable
              style={[styles.addCropBtn, { backgroundColor: colors.primary }]}
              onPress={() => onOpenAddCrop(currentFarm?.id || 'default-farm')}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addCropBtnText}>
                {language === 'hi' ? '+ फसल जोड़ें' : 'Add Crop'}
              </Text>
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.catChip,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedCategory === cat.id && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  { color: colors.textSecondary },
                  selectedCategory === cat.id && { color: '#FFFFFF', fontWeight: '700' },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* 6. Crops List */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
        ) : filteredCrops.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {language === 'hi' ? 'इस श्रेणी में कोई फसल नहीं मिली।' : 'No crops found in this category.'}
            </Text>
            <Pressable
              style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
              onPress={() => onOpenAddCrop(currentFarm?.id || 'default-farm')}
            >
              <Text style={styles.emptyAddBtnText}>
                {language === 'hi' ? 'अपनी पहली फसल जोड़ें' : 'Add your first crop'}
              </Text>
            </Pressable>
          </View>
        ) : (
          filteredCrops.map((crop) => (
            <CropCard
              key={crop.id}
              crop={crop}
              language={language}
              onPress={() => handleOpenCropDetail(crop.id)}
            />
          ))
        )}

        {/* 7. Upcoming Tasks Section */}
        <View style={styles.tasksSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {language === 'hi' ? 'प्राथमिक खेत कार्य' : 'Priority Field Tasks'}
          </Text>
          <View style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.taskIconCircle}>
              <AlertCircle size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>
                {language === 'hi' ? 'सूक्ष्म पोषक तत्व + बोरॉन 20% का पर्णीय छिड़काव' : 'Foliar spray with Micronutrients + Boron 20%'}
              </Text>
              <Text style={[styles.taskMeta, { color: colors.textMuted }]}>
                {language === 'hi' ? 'टमाटर • शुक्रवार, सुबह 8:00 • उच्च प्राथमिकता' : 'Tomato • Friday, 8:00 AM • High Priority'}
              </Text>
            </View>
            <CheckCircle2 size={20} color={colors.textMuted} />
          </View>

          <View style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.taskIconCircle}>
              <Calendar size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>
                {language === 'hi' ? 'तीसरी सिंचाई से पहले 30 किग्रा/एकड़ यूरिया डालें' : 'Top dress Urea @ 30kg/acre before 3rd irrigation'}
              </Text>
              <Text style={[styles.taskMeta, { color: colors.textMuted }]}>
                {language === 'hi' ? 'गेहूं (GW-496) • शनिवार सुबह • मध्यम' : 'Wheat (GW-496) • Saturday Morning • Medium'}
              </Text>
            </View>
            <CheckCircle2 size={20} color={colors.textMuted} />
          </View>
        </View>

        {/* 8. Krishi Jagran Live Agri News Section */}
        {newsArticles.length > 0 && (
          <View style={styles.knowledgeHubSection}>
            <View style={styles.knowledgeHubHeader}>
              <View style={styles.knowledgeTitleRow}>
                <BookOpen size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {language === 'hi' ? 'कृषि जागरण लाइव समाचार' : 'KRISHI JAGRAN LIVE AGRI NEWS'}
                </Text>
              </View>

              <Text style={[styles.knowledgeSublabel, { color: colors.textMuted }]}>
                {language === 'hi' ? 'ताजा कृषि बुलेटिन • 24 घंटे अपडेट' : 'LIVE RSS BULLETIN • UPDATED DAILY'}
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.articleScroll}>
              {newsArticles.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.articleCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => handleOpenLiveNewsArticle(item.link)}
                >
                  <View style={styles.articleTopRow}>
                    <Text style={[styles.articleSourceTag, { color: colors.primary }]}>{item.source}</Text>
                    {item.matchedCrop && (
                      <View style={[styles.articleCategoryBadge, { backgroundColor: colors.accentBg }]}>
                        <Text style={[styles.articleCategoryText, { color: colors.primary }]}>
                          {language === 'hi' ? 'आपकी फसल' : 'Your Crop'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.articleTitleText, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <Text style={[styles.articleMetaText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.snippet}
                  </Text>

                  <Text style={[styles.articleReadLink, { color: colors.primary }]}>
                    {language === 'hi' ? 'पूरा लेख पढ़ें →' : 'Read full article →'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Weather Advisory Modal */}
      <WeatherAdvisoryModal
        visible={isWeatherModalOpen}
        language={language}
        weatherData={weatherData}
        activeCropName={activeCropName}
        onClose={() => setIsWeatherModalOpen(false)}
      />

      {/* Crop Detail Modal */}
      <CropDetailModal
        visible={detailModalVisible}
        cropId={selectedCropForDetail}
        language={language}
        onClose={() => setDetailModalVisible(false)}
        onCropUpdated={fetchDashboardData}
        onCropDeleted={() => {
          setDetailModalVisible(false);
          fetchDashboardData();
        }}
      />

      {/* Location Permission Bottom Sheet Modal */}
      <Modal
        visible={isLocationModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLocationModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContent, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetIconCircle, { backgroundColor: colors.accentBg }]}>
                <Navigation size={22} color={colors.primary} />
              </View>
              <Pressable
                style={styles.sheetCloseBtn}
                onPress={() => setIsLocationModalOpen(false)}
              >
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
              {t('location.useCurrent', language)}
            </Text>

            <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>
              {t('location.permDesc', language)}
            </Text>

            {/* Action Buttons */}
            <View style={styles.sheetActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.allowBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleRequestGpsLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Navigation size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.allowBtnText}>{t('location.allow', language)}</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={styles.notNowBtn}
                onPress={() => setIsLocationModalOpen(false)}
              >
                <Text style={[styles.notNowBtnText, { color: colors.textSecondary }]}>
                  {t('location.notNow', language)}
                </Text>
              </Pressable>

              <Pressable
                style={styles.optionRowBtn}
                onPress={() => {
                  setIsLocationModalOpen(false);
                  Alert.prompt
                    ? Alert.prompt(
                        'Enter City, State',
                        'e.g. Gurugram, Haryana',
                        (text) => {
                          if (text && text.trim()) {
                            setDisplayedLocation(text.trim());
                            fetchLiveWeather(text.trim());
                          }
                        }
                      )
                    : Alert.alert('Manual Location', 'Type your city and state in profile details.');
                }}
              >
                <Edit3 size={14} color={colors.primary} />
                <Text style={[styles.optionRowText, { color: colors.primary }]}>
                  {t('location.manual', language)}
                </Text>
              </Pressable>

              <Pressable
                style={styles.optionRowBtn}
                onPress={() => {
                  Linking.openSettings().catch(() => {});
                }}
              >
                <Settings size={14} color={colors.textMuted} />
                <Text style={[styles.optionRowText, { color: colors.textMuted }]}>
                  {t('location.settings', language)}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  emojiGlyph: {
    fontSize: 22,
    fontWeight: 'normal',
    includeFontPadding: false,
    paddingHorizontal: 4,
    lineHeight: 32,
  },
  cursorText: {
    color: '#0D6832',
    fontWeight: '400',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  farmLocationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D6832',
  },
  capsuleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 28,
    padding: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  capsuleMicBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleTextContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  capsulePlaceholder: {
    fontSize: 13,
    fontWeight: '500',
  },
  capsuleSpeakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 4,
  },
  capsuleSpeakBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  toolkitSection: {
    marginBottom: 20,
  },
  toolkitEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  toolkitGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  toolkitCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toolkitIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  toolkitLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  weatherCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  weatherCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  weatherExpandText: {
    fontSize: 10,
    fontWeight: '700',
  },
  weatherMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  tempText: {
    fontSize: 28,
    fontWeight: '800',
  },
  tempLocText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weatherSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  weatherIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactRainPill: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  compactRainPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  catChip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  addCropBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 12,
  },
  emptyAddBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  tasksSection: {
    marginTop: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 10,
    gap: 12,
  },
  taskIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  taskMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseBtn: {
    padding: 6,
    borderRadius: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  sheetDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  sheetActions: {
    gap: 10,
  },
  allowBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  notNowBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  notNowBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  optionRowText: {
    fontSize: 13,
    fontWeight: '600',
  },
  knowledgeHubSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  knowledgeHubHeader: {
    marginBottom: 12,
  },
  knowledgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  knowledgeSublabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 2,
  },
  articleScroll: {
    flexDirection: 'row',
  },
  articleCard: {
    width: 260,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  articleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  articleEmblemBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleCategoryBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  articleCategoryText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  articleTitleText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 6,
  },
  articleMetaText: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  articleSourceTag: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  articleReadLink: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
  },
  articleRoiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
  },
  articleRoiText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
