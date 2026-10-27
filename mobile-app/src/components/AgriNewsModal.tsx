import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Newspaper,
  RefreshCw,
  ExternalLink,
  Calendar,
  Sparkles,
  Tag,
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { NewsArticle } from '../services/newsService';
import { AppLanguage } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AgriNewsModalProps {
  visible: boolean;
  onClose: () => void;
  articles: NewsArticle[];
  language?: AppLanguage;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const AgriNewsModal: React.FC<AgriNewsModalProps> = ({
  visible,
  onClose,
  articles,
  language = 'en',
  isLoading = false,
  onRefresh,
}) => {
  const { colors, isDark } = useTheme();
  const [filterType, setFilterType] = useState<'all' | 'crops'>('all');

  const matchedArticles = articles.filter((a) => a.matchedCrop);
  const displayArticles =
    filterType === 'crops' && matchedArticles.length > 0 ? matchedArticles : articles;

  const handleOpenArticle = async (url: string) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.card,
        controlsColor: colors.primary,
      });
    } catch (e) {
      Alert.alert(
        language === 'hi' ? 'त्रुटि' : 'Browser Error',
        language === 'hi' ? 'समाचार लिंक नहीं खोला जा सका।' : 'Could not open article link.'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.bg }]}
        edges={['top', 'left', 'right']}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIconBox, { backgroundColor: colors.accentBg }]}>
              <Newspaper size={20} color={colors.primary} />
            </View>
            <View style={styles.headerTextWrap}>
              <View style={styles.titleRow}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  {language === 'hi' ? 'कृषि समाचार' : 'Agronomy News'}
                </Text>
                <View style={[styles.liveBadge, { backgroundColor: colors.accentBg }]}>
                  <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.liveText, { color: colors.primary }]}>LIVE</Text>
                </View>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {language === 'hi'
                  ? 'कृषि जागरण • 24 घंटे ताजा बुलेटिन'
                  : 'Krishi Jagran • Live Agri Updates'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {onRefresh && (
              <Pressable
                style={[styles.iconButton, { backgroundColor: colors.pillBg }]}
                onPress={onRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <RefreshCw size={18} color={colors.textPrimary} />
                )}
              </Pressable>
            )}
            <Pressable
              style={[styles.iconButton, { backgroundColor: colors.pillBg }]}
              onPress={onClose}
            >
              <X size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={[styles.filterBar, { borderBottomColor: colors.cardBorder }]}>
          <Pressable
            style={[
              styles.filterChip,
              filterType === 'all'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 },
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filterType === 'all' ? '#FFFFFF' : colors.textPrimary },
              ]}
            >
              {language === 'hi' ? 'सभी समाचार' : 'All Updates'} ({articles.length})
            </Text>
          </Pressable>

          {matchedArticles.length > 0 && (
            <Pressable
              style={[
                styles.filterChip,
                filterType === 'crops'
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 },
              ]}
              onPress={() => setFilterType('crops')}
            >
              <Sparkles
                size={13}
                color={filterType === 'crops' ? '#FFFFFF' : colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterType === 'crops' ? '#FFFFFF' : colors.primary },
                ]}
              >
                {language === 'hi' ? 'मेरी फसलें' : 'My Crops'} ({matchedArticles.length})
              </Text>
            </Pressable>
          )}
        </View>

        {/* Articles List */}
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && articles.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                {language === 'hi'
                  ? 'ताजा कृषि समाचार लोड हो रहे हैं...'
                  : 'Fetching latest agronomy articles...'}
              </Text>
            </View>
          ) : displayArticles.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Newspaper size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {language === 'hi' ? 'कोई समाचार नहीं मिला' : 'No News Available'}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                {language === 'hi'
                  ? 'कृषि जागरण से ताजा समाचार प्राप्त करने के लिए रिफ्रेश करें।'
                  : 'Tap refresh to fetch the latest farming news bulletins.'}
              </Text>
              {onRefresh && (
                <Pressable
                  style={[styles.refreshButton, { backgroundColor: colors.primary }]}
                  onPress={onRefresh}
                >
                  <RefreshCw size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.refreshButtonText}>
                    {language === 'hi' ? 'समाचार रिफ्रेश करें' : 'Refresh News'}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            displayArticles.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.articleCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                onPress={() => handleOpenArticle(item.link)}
              >
                {/* Meta Row: Source, Tag & Date */}
                <View style={styles.articleHeaderRow}>
                  <View style={styles.sourceTagWrap}>
                    <Text style={[styles.sourceBadge, { color: colors.primary }]}>
                      {item.source}
                    </Text>
                    {item.matchedCrop && (
                      <View style={[styles.cropBadge, { backgroundColor: colors.accentBg }]}>
                        <Tag size={10} color={colors.primary} style={{ marginRight: 3 }} />
                        <Text style={[styles.cropBadgeText, { color: colors.primary }]}>
                          {language === 'hi' ? 'आपकी फसल' : 'Your Crop'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.dateWrap}>
                    <Calendar size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                      {item.publishedAt}
                    </Text>
                  </View>
                </View>

                {/* Article Headline */}
                <Text style={[styles.articleTitle, { color: colors.textPrimary }]}>
                  {item.title}
                </Text>

                {/* Article Snippet */}
                {!!item.snippet && (
                  <Text
                    style={[styles.articleSnippet, { color: colors.textSecondary }]}
                    numberOfLines={3}
                  >
                    {item.snippet}
                  </Text>
                )}

                {/* Action Row */}
                <View style={[styles.actionRow, { borderTopColor: colors.cardBorder }]}>
                  <Text style={[styles.readFullText, { color: colors.primary }]}>
                    {language === 'hi' ? 'पूरा लेख पढ़ें' : 'Read Full Article'}
                  </Text>
                  <ExternalLink size={14} color={colors.primary} />
                </View>
              </Pressable>
            ))
          )}

          {/* Footer note */}
          <View style={styles.footerWrap}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              {language === 'hi'
                ? 'स्रोत: कृषि जागरण आरएसएस फीड • विश्वसनीय भारतीय कृषि समाचार'
                : 'Source: Krishi Jagran RSS Feed • Trusted Agricultural Intelligence'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  articleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  articleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  cropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cropBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 8,
  },
  articleSnippet: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  readFullText: {
    fontSize: 12,
    fontWeight: '800',
  },
  footerWrap: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
