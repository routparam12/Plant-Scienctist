import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from 'react-native';
import { X, Newspaper, Sparkles, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { NewsArticle } from '../services/newsService';
import { AppLanguage } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ArticleReaderModalProps {
  visible: boolean;
  language?: AppLanguage;
  articles: NewsArticle[];
  selectedArticle?: NewsArticle | null;
  onClose: () => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  visible,
  language = 'en',
  articles = [],
  selectedArticle: initialSelectedArticle = null,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(
    initialSelectedArticle?.id || null
  );
  const [filter, setFilter] = useState<'all' | 'crop'>('all');

  useEffect(() => {
    if (visible) {
      setExpandedArticleId(
        initialSelectedArticle?.id || (articles.length > 0 ? articles[0].id : null)
      );
    }
  }, [visible, initialSelectedArticle, articles]);

  if (!visible) return null;

  const handleOpenFullArticle = async (url: string) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.card,
        controlsColor: colors.primary,
      });
    } catch {
      Linking.openURL(url).catch(() => {});
    }
  };

  const filteredArticles =
    filter === 'crop'
      ? articles.filter((a) => a.matchedCrop)
      : articles;

  const toggleExpand = (id: string) => {
    setExpandedArticleId((prev) => (prev === id ? null : id));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentBg }]}>
                <Newspaper size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {language === 'hi' ? 'कृषि समाचार बुलेटिन' : 'Agronomy Live News'}
                </Text>
                <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
                  KRISHI JAGRAN • 24H UPDATES
                </Text>
              </View>
            </View>

            <Pressable style={[styles.closeBtn, { backgroundColor: colors.pillBg }]} onPress={onClose}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            <Pressable
              style={[
                styles.filterChip,
                { backgroundColor: colors.pillBg, borderColor: colors.border },
                filter === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setFilter('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: colors.textSecondary },
                  filter === 'all' && { color: colors.onPrimary || '#FFFFFF', fontWeight: '800' },
                ]}
              >
                {language === 'hi' ? `सभी समाचार (${articles.length})` : `All News (${articles.length})`}
              </Text>
            </Pressable>

            {articles.some((a) => a.matchedCrop) && (
              <Pressable
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.pillBg, borderColor: colors.border },
                  filter === 'crop' && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setFilter('crop')}
              >
                <Sparkles size={12} color={filter === 'crop' ? '#FFFFFF' : colors.primary} />
                <Text
                  style={[
                    styles.filterText,
                    { color: colors.textSecondary },
                    filter === 'crop' && { color: colors.onPrimary || '#FFFFFF', fontWeight: '800' },
                  ]}
                >
                  {language === 'hi' ? 'आपकी फसल' : 'Your Crops'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Scrollable News Feed List */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {filteredArticles.map((article) => {
              const isExpanded = expandedArticleId === article.id;
              const displayBody = isExpanded
                ? (article.content || article.snippet)
                : article.snippet;

              return (
                <Pressable
                  key={article.id}
                  style={[
                    styles.articleCard,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    isExpanded && [
                      styles.articleCardExpanded,
                      { backgroundColor: colors.pillBg, borderColor: colors.primary },
                    ],
                  ]}
                  onPress={() => toggleExpand(article.id)}
                >
                  {/* Article Meta Header */}
                  <View style={styles.articleBadgeRow}>
                    <View style={[styles.sourceBadge, { backgroundColor: colors.accentBg }]}>
                      <Text style={[styles.sourceText, { color: colors.primary }]}>
                        {article.source}
                      </Text>
                    </View>

                    {article.matchedCrop && (
                      <View style={styles.cropBadge}>
                        <Text style={styles.cropBadgeText}>
                          🌾 {language === 'hi' ? 'आपकी फसल' : 'Your Crop'}
                        </Text>
                      </View>
                    )}

                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                      {article.publishedAt}
                    </Text>

                    {isExpanded ? (
                      <ChevronUp size={16} color={colors.primary} style={{ marginLeft: 6 }} />
                    ) : (
                      <ChevronDown size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
                    )}
                  </View>

                  {/* Article Title */}
                  <Text
                    style={[
                      styles.articleTitle,
                      { color: colors.textPrimary },
                      isExpanded && styles.articleTitleExpanded,
                    ]}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {article.title}
                  </Text>

                  {/* Article Body Content (Full Un-truncated Text on Expansion) */}
                  <Text
                    style={[
                      styles.articleBody,
                      { color: colors.textSecondary },
                      isExpanded && styles.articleBodyExpanded,
                    ]}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {displayBody}
                  </Text>

                  {/* Original Web Version Button when Expanded */}
                  {isExpanded && article.link ? (
                    <Pressable
                      style={[styles.webLinkBtn, { backgroundColor: colors.accentBg }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleOpenFullArticle(article.link);
                      }}
                    >
                      <ExternalLink size={14} color={colors.primary} />
                      <Text style={[styles.webLinkBtnText, { color: colors.primary }]}>
                        {language === 'hi' ? 'मूल वेब संस्करण पढ़ें →' : 'Read Full Web Article →'}
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Tap to Collapse / Expand Helper Hint */}
                  <Text style={[styles.expandHint, { color: colors.primary }]}>
                    {isExpanded
                      ? language === 'hi' ? '▲ संक्षेप करें' : '▲ Collapse article'
                      : language === 'hi' ? '▼ पूरा लेख पढ़ें' : '▼ Read full article'}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sheetSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollBody: {
    marginTop: 4,
  },
  articleCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  articleCardExpanded: {
    borderWidth: 1.5,
  },
  articleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sourceBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  cropBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  cropBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginLeft: 'auto',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  articleTitleExpanded: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  articleBody: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  articleBodyExpanded: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  webLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    marginBottom: 10,
  },
  webLinkBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  expandHint: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
