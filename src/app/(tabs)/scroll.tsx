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
  Vibration,
  Animated,
  Share,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bookmark as BookmarkIcon,
  MessageSquare,
  Share2,
  Type,
  Shuffle,
  ListOrdered,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  Globe,
  Copy,
  Lock,
} from 'lucide-react-native';

import { usePurchases } from '../../lib/purchases';
import { useFeatureGate } from '../../lib/useFeatureGate';
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
  getBookmarkByVerse,
  saveVerseBookmark,
  getCollections,
  getScrollDailyFreeCount,
  incrementScrollDailyFreeCount,
  getDailyFreeScrollVerses,
  setDailyFreeScrollVerses,
  FREE_DAILY_SCROLL_LIMIT,
  ScrollFont,
  ScrollPosition,
} from '../../lib/mmkv';
import { MOODS, MoodKey } from '../../data/moodVerses';
import {
  getBackgroundForIndex,
  initializeBackgroundCache,
  prewarmAdjacentBackgrounds,
  getAvailableBackgroundCount,
} from '../../lib/scrollImageCache';
import { shareVerseAsImage } from '../../lib/shareVerseImage';
import { ScrollVerseCard } from '../../components/ScrollVerseCard';
import { ScrollPaywallGate } from '../../components/ScrollPaywallGate';
import { BookmarkPickerSheet, VerseData } from '../../components/BookmarkPickerSheet';
import { BibleTranslationModal } from '../../components/BibleTranslationModal';
import { getTranslationBadge } from '../../data/bibleCatalog';

const BATCH_SIZE = 12;

