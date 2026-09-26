import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, ChevronLeft, Check, BookOpen, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { BookMetadata } from '../../lib/bible';

interface BibleNavigationModalProps {
  visible: boolean;
  currentBookIndex: number;
  currentChapter: number;
  books: BookMetadata[];
  onSelectChapter: (bookIndex: number, chapterNumber: number, targetVerse?: number) => void;
  onClose: () => void;
}

type TestamentFilter = 'all' | 'ot' | 'nt';

interface QuickJumpTarget {
  bookIndex: number;
  bookName: string;
  chapterNumber: number;
  verseNumber?: number;
  displayText: string;
}

export function BibleNavigationModal({
  visible,
  currentBookIndex,
  currentChapter,
  books,
  onSelectChapter,
  onClose,
}: BibleNavigationModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<TestamentFilter>('all');
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<BookMetadata | null>(null);

  // Reset internal state when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setFilter('all');
      setSelectedBookForChapters(null);
    }
  }, [visible]);

  // Check if search query is a bare chapter:verse pattern (e.g., "3:4" or "3:56")
  const parsedCV = useMemo(() => {
    const q = searchQuery.trim();
    const cvMatch = q.match(/^(\d+)\s*[:.]\s*(\d+)$/);
    if (cvMatch) {
      const ch = parseInt(cvMatch[1], 10);
      const v = parseInt(cvMatch[2], 10);
      if (ch > 0 && v > 0) {
        return { chapter: ch, verse: v };
      }
    }
    return null;
  }, [searchQuery]);

  // Dynamic testament counts based on search query
  const otCount = useMemo(() => {
    if (parsedCV) {
      return books.filter((b) => b.index < 39 && b.chapterCount >= parsedCV.chapter).length;
    }
    return 39;
  }, [books, parsedCV]);

  const ntCount = useMemo(() => {
    if (parsedCV) {
      return books.filter((b) => b.index >= 39 && b.chapterCount >= parsedCV.chapter).length;
    }
    return 27;
  }, [books, parsedCV]);

  const allCount = otCount + ntCount;

  // Filter books by search query and testament (Approach B)
  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // If bare chapter:verse (e.g. "3:4"), show all books with at least this chapter!
    if (parsedCV) {
      return books.filter((b) => {
        if (filter === 'ot' && b.index >= 39) return false;
        if (filter === 'nt' && b.index < 39) return false;
        return b.chapterCount >= parsedCV.chapter;
      });
    }

    return books.filter((b) => {
      // Testament filter (OT: 0-38, NT: 39-65)
      if (filter === 'ot' && b.index >= 39) return false;
      if (filter === 'nt' && b.index < 39) return false;

      // Search matching
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.shortName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    });
  }, [books, searchQuery, filter, parsedCV]);

  // Compute direct chapter:verse or book chapter:verse quick jump
  const quickJump = useMemo<QuickJumpTarget | null>(() => {
    const q = searchQuery.trim();
    if (!q) return null;

    // 1. Chapter:Verse only (e.g. "3:56", "3:16", "3.16") -> Primary jump to active current book
    if (parsedCV) {
      const currentBook = books[currentBookIndex] || books[0];
      return {
        bookIndex: currentBook.index,
        bookName: currentBook.name,
        chapterNumber: parsedCV.chapter,
        verseNumber: parsedCV.verse,
        displayText: `${currentBook.name} ${parsedCV.chapter}:${parsedCV.verse} (Current Book)`,
      };
    }

    // 2. Book Name + Chapter:Verse (e.g. "John 3:16", "1 John 1:9", "Rom 8:28")
    const bcvMatch = q.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+)\s*[:.]\s*(\d+)$/);
    if (bcvMatch) {
      const bookQuery = bcvMatch[1].trim().toLowerCase();
      const ch = parseInt(bcvMatch[2], 10);
      const v = parseInt(bcvMatch[3], 10);
      const matchedBook = books.find(
        (b) =>
          b.name.toLowerCase() === bookQuery ||
          b.shortName.toLowerCase() === bookQuery ||
          b.name.toLowerCase().startsWith(bookQuery) ||
          b.id.toLowerCase() === bookQuery
      );
      if (matchedBook && ch > 0 && v > 0) {
        return {
          bookIndex: matchedBook.index,
          bookName: matchedBook.name,
          chapterNumber: ch,
          verseNumber: v,
          displayText: `${matchedBook.name} ${ch}:${v}`,
        };
      }
    }

    // 3. Book Name + Chapter (e.g. "John 3", "Psalms 23", "Rom 8")
    const bcMatch = q.match(/^([1-3]?\s*[A-Za-z]+)\s+(\d+)$/);
    if (bcMatch) {
      const bookQuery = bcMatch[1].trim().toLowerCase();
      const ch = parseInt(bcMatch[2], 10);
      const matchedBook = books.find(
        (b) =>
          b.name.toLowerCase() === bookQuery ||
          b.shortName.toLowerCase() === bookQuery ||
          b.name.toLowerCase().startsWith(bookQuery) ||
          b.id.toLowerCase() === bookQuery
      );
      if (matchedBook && ch > 0) {
        return {
          bookIndex: matchedBook.index,
          bookName: matchedBook.name,
          chapterNumber: ch,
          displayText: `${matchedBook.name} Chapter ${ch}`,
        };
      }
    }

    return null;
  }, [searchQuery, books, currentBookIndex, parsedCV]);



  // Generate chapter list array for the selected book
  const chapterList = useMemo(() => {
    if (!selectedBookForChapters) return [];
    return Array.from({ length: selectedBookForChapters.chapterCount }, (_, i) => i + 1);
  }, [selectedBookForChapters]);

  const handleSelectBook = (book: BookMetadata) => {
    if (book.chapterCount === 1) {
      // Single chapter book (e.g. Obadiah, Philemon, 2 John, 3 John, Jude)
      onSelectChapter(book.index, 1);
      onClose();
    } else {
      setSelectedBookForChapters(book);
    }
  };

  const handleSelectChapterNumber = (ch: number) => {
    if (selectedBookForChapters) {
      onSelectChapter(selectedBookForChapters.index, ch);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={() => {
        if (selectedBookForChapters) {
          setSelectedBookForChapters(null);
        } else {
          onClose();
        }
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
          {/* Top Bar */}
          <View
            style={[
              styles.navHeader,
              {
                borderBottomColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            {selectedBookForChapters ? (
              <View style={styles.headerRow}>
                <Pressable
                  onPress={() => setSelectedBookForChapters(null)}
                  hitSlop={12}
                  style={styles.backBtn}
                >
                  <ChevronLeft size={22} color={colors.accent} />
                  <Text style={[styles.backBtnText, { color: colors.accent }]}>Books</Text>
                </Pressable>
                <Text style={[styles.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {selectedBookForChapters.name}
                </Text>
                <Pressable onPress={onClose} hitSlop={12} style={styles.doneBtn}>
                  <Text style={[styles.doneBtnText, { color: colors.accent }]}>Close</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.headerRow}>
                <View style={styles.titleWithIcon}>
                  <BookOpen size={18} color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Go to Passage</Text>
                </View>
                <Pressable onPress={onClose} hitSlop={12} style={styles.doneBtn}>
                  <Text style={[styles.doneBtnText, { color: colors.accent }]}>Done</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* STAGE 2: CHAPTER GRID */}
          {selectedBookForChapters ? (
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
              <View style={styles.chapterHeader}>
                <Text style={[styles.chapterInstruction, { color: colors.textSecondary }]}>
                  SELECT CHAPTER (1 – {selectedBookForChapters.chapterCount})
                </Text>
              </View>
              <FlatList
                key={`chapters_grid_${selectedBookForChapters.id}`}
                data={chapterList}
                keyExtractor={(item) => String(item)}
                numColumns={5}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
                renderItem={({ item: ch }) => {
                  const isCurrent =
                    selectedBookForChapters.index === currentBookIndex && ch === currentChapter;
                  return (
                    <Pressable
                      onPress={() => handleSelectChapterNumber(ch)}
                      style={[
                        styles.chapterGridBtn,
                        {
                          backgroundColor: isCurrent ? colors.accent : colors.surfaceSubtle,
                          borderColor: isCurrent ? colors.accent : colors.borderSubtle,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Chapter ${ch}`}
                    >
                      <Text
                        style={[
                          styles.chapterGridBtnText,
                          {
                            color: isCurrent ? '#141413' : colors.textPrimary,
                            fontFamily: isCurrent ? 'Inter_700Bold' : 'Inter_600SemiBold',
                          },
                        ]}
                      >
                        {ch}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          ) : (
            /* STAGE 1: SEARCH & BOOK LIST */
            <View style={{ flex: 1 }}>
              {/* Search Bar */}
              <View style={[styles.searchContainer, { borderBottomColor: colors.borderSubtle }]}>
                <View
                  style={[
                    styles.searchInputWrapper,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search book, chapter & verse (e.g. 3:56 or John 3:16)..."
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                    returnKeyType={quickJump ? 'go' : 'search'}
                    onSubmitEditing={() => {
                      if (quickJump) {
                        onSelectChapter(quickJump.bookIndex, quickJump.chapterNumber, quickJump.verseNumber);
                        onClose();
                      }
                    }}
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                      <X size={16} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>

                {/* Quick Direct Jump Card */}
                {quickJump && (
                  <Pressable
                    onPress={() => {
                      onSelectChapter(quickJump.bookIndex, quickJump.chapterNumber, quickJump.verseNumber);
                      onClose();
                    }}
                    style={{
                      marginBottom: 10,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: colors.accentBg,
                      borderWidth: 1.5,
                      borderColor: colors.accent,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Sparkles size={16} color={colors.accent} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Quick Jump
                        </Text>
                        <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
                          {quickJump.displayText}
                        </Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#141413' }}>
                        Go →
                      </Text>
                    </View>
                  </Pressable>
                )}

                {/* Filter Chips */}
                <View style={styles.filterChipRow}>
                  <Pressable
                    onPress={() => setFilter('all')}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filter === 'all' ? colors.accent : colors.surfaceSubtle,
                        borderColor: filter === 'all' ? colors.accent : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: filter === 'all' ? '#141413' : colors.textSecondary,
                          fontFamily: filter === 'all' ? 'Inter_700Bold' : 'Inter_500Medium',
                        },
                      ]}
                    >
                      All ({allCount})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setFilter('ot')}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filter === 'ot' ? colors.accent : colors.surfaceSubtle,
                        borderColor: filter === 'ot' ? colors.accent : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: filter === 'ot' ? '#141413' : colors.textSecondary,
                          fontFamily: filter === 'ot' ? 'Inter_700Bold' : 'Inter_500Medium',
                        },
                      ]}
                    >
                      Old Testament ({otCount})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setFilter('nt')}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filter === 'nt' ? colors.accent : colors.surfaceSubtle,
                        borderColor: filter === 'nt' ? colors.accent : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: filter === 'nt' ? '#141413' : colors.textSecondary,
                          fontFamily: filter === 'nt' ? 'Inter_700Bold' : 'Inter_500Medium',
                        },
                      ]}
                    >
                      New Testament ({ntCount})
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Book List (with Approach B Multi-Book Chapter:Verse Jumps) */}
              <FlatList
                key="books_flatlist"
                data={filteredBooks}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}
                renderItem={({ item }) => {
                  const isCurrent = item.index === currentBookIndex;
                  const handlePress = () => {
                    if (parsedCV) {
                      onSelectChapter(item.index, parsedCV.chapter, parsedCV.verse);
                      onClose();
                    } else {
                      handleSelectBook(item);
                    }
                  };

                  return (
                    <Pressable
                      onPress={handlePress}
                      style={({ pressed }) => [
                        styles.bookRow,
                        {
                          borderBottomColor: colors.borderSubtle,
                          backgroundColor: pressed
                            ? colors.surfaceSubtle
                            : isCurrent
                            ? colors.accentBg
                            : 'transparent',
                        },
                      ]}
                    >
                      <View style={styles.bookInfoCol}>
                        <Text
                          style={[
                            styles.bookName,
                            {
                              color: isCurrent ? colors.accent : colors.textPrimary,
                              fontFamily: isCurrent ? 'Inter_700Bold' : 'Inter_500Medium',
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={[styles.testamentBadge, { color: colors.textMuted }]}>
                          {item.index < 39 ? 'Old Testament' : 'New Testament'}
                        </Text>
                      </View>

                      <View style={styles.bookMetaCol}>
                        {parsedCV ? (
                          <View
                            style={[
                              styles.chapterCountPill,
                              {
                                backgroundColor: colors.accentBg,
                                borderColor: colors.accent,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chapterCountText,
                                { color: colors.accent, fontFamily: 'Inter_700Bold' },
                              ]}
                            >
                              {item.name} {parsedCV.chapter}:{parsedCV.verse} →
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.chapterCountPill,
                              { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                            ]}
                          >
                            <Text style={[styles.chapterCountText, { color: colors.textSecondary }]}>
                              {item.chapterCount} {item.chapterCount === 1 ? 'ch' : 'chs'}
                            </Text>
                          </View>
                        )}
                        {isCurrent && <Check size={16} color={colors.accent} style={{ marginLeft: 8 }} />}
                      </View>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      {parsedCV
                        ? `No books in this testament have Chapter ${parsedCV.chapter}`
                        : `No books matching "${searchQuery}"`}
                    </Text>
                  </View>
                }
              />

            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 2,
  },
  doneBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  doneBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  bookInfoCol: {
    flex: 1,
  },
  bookName: {
    fontSize: 16,
    marginBottom: 2,
  },
  testamentBadge: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  bookMetaCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  chapterCountText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  chapterHeader: {
    marginBottom: 14,
  },
  chapterInstruction: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  chapterGridBtn: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  chapterGridBtnText: {
    fontSize: 15,
  },
});
