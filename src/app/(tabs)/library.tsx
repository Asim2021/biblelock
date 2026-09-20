import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Share,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Menu,
  RotateCw,
  SlidersHorizontal,
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  MoreHorizontal,
  Plus,
  Trash2,
  Check,
  X,
  Search,
  BookOpen,
  FileText,
  Pin,
  ArrowLeft,
  ChevronsUpDown,
  ChevronsDownUp,
  Settings,
  Share2,
  Copy,
  CircleMinus,
} from 'lucide-react-native';
import {
  getLastReadPosition,
  getBookmarks,
  deleteBookmark,
  getCollections,
  saveCollection,
  deleteCollection,
  removeVerseFromCollection,
  updateBookmarkNote,
  getBookmarksForCollection,
  formatRelativeTime,
  LastReadPosition,
  Bookmark,
  VerseCollection,
  COLLECTION_COLORS,
} from '../../lib/mmkv';
import { BookmarkPickerSheet } from '../../components/BookmarkPickerSheet';
import { useTheme } from '../../lib/themeContext';
import { useFeatureGate } from '../../lib/useFeatureGate';

type TabType = 'collections' | 'pins' | 'notes';

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isPremium, requirePremium } = useFeatureGate();

  const [activeTab, setActiveTab] = useState<TabType>('collections');
  const [showHelperBanner, setShowHelperBanner] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [lastRead, setLastRead] = useState<LastReadPosition>(() => getLastReadPosition());
  const [collections, setCollections] = useState<VerseCollection[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Modal State for New / Edit Collection
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingCollection, setEditingCollection] = useState<VerseCollection | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[4]);

  // Selected Collection to View Inside (Full-Screen Detail Takeover)
  const [viewingCollection, setViewingCollection] = useState<VerseCollection | null>(null);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [expandedVerseIds, setExpandedVerseIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<'date' | 'book'>('date');
  const [isSortSheetVisible, setIsSortSheetVisible] = useState(false);

  // Per-verse options bottom sheet
  const [selectedVerseOptions, setSelectedVerseOptions] = useState<Bookmark | null>(null);

  // Note editing modal
  const [editingNoteBookmark, setEditingNoteBookmark] = useState<Bookmark | null>(null);
  const [noteInput, setNoteInput] = useState('');

  // Re-edit Bookmark (Collections) Sheet
  const [pickerVerseData, setPickerVerseData] = useState<Bookmark | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const loadData = useCallback(() => {
    setLastRead(getLastReadPosition());
    setCollections(getCollections());
    setBookmarks(getBookmarks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleOpenScripture = (bookName: string, chapterNumber: number, verseNumber?: number) => {
    router.push({
      pathname: '/reader',
      params: {
        book: bookName,
        chapter: chapterNumber.toString(),
        verse: (verseNumber || 1).toString(),
      },
    } as any);
  };

  const handleOpenNewCollection = () => {
    if (!isPremium && collections.length >= 1) {
      requirePremium('Unlimited collections');
      return;
    }
    setEditingCollection(null);
    setCollectionName('');
    setSelectedColor(COLLECTION_COLORS[0]);
    setIsEditModalVisible(true);
  };

  const handleOpenEditCollection = (col: VerseCollection) => {
    setEditingCollection(col);
    setCollectionName(col.name);
    setSelectedColor(col.color || COLLECTION_COLORS[4]);
    setIsEditModalVisible(true);
  };

  const handleSaveCollection = () => {
    const trimmed = collectionName.trim();
    if (!trimmed) {
      Alert.alert('Name Required', 'Please enter a name for the collection.');
      return;
    }

    const collectionToSave: VerseCollection = {
      id: editingCollection ? editingCollection.id : `col_${Date.now()}`,
      name: trimmed,
      color: selectedColor,
      createdAt: editingCollection ? editingCollection.createdAt : Date.now(),
    };

    saveCollection(collectionToSave);
    loadData();
    setIsEditModalVisible(false);
  };

  const handleDeleteCollection = () => {
    if (!editingCollection) return;
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${editingCollection.name}"? Verses saved in other collections will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCollection(editingCollection.id);
            loadData();
            setIsEditModalVisible(false);
            if (viewingCollection?.id === editingCollection.id) {
              setViewingCollection(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteBookmark = (bm: Bookmark) => {
    Alert.alert(
      'Remove Bookmark',
      `Remove ${bm.bookName} ${bm.chapterNumber}:${bm.verseNumber} from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteBookmark(bm.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleCopyVerse = async (bm: Bookmark) => {
    const text = `"${bm.verseText}" — ${bm.bookName} ${bm.chapterNumber}:${bm.verseNumber}`;
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
      try {
        await (navigator as any).clipboard.writeText(text);
        Alert.alert('Copied', 'Verse copied to clipboard.');
        return;
      } catch {}
    }
    try {
      await Share.share({ message: text });
    } catch {}
  };

  const handleShareVerse = async (bm: Bookmark) => {
    const text = `"${bm.verseText}" — ${bm.bookName} ${bm.chapterNumber}:${bm.verseNumber}\nhttps://bibleunlock.app`;
    try {
      await Share.share({ message: text });
    } catch {}
  };

  const handleRemoveVerseFromCurrentCollection = (bm: Bookmark) => {
    if (!viewingCollection) return;
    setSelectedVerseOptions(null);
    const colId = viewingCollection.id;
    if ((bm.collectionIds || []).length <= 1) {
      Alert.alert(
        'Remove Bookmark',
        `This will remove ${bm.bookName} ${bm.chapterNumber}:${bm.verseNumber} completely as it is not saved in any other collection. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              removeVerseFromCollection(bm.id, colId);
              loadData();
            },
          },
        ]
      );
    } else {
      removeVerseFromCollection(bm.id, colId);
      loadData();
    }
  };

  const handleSaveNote = () => {
    if (!editingNoteBookmark) return;
    updateBookmarkNote(editingNoteBookmark.id, noteInput);
    setEditingNoteBookmark(null);
    loadData();
  };

  const toggleVerseRowExpansion = (id: string) => {
    setExpandedVerseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered collections
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const q = searchQuery.toLowerCase();
    return collections.filter((c) => c.name.toLowerCase().includes(q));
  }, [collections, searchQuery]);

  // Filtered pins
  const filteredPins = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return bookmarks.filter((b) => {
      if (!q) return true;
      return (
        b.bookName.toLowerCase().includes(q) ||
        `${b.chapterNumber}:${b.verseNumber}`.includes(q) ||
        b.verseText?.toLowerCase().includes(q)
      );
    });
  }, [bookmarks, searchQuery]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return bookmarks
      .filter((b) => !!b.note && b.note.trim().length > 0)
      .filter((b) => {
        if (!q) return true;
        return (
          b.bookName.toLowerCase().includes(q) ||
          b.note?.toLowerCase().includes(q) ||
          b.verseText?.toLowerCase().includes(q)
        );
      });
  }, [bookmarks, searchQuery]);

  // Count verses per collection
  const getCollectionVerseCount = (collectionId: string) => {
    return getBookmarksForCollection(collectionId).length;
  };

  // Verses for currently viewed collection
  const collectionBookmarks = useMemo(() => {
    if (!viewingCollection) return [];
    return getBookmarksForCollection(viewingCollection.id);
  }, [viewingCollection, bookmarks]);

  const sortedCollectionBookmarks = useMemo(() => {
    const list = [...collectionBookmarks];
    if (sortMode === 'date') {
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    return list.sort(
      (a, b) =>
        a.bookIndex - b.bookIndex ||
        a.chapterNumber - b.chapterNumber ||
        a.verseNumber - b.verseNumber
    );
  }, [collectionBookmarks, sortMode]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      {viewingCollection ? (
        /* Full-Screen Collection Detail View */
        <View style={{ flex: 1 }}>
          {/* Top Bar: Back button, Title, More options */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Pressable
              onPress={() => setViewingCollection(null)}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <ArrowLeft size={22} color={colors.textPrimary} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Inter_600SemiBold',
                  color: colors.textPrimary,
                  marginLeft: 8,
                }}
              >
                Back
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleOpenEditCollection(viewingCollection)}
              hitSlop={8}
              style={{ padding: 6 }}
            >
              <MoreHorizontal size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Sub-header Toolbar: Color Dot, Collection Name, Verse Count, ↕ Expand, ⚙ Sort */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: viewingCollection.color || '#f59e0b',
                  marginRight: 10,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontFamily: 'EBGaramond_700Bold',
                    color: colors.textPrimary,
                  }}
                  numberOfLines={1}
                >
                  {viewingCollection.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_400Regular',
                    color: colors.textSecondary,
                  }}
                >
                  {collectionBookmarks.length} {collectionBookmarks.length === 1 ? 'verse' : 'verses'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* Expand/Collapse All */}
              <Pressable
                onPress={() => setIsAllExpanded(!isAllExpanded)}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                {isAllExpanded ? (
                  <ChevronsDownUp size={20} color={colors.textSecondary} />
                ) : (
                  <ChevronsUpDown size={20} color={colors.textSecondary} />
                )}
              </Pressable>

              {/* Sort Options */}
              <Pressable
                onPress={() => setIsSortSheetVisible(true)}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <Settings size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Verses ScrollView */}
          <ScrollView
            contentContainerStyle={{
              padding: 16,
              paddingBottom: Math.max(insets.bottom + 20, 40),
            }}
          >
            {sortedCollectionBookmarks.length === 0 ? (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 60,
                  paddingHorizontal: 24,
                }}
              >
                <BookmarkIcon size={36} color={colors.textMuted} style={{ marginBottom: 12 }} />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Inter_600SemiBold',
                    color: colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  No verses saved here yet
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Inter_400Regular',
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                  }}
                >
                  Tap the bookmark icon while reading scripture to add verses to this collection.
                </Text>
              </View>
            ) : (
              sortedCollectionBookmarks.map((bm) => {
                const isRowExpanded = isAllExpanded || expandedVerseIds.has(bm.id);
                return (
                  <View
                    key={bm.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderLeftWidth: 4,
                      borderLeftColor: viewingCollection.color || colors.accent,
                      marginBottom: 12,
                      padding: 14,
                    }}
                  >
                    {/* Row Header */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <Pressable
                        onPress={() =>
                          handleOpenScripture(bm.bookName, bm.chapterNumber, bm.verseNumber)
                        }
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontFamily: 'Inter_700Bold',
                            color: colors.textPrimary,
                          }}
                        >
                          {bm.bookName} {bm.chapterNumber}:{bm.verseNumber}
                        </Text>
                        {bm.note && (
                          <View
                            style={{
                              marginLeft: 8,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 6,
                              backgroundColor: colors.accentBg,
                            }}
                          >
                            <FileText size={11} color={colors.accent} />
                          </View>
                        )}
                      </Pressable>

                      <Pressable
                        hitSlop={8}
                        onPress={() => setSelectedVerseOptions(bm)}
                        style={{ padding: 4 }}
                      >
                        <MoreHorizontal size={18} color={colors.textSecondary} />
                      </Pressable>
                    </View>

                    {/* Relative timestamp & expand toggle */}
                    <Pressable
                      onPress={() => toggleVerseRowExpansion(bm.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: isRowExpanded || bm.note ? 8 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'Inter_400Regular',
                          color: colors.textMuted,
                        }}
                      >
                        {formatRelativeTime(bm.createdAt)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'Inter_500Medium',
                          color: colors.accent,
                        }}
                      >
                        {isRowExpanded ? 'Collapse' : 'Expand'}
                      </Text>
                    </Pressable>

                    {/* Expanded verse text */}
                    {isRowExpanded && bm.verseText && (
                      <Pressable
                        onPress={() =>
                          handleOpenScripture(bm.bookName, bm.chapterNumber, bm.verseNumber)
                        }
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontFamily: 'EBGaramond_400Regular_Italic',
                            color: colors.textPrimary,
                            lineHeight: 24,
                            marginBottom: bm.note ? 8 : 0,
                          }}
                        >
                          "{bm.verseText}"
                        </Text>
                      </Pressable>
                    )}

                    {/* Note pill with quick edit */}
                    {bm.note && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: colors.surfaceSubtle,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          marginTop: 4,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            marginRight: 8,
                          }}
                        >
                          <FileText
                            size={13}
                            color={colors.accent}
                            style={{ marginTop: 2, marginRight: 6 }}
                          />
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: 'Inter_400Regular',
                              color: colors.textSecondary,
                              flex: 1,
                            }}
                            numberOfLines={2}
                          >
                            {bm.note}
                          </Text>
                        </View>
                        <Pressable
                          hitSlop={8}
                          onPress={() => {
                            setEditingNoteBookmark(bm);
                            setNoteInput(bm.note || '');
                          }}
                          style={{ padding: 4 }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: 'Inter_600SemiBold',
                              color: colors.accent,
                            }}
                          >
                            Edit
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* 1. Top Header Bar matching Al Quran */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 10,
            }}
          >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => router.push('/settings' as any)}
            hitSlop={8}
            style={{ marginRight: 14 }}
          >
            <Menu size={22} color={colors.textPrimary} />
          </Pressable>
          <Text
            style={{
              fontSize: 22,
              fontFamily: 'EBGaramond_700Bold',
              color: colors.textPrimary,
            }}
          >
            Library
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => {}}
            hitSlop={8}
            style={{ marginRight: 16 }}
          >
            <SlidersHorizontal size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={loadData}
            hitSlop={8}
          >
            <RotateCw size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* 2. Sub-header Segmented Tabs matching Al Quran */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 20,
          marginBottom: 12,
          backgroundColor: isDark ? '#141d24' : '#ebe7de',
          borderRadius: 24,
          padding: 4,
        }}
      >
        {(['collections', 'pins', 'notes'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          const label =
            tab === 'collections' ? 'Collections' : tab === 'pins' ? 'Pins' : 'Notes';
          return (
            <Pressable
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                setViewingCollection(null);
              }}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 20,
                alignItems: 'center',
                backgroundColor: isActive
                  ? isDark
                    ? '#1f303d'
                    : '#ffffff'
                  : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_500Medium',
                  color: isActive ? colors.textPrimary : colors.textSecondary,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* 3. Dismissable Informational Banner matching Al Quran */}
        {showHelperBanner && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              backgroundColor: isDark ? '#2e2616' : '#fef7e6',
              borderWidth: 1,
              borderColor: isDark ? '#5e4a23' : '#f0d696',
              borderRadius: 16,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_400Regular',
                  color: isDark ? '#e6c885' : '#855d0a',
                  lineHeight: 18,
                }}
              >
                Create collections of saved verses, pin your favorites, and write notes — access everything from Library.{' '}
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    textDecorationLine: 'underline',
                  }}
                >
                  Learn More
                </Text>
              </Text>
            </View>
            <Pressable onPress={() => setShowHelperBanner(false)} hitSlop={8}>
              <X size={16} color={isDark ? '#e6c885' : '#855d0a'} />
            </Pressable>
          </View>
        )}

        {/* 4. Search Input Bar matching Al Quran */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark ? '#141d24' : '#ffffff',
            borderWidth: 1,
            borderColor: isDark ? '#202e38' : '#e4dfd3',
            borderRadius: 16,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 16,
          }}
        >
          <Search size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              color: colors.textPrimary,
              fontSize: 14,
              fontFamily: 'Inter_400Regular',
              padding: 0,
            }}
          />
          <SlidersHorizontal size={16} color={colors.textMuted} />
        </View>

        {/* TAB 1: COLLECTIONS */}
        {activeTab === 'collections' && (
          <View>
            {/* Last Read Row (Always Top Item) */}
            <Pressable
              onPress={() =>
                handleOpenScripture(
                  lastRead.bookName,
                  lastRead.chapterNumber,
                  lastRead.verseNumber
                )
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#1a242c' : '#eeeae1',
              }}
            >
              <View style={{ marginRight: 14 }}>
                <BookmarkCheck size={22} color="#38bdf8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_600SemiBold',
                    color: colors.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  Last Read
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_400Regular',
                    color: colors.textSecondary,
                  }}
                >
                  {lastRead.bookName} {lastRead.chapterNumber}:{lastRead.verseNumber || 1} (Auto)
                </Text>
              </View>
            </Pressable>

            {/* List of Collections */}
            {filteredCollections.map((col) => {
              const count = getCollectionVerseCount(col.id);
              return (
                <Pressable
                  key={col.id}
                  onPress={() => {
                    setViewingCollection(col);
                    setIsAllExpanded(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#1a242c' : '#eeeae1',
                  }}
                >
                  <View style={{ marginRight: 14 }}>
                    <BookmarkIcon size={22} color={col.color || '#f59e0b'} fill={col.color || '#f59e0b'} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: 'Inter_600SemiBold',
                        color: colors.textPrimary,
                        marginBottom: 2,
                      }}
                    >
                      {col.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: 'Inter_400Regular',
                        color: colors.textSecondary,
                      }}
                    >
                      {count} {count === 1 ? 'verse' : 'verses'}
                    </Text>
                  </View>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenEditCollection(col);
                    }}
                    hitSlop={8}
                    style={{ padding: 4 }}
                  >
                    <MoreHorizontal size={20} color={colors.textSecondary} />
                  </Pressable>
                </Pressable>
              );
            })}

            {/* + New Collection Button */}
            <Pressable
              onPress={handleOpenNewCollection}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 20,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: isDark ? '#18231c' : '#f0ece2',
                borderWidth: 1,
                borderColor: isDark ? '#273d30' : '#e0dbcf',
              }}
            >
              <Plus size={16} color={colors.accent} style={{ marginRight: 6 }} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Inter_600SemiBold',
                  color: colors.accent,
                }}
              >
                New Collection
              </Text>
            </Pressable>
          </View>
        )}

        {/* TAB 2: PINS (All bookmarked verses) */}
        {activeTab === 'pins' && (
          <View>
            {filteredPins.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Pin size={32} color={colors.textMuted} style={{ marginBottom: 10 }} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_600SemiBold',
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  No pinned verses
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_400Regular',
                    color: colors.textSecondary,
                    textAlign: 'center',
                    paddingHorizontal: 24,
                  }}
                >
                  While reading in the Scripture Reader, tap the bookmark icon next to any verse to pin it here.
                </Text>
              </View>
            ) : (
              filteredPins.map((bm) => (
                <Pressable
                  key={bm.id}
                  onPress={() =>
                    handleOpenScripture(
                      bm.bookName,
                      bm.chapterNumber,
                      bm.verseNumber
                    )
                  }
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <BookmarkIcon
                        size={16}
                        color={bm.color || colors.accent}
                        fill={bm.color || colors.accent}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: 'Inter_600SemiBold',
                          color: colors.textPrimary,
                        }}
                      >
                        {bm.bookName} {bm.chapterNumber}:{bm.verseNumber}
                      </Text>
                    </View>

                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteBookmark(bm);
                      }}
                      hitSlop={8}
                    >
                      <Trash2 size={15} color={colors.danger} />
                    </Pressable>
                  </View>

                  {bm.verseText && (
                    <Text
                      numberOfLines={3}
                      style={{
                        fontSize: 13,
                        fontFamily: 'EBGaramond_400Regular_Italic',
                        color: colors.textSecondary,
                        lineHeight: 18,
                      }}
                    >
                      "{bm.verseText}"
                    </Text>
                  )}
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* TAB 3: NOTES */}
        {activeTab === 'notes' && (
          <View>
            {filteredNotes.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <FileText size={32} color={colors.textMuted} style={{ marginBottom: 10 }} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_600SemiBold',
                    color: colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  No verse notes yet
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_400Regular',
                    color: colors.textSecondary,
                    textAlign: 'center',
                    paddingHorizontal: 24,
                  }}
                >
                  Add reflections and spiritual notes to bookmarked verses in the Reader to see them gathered here.
                </Text>
              </View>
            ) : (
              filteredNotes.map((bm) => (
                <Pressable
                  key={bm.id}
                  onPress={() =>
                    handleOpenScripture(
                      bm.bookName,
                      bm.chapterNumber,
                      bm.verseNumber
                    )
                  }
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Inter_600SemiBold',
                        color: colors.accent,
                      }}
                    >
                      {bm.bookName} {bm.chapterNumber}:{bm.verseNumber}
                    </Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteBookmark(bm);
                      }}
                      hitSlop={8}
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </Pressable>
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Inter_400Regular',
                      color: colors.textPrimary,
                      lineHeight: 19,
                    }}
                  >
                    "{bm.note}"
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
        </View>
      )}

      {/* 5. Bottom Sheet Modal: Edit / New Collection matching AL Quran App edit bookmark example.png */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <Pressable
          onPress={() => setIsEditModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: isDark ? '#141d24' : '#ffffff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 22,
              paddingTop: 12,
              paddingBottom: Math.max(20, insets.bottom + 12),
              borderWidth: 1,
              borderColor: isDark ? '#23323e' : '#e4dfd3',
            }}
          >
            {/* Drag Handle */}
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? '#3b4e5c' : '#d0cbbe',
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />

            {/* Title */}
            <Text
              style={{
                fontSize: 17,
                fontFamily: 'Inter_600SemiBold',
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              {editingCollection ? 'Edit Collection' : 'New Collection'}
            </Text>

            {/* Name Input */}
            <TextInput
              value={collectionName}
              onChangeText={setCollectionName}
              placeholder="Collection name (e.g. Psalms of Peace)"
              placeholderTextColor={colors.textMuted}
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isDark ? '#2b3b48' : '#e0dbcf',
                backgroundColor: isDark ? '#0d1318' : '#faf9f6',
                color: colors.textPrimary,
                fontSize: 15,
                fontFamily: 'Inter_500Medium',
                paddingHorizontal: 16,
                paddingVertical: 14,
                marginBottom: 20,
              }}
            />

            {/* Color Picker Section */}
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Inter_500Medium',
                color: colors.textSecondary,
                marginBottom: 12,
              }}
            >
              Choose a color
            </Text>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              {COLLECTION_COLORS.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <Check size={20} color="#ffffff" strokeWidth={3} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Delete Option (only when editing existing collection) */}
            {editingCollection && (
              <Pressable
                onPress={handleDeleteCollection}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 24,
                  paddingVertical: 4,
                }}
              >
                <Trash2 size={18} color="#ef4444" style={{ marginRight: 10 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Inter_500Medium',
                    color: '#ef4444',
                  }}
                >
                  Delete Collection
                </Text>
              </Pressable>
            )}

            {/* Bottom Buttons: Cancel & Save matching Al Quran */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Pressable
                onPress={() => setIsEditModalVisible(false)}
                style={{
                  flex: 1,
                  marginRight: 12,
                  paddingVertical: 14,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_600SemiBold',
                    color: colors.textSecondary,
                  }}
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveCollection}
                style={{
                  flex: 1.3,
                  paddingVertical: 14,
                  borderRadius: 24,
                  backgroundColor: '#3b82f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#3b82f6',
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_600SemiBold',
                    color: '#ffffff',
                  }}
                >
                  Save
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 6. Per-Verse Options Bottom Sheet matching Al Quran reference */}
      <Modal
        visible={selectedVerseOptions !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVerseOptions(null)}
      >
        <Pressable
          onPress={() => setSelectedVerseOptions(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surfaceElevated || colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom + 12, 24),
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginBottom: 14,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'EBGaramond_700Bold',
                  color: colors.textPrimary,
                }}
              >
                {selectedVerseOptions?.bookName} {selectedVerseOptions?.chapterNumber}:
                {selectedVerseOptions?.verseNumber}
              </Text>
              <Pressable onPress={() => setSelectedVerseOptions(null)} hitSlop={8}>
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={{ gap: 6 }}>
              {/* View in Reader */}
              <Pressable
                onPress={() => {
                  if (!selectedVerseOptions) return;
                  const bm = selectedVerseOptions;
                  setSelectedVerseOptions(null);
                  handleOpenScripture(bm.bookName, bm.chapterNumber, bm.verseNumber);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSubtle,
                }}
              >
                <BookOpen size={18} color={colors.accent} style={{ marginRight: 12 }} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textPrimary,
                  }}
                >
                  View in Reader
                </Text>
              </Pressable>

              {/* View / Edit Note */}
              <Pressable
                onPress={() => {
                  if (!selectedVerseOptions) return;
                  const bm = selectedVerseOptions;
                  setSelectedVerseOptions(null);
                  setEditingNoteBookmark(bm);
                  setNoteInput(bm.note || '');
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSubtle,
                }}
              >
                <FileText size={18} color={colors.accent} style={{ marginRight: 12 }} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textPrimary,
                  }}
                >
                  {selectedVerseOptions?.note ? 'Edit Note' : 'Add Note'}
                </Text>
              </Pressable>

              {/* Edit Collections */}
              <Pressable
                onPress={() => {
                  if (!selectedVerseOptions) return;
                  const bm = selectedVerseOptions;
                  setSelectedVerseOptions(null);
                  setPickerVerseData(bm);
                  setIsPickerVisible(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSubtle,
                }}
              >
                <BookmarkIcon size={18} color={colors.accent} style={{ marginRight: 12 }} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textPrimary,
                  }}
                >
                  Edit Collections
                </Text>
              </Pressable>

              {/* Copy Verse */}
              <Pressable
                onPress={() => {
                  if (!selectedVerseOptions) return;
                  handleCopyVerse(selectedVerseOptions);
                  setSelectedVerseOptions(null);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSubtle,
                }}
              >
                <Copy size={18} color={colors.textSecondary} style={{ marginRight: 12 }} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textPrimary,
                  }}
                >
                  Copy Verse
                </Text>
              </Pressable>

              {/* Share Verse */}
              <Pressable
                onPress={() => {
                  if (!selectedVerseOptions) return;
                  handleShareVerse(selectedVerseOptions);
                  setSelectedVerseOptions(null);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSubtle,
                }}
              >
                <Share2 size={18} color={colors.textSecondary} style={{ marginRight: 12 }} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Inter_500Medium',
                    color: colors.textPrimary,
                  }}
                >
                  Share Verse
                </Text>
              </Pressable>

              {/* Remove from Current Collection (only if inside collection detail) */}
              {viewingCollection && (
                <Pressable
                  onPress={() => {
                    if (!selectedVerseOptions) return;
                    handleRemoveVerseFromCurrentCollection(selectedVerseOptions);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: isDark ? '#2d1818' : '#fee2e2',
                  }}
                >
                  <CircleMinus size={18} color={colors.danger} style={{ marginRight: 12 }} />
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Inter_600SemiBold',
                      color: colors.danger,
                    }}
                  >
                    Remove from "{viewingCollection.name}"
                  </Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 7. Sort Options Bottom Sheet matching Al Quran */}
      <Modal
        visible={isSortSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSortSheetVisible(false)}
      >
        <Pressable
          onPress={() => setIsSortSheetVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surfaceElevated || colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom + 12, 24),
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginBottom: 14,
              }}
            />
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'EBGaramond_700Bold',
                color: colors.textPrimary,
                marginBottom: 16,
              }}
            >
              Sort Verses
            </Text>

            <Pressable
              onPress={() => {
                setSortMode('date');
                setIsSortSheetVisible(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor:
                  sortMode === 'date' ? (isDark ? '#1a261f' : '#f0ede4') : colors.surface,
                borderWidth: 1,
                borderColor: sortMode === 'date' ? colors.accent : colors.border,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: sortMode === 'date' ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  color: colors.textPrimary,
                }}
              >
                Date Added (Newest First)
              </Text>
              {sortMode === 'date' && (
                <Check size={18} color={colors.accent} strokeWidth={2.5} />
              )}
            </Pressable>

            <Pressable
              onPress={() => {
                setSortMode('book');
                setIsSortSheetVisible(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor:
                  sortMode === 'book' ? (isDark ? '#1a261f' : '#f0ede4') : colors.surface,
                borderWidth: 1,
                borderColor: sortMode === 'book' ? colors.accent : colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: sortMode === 'book' ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  color: colors.textPrimary,
                }}
              >
                Book & Chapter (Canonical Order)
              </Text>
              {sortMode === 'book' && (
                <Check size={18} color={colors.accent} strokeWidth={2.5} />
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 8. Note Editing Modal */}
      <Modal
        visible={editingNoteBookmark !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingNoteBookmark(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <Pressable
            onPress={() => setEditingNoteBookmark(null)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              paddingHorizontal: 20,
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: colors.surfaceElevated || colors.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'EBGaramond_700Bold',
                  color: colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                Verse Note
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Inter_500Medium',
                  color: colors.accent,
                  marginBottom: 12,
                }}
              >
                {editingNoteBookmark?.bookName} {editingNoteBookmark?.chapterNumber}:
                {editingNoteBookmark?.verseNumber}
              </Text>

              <TextInput
                value={noteInput}
                onChangeText={setNoteInput}
                placeholder="Add personal reflections, prayer, or context..."
                placeholderTextColor={colors.textMuted}
                maxLength={200}
                multiline
                numberOfLines={4}
                autoFocus
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 12,
                  color: colors.textPrimary,
                  fontSize: 14,
                  minHeight: 90,
                  textAlignVertical: 'top',
                  marginBottom: 6,
                }}
              />

              <Text
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  textAlign: 'right',
                  marginBottom: 16,
                }}
              >
                {noteInput.length}/200
              </Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => setEditingNoteBookmark(null)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.surfaceSubtle,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Inter_600SemiBold',
                      color: colors.textSecondary,
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveNote}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Inter_700Bold',
                      color: colors.accentText || '#000000',
                    }}
                  >
                    Save Note
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* 9. Re-edit Bookmark Collections Picker Sheet */}
      <BookmarkPickerSheet
        visible={isPickerVisible}
        verse={
          pickerVerseData
            ? {
                bookIndex: pickerVerseData.bookIndex,
                bookName: pickerVerseData.bookName,
                chapterNumber: pickerVerseData.chapterNumber,
                verseNumber: pickerVerseData.verseNumber,
                verseText: pickerVerseData.verseText,
              }
            : null
        }
        onDone={() => {
          setIsPickerVisible(false);
          setPickerVerseData(null);
          loadData();
        }}
        onCancel={() => {
          setIsPickerVisible(false);
          setPickerVerseData(null);
        }}
      />
    </SafeAreaView>
  );
}