export default function ScrollScreen() {
  const router = useRouter();
  const { isPremium } = usePurchases();
  const { requirePremium } = useFeatureGate();
  const [translation] = useBibleTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();

  // Screen focus state
  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      initializeBackgroundCache().catch(() => {});
      return () => setIsFocused(false);
    }, [])
  );

  // 60-second idle dwell cap per verse & active timer tracking
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 60000); // 60s max dwell per verse before pausing
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetIdleTimer]);

  // Current verse index state
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    resetIdleTimer();
  }, [currentIndex, resetIdleTimer]);

  // Reading timer only ticks when screen is focused, user is not idle,
  // and user is NOT sitting on the freemium paywall card (card 4 at index >= 3)
  const isTimerActive =
    isFocused && !isIdle && (isPremium || currentIndex < FREE_DAILY_SCROLL_LIMIT);
  const timer = useReadingTimer(isTimerActive);

  // Scroll Preferences State
  const [font, setFontState] = useState<ScrollFont>(getScrollFont);
  const [mood, setMoodState] = useState<MoodKey>(getScrollMood);
  const [mode, setModeState] = useState<'sequential' | 'random'>(getScrollMode);

  // Verses feed data
  const [verses, setVerses] = useState<ScrollVerseItem[]>([]);

  // Free Tier Daily Quota Tracking
  const [dailyFreeScrolls, setDailyFreeScrolls] = useState<number>(() => getScrollDailyFreeCount());

  // Measured container height for responsive paging
  const [containerHeight, setContainerHeight] = useState<number>(screenHeight);
  const [containerWidth, setContainerWidth] = useState<number>(screenWidth);

  // Modals & Sheets
  const [bookmarkSheetVisible, setBookmarkSheetVisible] = useState(false);
  const [initialNoteExpanded, setInitialNoteExpanded] = useState(false);
  const [fontModalVisible, setFontModalVisible] = useState(false);
  const [translationModalVisible, setTranslationModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Double-tap visual save burst
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const saveAnimScale = useRef(new Animated.Value(0)).current;
  const saveAnimOpacity = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef<number>(0);

  // Active card view ref for sharing
  const activeCardRef = useRef<View>(null);
  const flatListRef = useRef<FlatList<ScrollVerseItem>>(null);

  // Bookmark sync state trigger
  const [bookmarkSyncToken, setBookmarkSyncToken] = useState(0);

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
      // Freemium: Freeze today's 3 free scrolls in storage to prevent re-roll exploits
      if (!isPremium) {
        const cached = getDailyFreeScrollVerses<ScrollVerseItem>();
        if (cached && cached.length >= FREE_DAILY_SCROLL_LIMIT) {
          // Exactly 4 items: 3 cached free scrolls + 1 terminal gate card
          setVerses([...cached.slice(0, FREE_DAILY_SCROLL_LIMIT), cached[0]]);
          setCurrentIndex(0);
          return;
        }

        // Generate today's 3 free scrolls from sequential reader position
        const savedPos = getScrollPosition();
        let currentPos = savedPos;
        const initialList: ScrollVerseItem[] = [];

        for (let i = 0; i < FREE_DAILY_SCROLL_LIMIT; i++) {
          const item = getVerseAtPosition(translation, currentPos);
          if (item) {
            initialList.push(item);
            currentPos = getNextPosition(translation, currentPos);
          } else {
            initialList.push(getRandomVerseFull(translation));
          }
        }

        const finalInitial =
          initialList.length > 0 ? initialList : [getRandomVerseFull(translation)];
        setDailyFreeScrollVerses(finalInitial);
        // 4 items: 3 free scrolls + 1 terminal gate card
        setVerses([...finalInitial, finalInitial[0]]);
        setCurrentIndex(0);
        return;
      }

      // Sanctuary (Premium) users: full feed with moods & sequential/random
      if (targetMood !== 'all') {
        const moodList = getMoodVerses(translation, targetMood);
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
    [translation, isPremium]
  );

  // Reload when mood, mode, or translation changes
  useEffect(() => {
    loadInitialVerses(mood, mode);
  }, [mood, mode, translation, loadInitialVerses]);

  // Load more verses when scrolling near end
  const handleLoadMore = useCallback(() => {
    // Non-premium users cannot scroll past card 4 (3 free + 1 gated card)
    if (!isPremium) {
      return;
    }

    if (mood !== 'all') {
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
  }, [mood, mode, translation, isPremium, verses.length]);

  // Viewable item change tracking
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);
        prewarmAdjacentBackgrounds(newIndex);
        resetIdleTimer();

        // Track daily free scroll quota
        if (!isPremium) {
          const updatedCount = incrementScrollDailyFreeCount();
          setDailyFreeScrolls(updatedCount);
        }

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

  // Mood selection - emotions are Sanctuary exclusive
  const handleSelectMood = (selectedKey: MoodKey) => {
    if (selectedKey !== 'all' && !isPremium) {
      const moodItem = MOODS.find((m) => m.key === selectedKey);
      requirePremium(`Mood-Guided Scripture (${moodItem?.label || 'Emotion'})`);
      return;
    }
    setMoodState(selectedKey);
    setScrollMood(selectedKey);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  // Mode toggle (Sequential <-> Random) - Sanctuary only
  const handleToggleMode = () => {
    if (!isPremium) {
      requirePremium('Scroll Mode (Sequential & Random)');
      return;
    }
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

  // Check if active verse is already bookmarked
  const isCurrentVerseSaved = useMemo(() => {
    if (!currentVerseItem) return false;
    return !!getBookmarkByVerse(
      currentVerseItem.bookName,
      currentVerseItem.chapter,
      currentVerseItem.verse
    );
  }, [currentVerseItem, bookmarkSyncToken, bookmarkSheetVisible]);

  // Trigger double-tap save burst animation
  const triggerSaveAnimation = useCallback(() => {
    setShowSaveAnimation(true);
    saveAnimScale.setValue(0.4);
    saveAnimOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(saveAnimScale, {
        toValue: 1.25,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(saveAnimOpacity, {
        toValue: 0,
        duration: 750,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowSaveAnimation(false));
  }, [saveAnimScale, saveAnimOpacity]);

  // Quick 1-tap Bookmark Save
  const handleQuickSave = useCallback(() => {
    resetIdleTimer();
    if (!currentVerseItem) return;

    if (isCurrentVerseSaved) {
      // If already saved, open the sheet to manage collections or notes
      setInitialNoteExpanded(false);
      setBookmarkSheetVisible(true);
      return;
    }

    try {
      Vibration.vibrate(25);
    } catch {}

    const collections = getCollections();
    const primaryColId = collections.length > 0 ? collections[0].id : 'favorites';

    saveVerseBookmark(
      {
        bookIndex: currentVerseItem.position.bookIndex,
        bookName: currentVerseItem.bookName,
        chapterNumber: currentVerseItem.chapter,
        verseNumber: currentVerseItem.verse,
        verseText: currentVerseItem.text,
      },
      primaryColId ? [primaryColId] : ['favorites']
    );

    setBookmarkSyncToken((prev) => prev + 1);
    triggerSaveAnimation();
  }, [currentVerseItem, isCurrentVerseSaved, triggerSaveAnimation, resetIdleTimer]);

  // Handle Double-tap on Card
  const handleCardDoubleTap = useCallback(() => {
    resetIdleTimer();
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      handleQuickSave();
    }
    lastTapRef.current = now;
  }, [handleQuickSave, resetIdleTimer]);

  // Open note sheet
  const handleOpenNote = () => {
    setInitialNoteExpanded(true);
    setBookmarkSheetVisible(true);
  };

  // Jump to Reader in context
  const handleReadInContext = useCallback(
    (verse: ScrollVerseItem) => {
      router.push({
        pathname: '/(tabs)/reader',
        params: {
          book: verse.bookName,
          chapter: String(verse.chapter),
          verse: String(verse.verse),
        },
      });
    },
    [router]
  );

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

  // Copy current verse text to clipboard
  const handleCopyVerse = useCallback(async () => {
    resetIdleTimer();
    if (!currentVerseItem) return;
    const citation = `${currentVerseItem.bookName} ${currentVerseItem.chapter}:${currentVerseItem.verse}`;
    const badge = getTranslationBadge(translation);
    const text = `"${currentVerseItem.text.trim()}" — ${citation} (${badge})\nhttps://bibleunlock.app`;

    try {
      Vibration.vibrate(20);
    } catch {}

    let copied = false;
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
      try {
        await (navigator as any).clipboard.writeText(text);
        copied = true;
      } catch {}
    }

    if (copied) {
      setToastMessage(`Copied ${citation} to clipboard`);
      setTimeout(() => setToastMessage(null), 2200);
    } else {
      try {
        await Share.share({ message: text });
      } catch {}
    }
  }, [currentVerseItem, translation, resetIdleTimer]);

  // Share current verse card as image
  const handleShare = () => {
    resetIdleTimer();
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
    ({ item, index }: { item: ScrollVerseItem; index: number }) => {
      // In-feed soft paywall card for non-premium at Card 4 (index >= 3)
      if (!isPremium && index >= FREE_DAILY_SCROLL_LIMIT) {
        return (
          <View style={[styles.inFeedGateCard, { height: containerHeight, width: containerWidth }]}>
            {/* Background image for this card */}
            <Image
              source={getBackgroundForIndex(index)}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              fadeDuration={0}
            />

            {/* Dark sacred tint overlay */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 15, 12, 0.76)' }]} />

            <View style={styles.inFeedGateContent}>
              <View style={styles.inFeedGateBadge}>
                <Sparkles size={16} color="#f5b800" />
                <Text style={styles.inFeedGateBadgeText}>SANCTUARY EXCLUSIVE</Text>
              </View>
              <Text style={styles.inFeedGateTitle}>Deepen Your Walk in God's Word</Text>
              <Text style={styles.inFeedGateSubtitle}>
                You've completed your 3 free daily scrolls today. Enter the Sanctuary for unlimited sacred reels, 30+ HD biblical backgrounds, and mood guidance.
              </Text>

              <Pressable
                onPress={() => router.push('/paywall')}
                style={({ pressed }) => [
                  styles.inFeedGateBtn,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.inFeedGateBtnText}>Start 7-Day Free Trial</Text>
                <ArrowRight size={18} color="#141413" strokeWidth={2.5} />
              </Pressable>

              <Pressable
                onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
                style={styles.inFeedGateSecondaryBtn}
              >
                <Text style={styles.inFeedGateSecondaryBtnText}>Review Today's 3 Scrolls</Text>
              </Pressable>
            </View>
          </View>
        );
      }

      return (
        <Pressable onPress={handleCardDoubleTap} style={{ flex: 1 }}>
          <ScrollVerseCard
            ref={index === currentIndex ? activeCardRef : undefined}
            verse={item}
            bgSource={getBackgroundForIndex(index)}
            font={font}
            cardHeight={containerHeight}
            cardWidth={containerWidth}
            topInset={insets.top}
            bottomInset={insets.bottom}
            onReadInContext={handleReadInContext}
          />
        </Pressable>
      );
    },
    [
      currentIndex,
      font,
      containerHeight,
      containerWidth,
      insets.top,
      insets.bottom,
      isPremium,
      handleReadInContext,
      handleCardDoubleTap,
      router,
    ]
  );

  // If free user has already exhausted 3 daily scrolls on screen entry, show gate
  if (!isPremium && dailyFreeScrolls >= FREE_DAILY_SCROLL_LIMIT && verses.length === 0) {
    return <ScrollPaywallGate />;
  }

  return (
    <View style={styles.root} onLayout={handleLayout} onTouchStart={resetIdleTimer}>
      {/* Top Header Row (Mood Chips + Translation Badge + Reading Timer Pill) */}
      <View style={[styles.topHeaderRow, { top: insets.top + 6 }]}>
        {/* Mood Chips Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodScrollContent}
          style={styles.moodScrollView}
        >
          {MOODS.map((m) => {
            const isSelected = mood === m.key;
            const isLocked = m.key !== 'all' && !isPremium;
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
                      : isLocked
                        ? 'rgba(245, 184, 0, 0.35)'
                        : 'rgba(255, 255, 255, 0.22)',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {isLocked && (
                    <Lock
                      size={10}
                      color="#f5b800"
                      strokeWidth={2.5}
                      style={{ marginRight: 4 }}
                    />
                  )}
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
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Translation Switcher Badge */}
        <Pressable
          onPress={() => setTranslationModalVisible(true)}
          style={({ pressed }) => [
            styles.translationPill,
            pressed && { opacity: 0.8 },
          ]}
          accessibilityLabel={`Bible Translation, currently ${getTranslationBadge(translation)}`}
        >
          <Globe size={13} color="#f5b800" />
          <Text style={styles.translationPillText}>{getTranslationBadge(translation)}</Text>
        </Pressable>
      </View>

      {/* Goal Reading Timer Micro-Pill (Floating Top Left) */}
      <View style={[styles.timerBadgeContainer, { top: insets.top + 48 }]}>
        <View style={styles.timerBadge}>
          {timer.isGoalMet ? (
            <>
              <ShieldCheck size={13} color="#10b981" />
              <Text style={styles.timerBadgeTextSuccess}>Goal Met</Text>
            </>
          ) : (
            <>
              <Clock
                size={12}
                color={isTimerActive ? '#f5b800' : 'rgba(255, 255, 255, 0.4)'}
              />
              <Text
                style={[
                  styles.timerBadgeText,
                  !isTimerActive && { color: 'rgba(255, 255, 255, 0.45)' },
                ]}
              >
                {Math.floor(timer.secondsRead / 60)}m / {timer.goalMinutes}m
                {!isTimerActive ? ' (Paused)' : ''}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Main Verse FlatList with 0ms Latency Tuned Paging */}
      <FlatList
        ref={flatListRef}
        data={verses}
        extraData={currentIndex}
        keyExtractor={keyExtractor}
        pagingEnabled={true}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        windowSize={5}
        maxToRenderPerBatch={3}
        initialNumToRender={2}
        removeClippedSubviews={false}
        bounces={false}
        overScrollMode="never"
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

      {/* Double-tap Save Burst Animation Overlay */}
      {showSaveAnimation && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.saveBurstOverlay,
            {
              transform: [{ scale: saveAnimScale }],
              opacity: saveAnimOpacity,
            },
          ]}
        >
          <View style={styles.saveBurstCircle}>
            <BookmarkIcon size={44} color="#f5b800" fill="#f5b800" />
          </View>
        </Animated.View>
      )}

      {/* Mode Toggle Button - Bottom Left (Sanctuary exclusive) */}
      {mood === 'all' && isPremium && (
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

      {/* Floating Action Controls - Right Column (Only for ungated cards) */}
      {(isPremium || currentIndex < FREE_DAILY_SCROLL_LIMIT) && (
        <View style={[styles.floatingControls, { bottom: insets.bottom + 14 }]}>
        {/* Bookmark / Quick Save Action with Reactive Gold State */}
        <Pressable
          onPress={handleQuickSave}
          onLongPress={() => {
            setInitialNoteExpanded(false);
            setBookmarkSheetVisible(true);
          }}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityLabel={isCurrentVerseSaved ? 'Verse saved. Tap to manage.' : 'Bookmark verse'}
        >
          <BookmarkIcon
            size={22}
            color={isCurrentVerseSaved ? '#f5b800' : '#ffffff'}
            fill={isCurrentVerseSaved ? '#f5b800' : 'none'}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.actionLabel,
              isCurrentVerseSaved && { color: '#f5b800', fontFamily: 'Inter_700Bold' },
            ]}
          >
            {isCurrentVerseSaved ? 'Saved' : 'Save'}
          </Text>
        </Pressable>

        {/* Note Action (Opens Sheet with Note Expanded) */}
        <Pressable
          onPress={handleOpenNote}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityLabel="Add note"
        >
          <MessageSquare size={22} color="#ffffff" strokeWidth={2} />
          <Text style={styles.actionLabel}>Note</Text>
        </Pressable>

        {/* Copy Text Action */}
        <Pressable
          onPress={handleCopyVerse}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityLabel="Copy verse text"
        >
          <Copy size={20} color="#ffffff" strokeWidth={2} />
          <Text style={styles.actionLabel}>Copy</Text>
        </Pressable>

        {/* Share Action */}
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityLabel="Share verse as image"
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
      )}

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
          initialNoteExpanded={initialNoteExpanded}
          onDone={() => {
            setBookmarkSheetVisible(false);
            setBookmarkSyncToken((prev) => prev + 1);
          }}
          onCancel={() => setBookmarkSheetVisible(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <View pointerEvents="none" style={[styles.toastContainer, { bottom: Math.max(insets.bottom + 20, 28) }]}>
          <Copy size={14} color="#f5b800" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Translation Picker Modal */}
      <BibleTranslationModal
        visible={translationModalVisible}
        onClose={() => setTranslationModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d120f',
  },
  topHeaderRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
  },
  moodScrollView: {
    flex: 1,
  },
  moodScrollContent: {
    paddingLeft: 14,
    paddingRight: 8,
    gap: 8,
    alignItems: 'center',
  },
  moodChip: {
    paddingHorizontal: 13,
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
  translationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(245, 184, 0, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  translationPillText: {
    color: '#f5b800',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  timerBadgeContainer: {
    position: 'absolute',
    left: 14,
    zIndex: 22,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(13, 18, 15, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timerBadgeText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  timerBadgeTextSuccess: {
    color: '#10b981',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
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
    gap: 12,
    zIndex: 20,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
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
  toastContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: 'rgba(20, 26, 22, 0.95)',
    borderWidth: 1,
    borderColor: '#f5b800',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99,
  },
  toastText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
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
  saveBurstOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  saveBurstCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 2,
    borderColor: '#f5b800',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f5b800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  inFeedGateCard: {
    backgroundColor: '#0d120f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  inFeedGateContent: {
    width: '100%',
    backgroundColor: 'rgba(22, 28, 24, 0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 184, 0, 0.3)',
    padding: 24,
    alignItems: 'center',
  },
  inFeedGateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 184, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 184, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 16,
  },
  inFeedGateBadgeText: {
    color: '#f5b800',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  inFeedGateTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  inFeedGateSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  inFeedGateBtn: {
    width: '100%',
    backgroundColor: '#f5b800',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#f5b800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 12,
  },
  inFeedGateBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#141413',
  },
  inFeedGateSecondaryBtn: {
    paddingVertical: 8,
  },
  inFeedGateSecondaryBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  inFeedGateCounterText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    marginTop: 14,
    textTransform: 'uppercase',
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
