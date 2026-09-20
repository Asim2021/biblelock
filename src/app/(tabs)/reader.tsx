import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getBooks, getChapter, Verse, useBibleTranslation } from '../../lib/bible';
import { useReadingTimer } from '../../lib/readingTimer';
import {
  getLastReadPosition,
  setLastReadPosition,
  getBookmarks,
  getCollections,
  VerseCollection,
} from '../../lib/mmkv';
import { BookmarkPickerSheet } from '../../components/BookmarkPickerSheet';
import { Button } from '../../components/Button';
import {
  Clock,
  Unlock,
  Sparkles,
  ChevronDown,
  Check,
  Bookmark as BookmarkIcon,
} from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { useFeatureGate } from '../../lib/useFeatureGate';

interface VerseRowProps {
  item: Verse;
  colIds?: string[];
  isTargeted: boolean;
  showTooltip: boolean;
  colNames: string;
  colors: any;
  onPressBookmark: (item: Verse) => void;
  onLongPressVerse: (item: Verse) => void;
  onPressTooltip: (item: Verse) => void;
}

const VerseRow = React.memo<VerseRowProps>(({
  item,
  colIds,
  isTargeted,
  showTooltip,
  colNames,
  colors,
  onPressBookmark,
  onLongPressVerse,
  onPressTooltip,
}) => {
  const isBookmarked = colIds && colIds.length > 0;
  const colCount = colIds ? colIds.length : 0;

  return (
    <View
      style={{
        marginBottom: 14,
        borderRadius: 8,
        backgroundColor: isTargeted
          ? colors.accentBg
          : isBookmarked
          ? colors.surface
          : 'transparent',
        borderLeftWidth: isTargeted ? 3 : 0,
        borderLeftColor: colors.accent,
        padding: 8,
      }}
    >
      <Pressable
        onLongPress={() => onLongPressVerse(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'Inter_700Bold',
            color: colors.accent,
            marginRight: 12,
            width: 24,
            textAlign: 'right',
          }}
        >
          {item.verse}
        </Text>
        <Text
          style={{
            flex: 1,
            fontFamily: 'EBGaramond_400Regular',
            fontSize: 18,
            lineHeight: 30,
            color: colors.textPrimary,
          }}
        >
          {item.text}
        </Text>
        <Pressable
          onPress={() => onPressBookmark(item)}
          hitSlop={8}
          style={{
            marginLeft: 8,
            padding: 4,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <BookmarkIcon
            size={15}
            color={isBookmarked ? colors.accent : colors.textMuted}
            fill={isBookmarked ? colors.accent : 'transparent'}
          />
          {colCount > 1 && (
            <View
              style={{
                backgroundColor: colors.accent,
                borderRadius: 6,
                minWidth: 14,
                height: 14,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 3,
                paddingHorizontal: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: colors.accentText || '#000000',
                }}
              >
                {colCount}
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>

      {/* Tooltip Pill for Bookmarked Verse */}
      {showTooltip && (
        <Pressable
          onPress={() => onPressTooltip(item)}
          hitSlop={8}
          style={{
            marginTop: 6,
            marginLeft: 36,
            marginRight: 16,
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 8,
            backgroundColor: colors.surfaceElevated || colors.surfaceSubtle,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            maxWidth: '85%',
          }}
        >
          <BookmarkIcon
            size={11}
            color={colors.accent}
            fill={colors.accent}
            style={{ marginRight: 6 }}
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              flexShrink: 1,
              fontSize: 12,
              color: colors.textSecondary,
              fontFamily: 'Inter_500Medium',
            }}
          >
            {colNames}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.accent,
              fontFamily: 'Inter_700Bold',
              marginLeft: 8,
            }}
          >
            [Edit]
          </Text>
        </Pressable>
      )}
    </View>
  );
});

