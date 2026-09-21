import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  useWindowDimensions,
  LayoutChangeEvent,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import {
  Bookmark as BookmarkIcon,
  MessageSquare,
  Share2,
  Type,
  Shuffle,
  ListOrdered,
  Check,
  X,
} from 'lucide-react-native';

import { usePurchases } from '../../lib/purchases';
import { useBibleTranslation } from '../../lib/bible';
import { useReadingTimer } from '../../lib/readingTimer';
import { useTheme } from '../../lib/themeContext';
import {
  ScrollVerseItem,
  getVerseAtPosition,
  getNextPosition,
  getRandomVerseFull,
  getMoodVerses,
} from '../../lib/bible';
import {
  getScrollPosition,
  setScrollPosition,
  getScrollMode,
  setScrollMode,
  getScrollFont,
  setScrollFont,
  getScrollMood,
  setScrollMood,
  ScrollFont,
  ScrollPosition,
} from '../../lib/mmkv';
import { MOODS, MoodKey } from '../../data/moodVerses';
import { getBackgroundForIndex, prefetchOnlineBackground } from '../../lib/scrollImageCache';
import { shareVerseAsImage } from '../../lib/shareVerseImage';
import { ScrollVerseCard } from '../../components/ScrollVerseCard';
import { ScrollPaywallGate } from '../../components/ScrollPaywallGate';
import { BookmarkPickerSheet, VerseData } from '../../components/BookmarkPickerSheet';

const BATCH_SIZE = 12;
const MAX_BUFFER_SIZE = 60;