export default function ReaderScreen() {
  const { colors, isDark } = useTheme();
  const { requirePremium } = useFeatureGate();
  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const timer = useReadingTimer(isFocused);
  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    verse?: string;
  }>();

  const [translation, setTranslationState] = useBibleTranslation();

  const allBooks = useMemo(() => getBooks(translation), [translation]);

  // Initialize position from query params if passed, or stored MMKV last read position
  const [bookIndex, setBookIndex] = useState(() => {
    if (params.book) {
      const idx = allBooks.findIndex(
        (b) =>
          b.name.toLowerCase() === params.book?.toLowerCase() ||
          b.id.toLowerCase() === params.book?.toLowerCase()
      );
      if (idx !== -1) return idx;
    }
    const saved = getLastReadPosition();
    return saved.bookIndex < allBooks.length ? saved.bookIndex : 0;
  });

  const [chapterNumber, setChapterNumber] = useState(() => {
    if (params.chapter) {
      const ch = parseInt(params.chapter, 10);
      if (!isNaN(ch) && ch > 0) return ch;
    }
    const saved = getLastReadPosition();
    return saved.chapterNumber || 1;
  });

  const [targetVerse, setTargetVerse] = useState<number | null>(() => {
    if (params.verse) {
      const v = parseInt(params.verse, 10);
      return !isNaN(v) ? v : null;
    }
    return null;
  });

  const [verseCollectionMap, setVerseCollectionMap] = useState<Record<number, string[]>>({});
  const [allCollections, setAllCollections] = useState<VerseCollection[]>([]);
  const [pickerVerse, setPickerVerse] = useState<Verse | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tooltipVerseNumber, setTooltipVerseNumber] = useState<number | null>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showBookModal, setShowBookModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  // Accurate viewability tracking for last read position (topmost visible verse)
  const lastVisibleVerseRef = useRef<number>(1);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 40 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].item?.verse) {
      lastVisibleVerseRef.current = viewableItems[0].item.verse;
    }
  }).current;

  const currentChapterData = useMemo(
    () => getChapter(translation, bookIndex, chapterNumber),
    [translation, bookIndex, chapterNumber]
  );
  const currentBook = allBooks[bookIndex] || allBooks[0];

  // Refresh saved bookmarks and collections for this chapter
  const refreshBookmarks = useCallback(() => {
    const list = getBookmarks();
    const map: Record<number, string[]> = {};
    for (const b of list) {
      if (b.bookName === currentBook.name && b.chapterNumber === chapterNumber) {
        map[b.verseNumber] = b.collectionIds || [];
      }
    }
    setVerseCollectionMap(map);
    setAllCollections(getCollections());
  }, [currentBook.name, chapterNumber]);

  // Persist current reading position
  const saveCurrentLastRead = useCallback(() => {
    if (currentBook) {
      setLastReadPosition({
        bookIndex,
        bookName: currentBook.name,
        chapterNumber,
        verseNumber: lastVisibleVerseRef.current || targetVerse || 1,
        updatedAt: Date.now(),
      });
    }
  }, [bookIndex, chapterNumber, currentBook.name, targetVerse]);

  // Refresh bookmarks on focus & save last-read on blur
  useFocusEffect(
    useCallback(() => {
      refreshBookmarks();
      return () => {
        saveCurrentLastRead();
      };
    }, [refreshBookmarks, saveCurrentLastRead])
  );

  // Re-read bookmarks when chapter/book changes
  useEffect(() => {
    refreshBookmarks();
  }, [bookIndex, chapterNumber, refreshBookmarks]);

  // Handle incoming query parameter changes while on screen
  useEffect(() => {
    if (params.book) {
      const idx = allBooks.findIndex(
        (b) =>
          b.name.toLowerCase() === params.book?.toLowerCase() ||
          b.id.toLowerCase() === params.book?.toLowerCase()
      );
      if (idx !== -1) setBookIndex(idx);
    }
    if (params.chapter) {
      const ch = parseInt(params.chapter, 10);
      if (!isNaN(ch) && ch > 0) setChapterNumber(ch);
    }
    if (params.verse) {
      const v = parseInt(params.verse, 10);
      if (!isNaN(v)) setTargetVerse(v);
    }
  }, [params.book, params.chapter, params.verse, allBooks]);

  // Persist current reading position whenever book or chapter changes
  useEffect(() => {
    saveCurrentLastRead();
  }, [bookIndex, chapterNumber, saveCurrentLastRead]);

  // Scroll to targeted verse if requested
  useEffect(() => {
    if (targetVerse && currentChapterData?.verses?.length) {
      const verseIdx = currentChapterData.verses.findIndex((v) => v.verse === targetVerse);
      if (verseIdx !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: verseIdx,
            animated: true,
            viewPosition: 0.2,
          });
        }, 300);
      }
    }
  }, [targetVerse, currentChapterData]);

  // Memoize verse object passed into BookmarkPickerSheet so child useEffect doesn't thrash
  const pickerVerseObject = useMemo(() => {
    if (!pickerVerse) return null;
    return {
      bookIndex,
      bookName: currentBook.name,
      chapterNumber,
      verseNumber: pickerVerse.verse,
      verseText: pickerVerse.text,
    };
  }, [pickerVerse, bookIndex, currentBook.name, chapterNumber]);

  // Memoize chapters array so horizontal chapter picker doesn't allocate on every render
  const chaptersList = useMemo(() => {
    const count = currentBook?.chapterCount || 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [currentBook?.chapterCount]);

  // Memoize collection name lookup map for O(1) resolution during verse rendering
  const collectionNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of allCollections) {
      map[c.id] = c.name;
    }
    return map;
  }, [allCollections]);

  const handlePressBookmark = useCallback((verseItem: Verse) => {
    // Open bottom sheet picker directly so user can view/change collections, edit note, or remove
    setPickerVerse(verseItem);
    setIsPickerVisible(true);
    setTooltipVerseNumber(null);
  }, []);

  const handleLongPressVerse = useCallback((verseItem: Verse) => {
    setPickerVerse(verseItem);
    setIsPickerVisible(true);
    setTooltipVerseNumber(null);
  }, []);

  const handlePressTooltip = useCallback((verseItem: Verse) => {
    setTooltipVerseNumber(null);
    setPickerVerse(verseItem);
    setIsPickerVisible(true);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Verse }) => {
      const colIds = verseCollectionMap[item.verse];
      const isTargeted = targetVerse === item.verse;
      const showTooltip = tooltipVerseNumber === item.verse;
      const colNames =
        (colIds || [])
          .map((id) => collectionNameMap[id])
          .filter(Boolean)
          .join(', ') || 'Saved';

      return (
        <VerseRow
          item={item}
          colIds={colIds}
          isTargeted={isTargeted}
          showTooltip={showTooltip}
          colNames={colNames}
          colors={colors}
          onPressBookmark={handlePressBookmark}
          onLongPressVerse={handleLongPressVerse}
          onPressTooltip={handlePressTooltip}
        />
      );
    },
    [
      verseCollectionMap,
      targetVerse,
      tooltipVerseNumber,
      collectionNameMap,
      colors,
      handlePressBookmark,
      handleLongPressVerse,
      handlePressTooltip,
    ]
  );

  // Switch translation
  const handleToggleTranslation = (newTr: 'WEB' | 'KJV') => {
    setTranslationState(newTr);
  };

  // Switch chapter
  const handleSelectChapter = (ch: number) => {
    setChapterNumber(ch);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleNextChapter = () => {
    if (!currentChapterData) return;
    if (chapterNumber < currentChapterData.totalChapters) {
      handleSelectChapter(chapterNumber + 1);
    } else if (bookIndex < allBooks.length - 1) {
      setBookIndex(bookIndex + 1);
      setChapterNumber(1);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handlePrevChapter = () => {
    if (chapterNumber > 1) {
      handleSelectChapter(chapterNumber - 1);
    } else if (bookIndex > 0) {
      const prevBookIdx = bookIndex - 1;
      setBookIndex(prevBookIdx);
      const prevBookMeta = allBooks[prevBookIdx];
      setChapterNumber(prevBookMeta.chapterCount);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      {/* Top Active Reading Timer Bar */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="mr-2">
              {timer.isGoalMet ? (
                <Unlock size={14} color={colors.success} />
              ) : (
                <Clock size={14} color={colors.accent} />
              )}
            </View>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_600SemiBold',
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: colors.textSecondary,
              }}
            >
              {timer.isGoalMet ? 'Apps Unlocked' : 'Reading Timer Active'}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Inter_700Bold',
              color: colors.accent,
            }}
          >
            {timer.formattedTime} / {timer.formattedGoal}
          </Text>
        </View>

        {/* Progress Bar */}
        <View
          style={{
            height: 6,
            width: '100%',
            backgroundColor: colors.surfaceSubtle,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              borderRadius: 3,
              backgroundColor: timer.isGoalMet ? colors.success : colors.accent,
              width: `${Math.round(timer.progress * 100)}%`,
            }}
          />
        </View>
      </View>


      {/* Book & Translation Selection Bar */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => setShowBookModal(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Inter_700Bold',
              color: colors.textPrimary,
              marginRight: 8,
            }}
          >
            {currentBook.name} {chapterNumber}
          </Text>
          <ChevronDown size={14} color={colors.textSecondary} />
        </Pressable>

        {/* Translation Toggle Pill */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceSubtle,
            borderRadius: 8,
            padding: 3,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => handleToggleTranslation('WEB')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: translation === 'WEB' ? colors.accent : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_600SemiBold',
                color: translation === 'WEB' ? '#141413' : colors.textSecondary,
              }}
            >
              WEB
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleToggleTranslation('KJV')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: translation === 'KJV' ? colors.accent : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_600SemiBold',
                color: translation === 'KJV' ? '#141413' : colors.textSecondary,
              }}
            >
              KJV
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Horizontal Chapter Picker */}
      <View
        style={{
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {chaptersList.map((ch) => (
            <Pressable
              key={ch}
              onPress={() => handleSelectChapter(ch)}
              style={{
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 18,
                marginRight: 8,
                backgroundColor: chapterNumber === ch ? colors.accent : colors.surfaceSubtle,
                borderWidth: chapterNumber === ch ? 0 : 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  color: chapterNumber === ch ? '#141413' : colors.textSecondary,
                }}
              >
                {ch}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Goal Achieved Toast Banner */}
      {timer.isGoalMet && (
        <View
          style={{
            backgroundColor: colors.successBg,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View className="mr-2">
            <Sparkles size={16} color={colors.success} />
          </View>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.success }}>
            Daily goal met! Distracting apps are unlocked for the day.
          </Text>
        </View>
      )}

      {/* Scripture Verses List */}
      <FlatList
        ref={flatListRef}
        data={currentChapterData?.verses || []}
        extraData={verseCollectionMap}
        keyExtractor={(item) => String(item.verse)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View className="mb-6 items-center">
            <Text
              style={{
                fontFamily: 'EBGaramond_700Bold',
                fontSize: 28,
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {currentBook.name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_600SemiBold',
                color: colors.accent,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Chapter {chapterNumber} • {translation}
            </Text>
          </View>
        }
        renderItem={renderItem}
        ListFooterComponent={
          <View
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Button
              title="← Prev Chapter"
              variant="outline"
              size="sm"
              onPress={handlePrevChapter}
              disabled={bookIndex === 0 && chapterNumber === 1}
            />
            <Button
              title="Next Chapter →"
              variant="primary"
              size="sm"
              onPress={handleNextChapter}
            />
          </View>
        }
      />

      {/* Book Selection Modal */}
      <Modal
        visible={showBookModal}
        animationType="slide"
        transparent={false}
        statusBarTranslucent
        onRequestClose={() => setShowBookModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 18, fontFamily: 'EBGaramond_700Bold', color: colors.textPrimary }}>
                Select Book of the Bible
              </Text>
              <Pressable
                onPress={() => setShowBookModal(false)}
                style={{ padding: 8 }}
              >
                <Text style={{ fontSize: 15, color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>Done</Text>
              </Pressable>
            </View>

            <FlatList
              data={allBooks}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => {
                const isSelected = bookIndex === index;
                const isOldTestament = index < 39;
                const showSectionHeader = index === 0 || index === 39;

                return (
                  <View>
                    {showSectionHeader && (
                      <View style={{ backgroundColor: colors.surfaceSubtle, paddingHorizontal: 20, paddingVertical: 10 }}>
                        <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.accent }}>
                          {isOldTestament ? 'Old Testament (39 Books)' : 'New Testament (27 Books)'}
                        </Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => {
                        setBookIndex(index);
                        setChapterNumber(1);
                        setShowBookModal(false);
                        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
                      }}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderSubtle,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? colors.accentBg : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_400Regular',
                          color: isSelected ? colors.accent : colors.textPrimary,
                        }}
                      >
                        {item.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginRight: 8 }}>
                          {item.chapterCount} {item.chapterCount === 1 ? 'ch' : 'chs'}
                        </Text>
                        {isSelected && <Check size={16} color={colors.accent} />}
                      </View>
                    </Pressable>
                  </View>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>

      {/* Non-shifting Bottom Floating Toast */}
      {toastMessage && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: Math.max(insets.bottom + 16, 24),
            left: 20,
            right: 20,
            backgroundColor: colors.surfaceElevated || colors.surface,
            borderWidth: 1,
            borderColor: colors.accent,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 999,
          }}
        >
          <BookmarkIcon
            size={15}
            color={colors.accent}
            fill={colors.accent}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Inter_600SemiBold',
              color: colors.textPrimary,
              textAlign: 'center',
            }}
          >
            {toastMessage}
          </Text>
        </View>
      )}

      {/* Bookmark Picker Bottom Sheet */}
      {isPickerVisible && (
        <BookmarkPickerSheet
          visible={isPickerVisible}
          verse={pickerVerseObject}
          onDone={() => {
            const v = pickerVerse;
            setIsPickerVisible(false);
            setPickerVerse(null);
            refreshBookmarks();
            if (v) {
              setToastMessage(`Saved ${currentBook.name} ${chapterNumber}:${v.verse}`);
              setTimeout(() => setToastMessage(null), 2500);
            }
          }}
          onCancel={() => {
            setIsPickerVisible(false);
            setPickerVerse(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}