export default function ScrollScreen() {
  const { isPremium } = usePurchases();
  const [translation] = useBibleTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();

  // Screen focus & reading timer
  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      prefetchOnlineBackground().catch(() => {});
      return () => setIsFocused(false);
    }, [])
  );
  useReadingTimer(isFocused);

  // Scroll Preferences State
  const [font, setFontState] = useState<ScrollFont>(getScrollFont);
  const [mood, setMoodState] = useState<MoodKey>(getScrollMood);
  const [mode, setModeState] = useState<'sequential' | 'random'>(getScrollMode);

  // Verses feed data
  const [verses, setVerses] = useState<ScrollVerseItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Measured container height for responsive paging
  const [containerHeight, setContainerHeight] = useState<number>(screenHeight);
  const [containerWidth, setContainerWidth] = useState<number>(screenWidth);

  // Modals & Sheets
  const [bookmarkSheetVisible, setBookmarkSheetVisible] = useState(false);
  const [fontModalVisible, setFontModalVisible] = useState(false);

  // Active card view ref for sharing (eliminates Map leak)
  const activeCardRef = useRef<View>(null);
  const flatListRef = useRef<FlatList<ScrollVerseItem>>(null);

  // Handle container layout for pixel-perfect paging
  const handleLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    if (height > 0 && height !== containerHeight) {
      setContainerHeight(height);
    }
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  // Load verses generator based on mode & mood
  const loadInitialVerses = useCallback(
    (targetMood: MoodKey, targetMode: 'sequential' | 'random') => {
      if (targetMood !== 'all') {
        const moodList = getMoodVerses(translation, targetMood);
        // Shuffle mood verses for variety
        const shuffled = [...moodList].sort(() => Math.random() - 0.5);
        setVerses(shuffled);
        setCurrentIndex(0);
        return;
      }

      if (targetMode === 'random') {
        const initialList: ScrollVerseItem[] = [];
        for (let i = 0; i < BATCH_SIZE; i++) {
          initialList.push(getRandomVerseFull(translation));
        }
        setVerses(initialList);
        setCurrentIndex(0);
        return;
      }

      // Sequential mode: start at saved position
      const savedPos = getScrollPosition();
      let currentPos = savedPos;
      const initialList: ScrollVerseItem[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const item = getVerseAtPosition(translation, currentPos);
        if (item) {
          initialList.push(item);
          currentPos = getNextPosition(translation, currentPos);
        } else {
          break;
        }
      }

      setVerses(initialList.length > 0 ? initialList : [getRandomVerseFull(translation)]);
      setCurrentIndex(0);
    },
    [translation]
  );

  // Reload when mood, mode, or translation changes
  useEffect(() => {
    loadInitialVerses(mood, mode);
  }, [mood, mode, translation, loadInitialVerses]);

  // Load more verses when scrolling near end
  const handleLoadMore = useCallback(() => {
    if (mood !== 'all') {
      // In mood mode, cycle verses seamlessly using pre-computed cache
      const moodList = getMoodVerses(translation, mood);
      const shuffled = [...moodList].sort(() => Math.random() - 0.5);
      setVerses((prev) => [...prev, ...shuffled]);
      return;
    }

    if (mode === 'random') {
      const more: ScrollVerseItem[] = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        more.push(getRandomVerseFull(translation));
      }
      setVerses((prev) => [...prev, ...more]);
      return;
    }

    // Sequential mode: append from last verse's next position
    setVerses((prev) => {
      if (prev.length === 0) return prev;
      const lastVerse = prev[prev.length - 1];
      let currentPos = getNextPosition(translation, lastVerse.position);
      const more: ScrollVerseItem[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const item = getVerseAtPosition(translation, currentPos);
        if (item) {
          more.push(item);
          currentPos = getNextPosition(translation, currentPos);
        } else {
          break;
        }
      }
      return [...prev, ...more];
    });
  }, [mood, mode, translation]);

  // Viewable item change tracking
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);
        const activeVerse = viewableItems[0].item as ScrollVerseItem;
        if (activeVerse && mood === 'all' && mode === 'sequential') {
          setScrollPosition(activeVerse.position);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // Mood selection
  const handleSelectMood = (selectedKey: MoodKey) => {
    setMoodState(selectedKey);
    setScrollMood(selectedKey);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  // Mode toggle (Sequential <-> Random)
  const handleToggleMode = () => {
    const nextMode = mode === 'sequential' ? 'random' : 'sequential';
    setModeState(nextMode);
    setScrollMode(nextMode);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  // Font selection
  const handleSelectFont = (newFont: ScrollFont) => {
    setFontState(newFont);
    setScrollFont(newFont);
    setFontModalVisible(false);
  };

  // Current active verse
  const currentVerseItem = verses[currentIndex] || verses[0];

  const pickerVerseObject: VerseData | null = useMemo(() => {
    if (!currentVerseItem) return null;
    return {
      bookIndex: currentVerseItem.position.bookIndex,
      bookName: currentVerseItem.bookName,
      chapterNumber: currentVerseItem.chapter,
      verseNumber: currentVerseItem.verse,
      verseText: currentVerseItem.text,
    };
  }, [currentVerseItem]);

  // Share current verse card as image
  const handleShare = () => {
    if (activeCardRef.current) {
      shareVerseAsImage(activeCardRef);
    }
  };

  const keyExtractor = useCallback(
    (item: ScrollVerseItem, idx: number) =>
      `${item.position.bookIndex}_${item.position.chapterIndex}_${item.position.verseIndex}_${idx}`,
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ScrollVerseItem; index: number }) => (
      <ScrollVerseCard
        ref={index === currentIndex ? activeCardRef : undefined}
        verse={item}
        bgSource={getBackgroundForIndex(index)}
        font={font}
        cardHeight={containerHeight}
        cardWidth={containerWidth}
        topInset={insets.top}
        bottomInset={insets.bottom}
      />
    ),
    [currentIndex, font, containerHeight, containerWidth, insets.top, insets.bottom]
  );

  // If not premium, render the marketing gate
  if (!isPremium) {
    return <ScrollPaywallGate />;
  }

  return (
    <View style={styles.root} onLayout={handleLayout}>
      {/* Mood Chip Bar - Absolute Top Header */}
      <View style={[styles.moodBarContainer, { top: insets.top + 6 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodScrollContent}
        >
          {MOODS.map((m) => {
            const isSelected = mood === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => handleSelectMood(m.key)}
                style={[
                  styles.moodChip,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(245, 184, 0, 0.95)'
                      : 'rgba(0, 0, 0, 0.55)',
                    borderColor: isSelected
                      ? '#f5b800'
                      : 'rgba(255, 255, 255, 0.22)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.moodChipText,
                    {
                      color: isSelected ? '#141413' : '#ffffff',
                      fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_500Medium',
                    },
                  ]}
                >
                  {m.emoji} {m.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Verse FlatList */}
      <FlatList
        ref={flatListRef}
        data={verses}
        keyExtractor={keyExtractor}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        removeClippedSubviews={true}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.8}
        renderItem={renderItem}
      />

      {/* Mode Toggle Button - Bottom Left (only in 'all' mood) */}
      {mood === 'all' && (
        <Pressable
          onPress={handleToggleMode}
          style={({ pressed }) => [
            styles.modeButton,
            {
              bottom: insets.bottom + 18,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          {mode === 'sequential' ? (
            <>
              <ListOrdered size={15} color="#f5b800" strokeWidth={2.2} />
              <Text style={styles.modeButtonText}>Sequential</Text>
            </>
          ) : (
            <>
              <Shuffle size={15} color="#f5b800" strokeWidth={2.2} />
              <Text style={styles.modeButtonText}>Random</Text>
            </>
          )}
        </Pressable>
      )}

      {/* Floating Action Controls - Right Column */}
      <View style={[styles.floatingControls, { bottom: insets.bottom + 14 }]}>
        {/* Bookmark Action */}
        <Pressable
          onPress={() => setBookmarkSheetVisible(true)}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityLabel="Bookmark verse"
        >
          <BookmarkIcon size={22} color="#ffffff" strokeWidth={2} />
          <Text style={styles.actionLabel}>Save</Text>
        </Pressable>

        {/* Note Action */}
        <Pressable
          onPress={() => setBookmarkSheetVisible(true)}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityLabel="Add note"
        >
          <MessageSquare size={22} color="#ffffff" strokeWidth={2} />
          <Text style={styles.actionLabel}>Note</Text>
        </Pressable>

        {/* Share Action */}
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityLabel="Share verse"
        >
          <Share2 size={22} color="#ffffff" strokeWidth={2} />
          <Text style={styles.actionLabel}>Share</Text>
        </Pressable>

        {/* Font Picker Action */}
        <Pressable
          onPress={() => setFontModalVisible(true)}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityLabel="Select font"
        >
          <Type size={22} color="#ffffff" strokeWidth={2} />
          <Text style={styles.actionLabel}>Font</Text>
        </Pressable>
      </View>

      {/* Font Picker Modal */}
      <Modal
        visible={fontModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFontModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setFontModalVisible(false)}
        >
          <Pressable style={styles.fontSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.fontSheetHeader}>
              <Text style={styles.fontSheetTitle}>Typography</Text>
              <Pressable
                onPress={() => setFontModalVisible(false)}
                hitSlop={8}
              >
                <X size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            <View style={styles.fontOptions}>
              {/* Garamond */}
              <Pressable
                onPress={() => handleSelectFont('garamond')}
                style={[
                  styles.fontRow,
                  font === 'garamond' && styles.fontRowSelected,
                ]}
              >
                <View>
                  <Text style={[styles.fontPreviewText, { fontFamily: 'EBGaramond_400Regular' }]}>
                    EB Garamond
                  </Text>
                  <Text style={styles.fontSubtext}>Sacred & Classic Scripture Serif</Text>
                </View>
                {font === 'garamond' && <Check size={18} color="#f5b800" />}
              </Pressable>

              {/* Inter */}
              <Pressable
                onPress={() => handleSelectFont('inter')}
                style={[
                  styles.fontRow,
                  font === 'inter' && styles.fontRowSelected,
                ]}
              >
                <View>
                  <Text style={[styles.fontPreviewText, { fontFamily: 'Inter_400Regular' }]}>
                    Inter
                  </Text>
                  <Text style={styles.fontSubtext}>Clean & Contemporary Sans</Text>
                </View>
                {font === 'inter' && <Check size={18} color="#f5b800" />}
              </Pressable>

              {/* Playfair Display */}
              <Pressable
                onPress={() => handleSelectFont('playfair')}
                style={[
                  styles.fontRow,
                  font === 'playfair' && styles.fontRowSelected,
                ]}
              >
                <View>
                  <Text style={[styles.fontPreviewText, { fontFamily: 'PlayfairDisplay_700Bold' }]}>
                    Playfair Display
                  </Text>
                  <Text style={styles.fontSubtext}>Bold & Regal Editorial Serif</Text>
                </View>
                {font === 'playfair' && <Check size={18} color="#f5b800" />}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bookmark / Note Bottom Sheet */}
      {pickerVerseObject && (
        <BookmarkPickerSheet
          visible={bookmarkSheetVisible}
          verse={pickerVerseObject}
          onDone={() => setBookmarkSheetVisible(false)}
          onCancel={() => setBookmarkSheetVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  moodBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
  },
  moodScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  moodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  moodChipText: {
    fontSize: 13,
  },
  modeButton: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(245, 184, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  modeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  actionBtnPressed: {
    backgroundColor: 'rgba(245, 184, 0, 0.4)',
    borderColor: '#f5b800',
    transform: [{ scale: 0.94 }],
  },
  actionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  fontSheet: {
    backgroundColor: '#161c18',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    paddingBottom: 40,
  },
  fontSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  fontSheetTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  fontOptions: {
    gap: 12,
  },
  fontRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    borderRadius: 16,
  },
  fontRowSelected: {
    borderColor: '#f5b800',
    backgroundColor: 'rgba(245, 184, 0, 0.08)',
  },
  fontPreviewText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 4,
  },
  fontSubtext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.55)',
  },
});
