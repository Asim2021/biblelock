import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
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
} from 'lucide-react-native';
import {
  getLastReadPosition,
  getBookmarks,
  deleteBookmark,
  getCollections,
  saveCollection,
  deleteCollection,
  LastReadPosition,
  Bookmark,
  VerseCollection,
} from '../../lib/mmkv';
import { useTheme } from '../../lib/themeContext';

type TabType = 'collections' | 'pins' | 'notes';

const COLLECTION_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#f59e0b', // Yellow
  '#d97706', // Ochre / Amber
];

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

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

  // Selected Collection to View Inside
  const [viewingCollection, setViewingCollection] = useState<VerseCollection | null>(null);

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
    setCollections(getCollections());
    setIsEditModalVisible(false);
  };

  const handleDeleteCollection = () => {
    if (!editingCollection) return;
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${editingCollection.name}"? Verses will remain in your library.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCollection(editingCollection.id);
            setCollections(getCollections());
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
            setBookmarks(getBookmarks());
          },
        },
      ]
    );
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
  const getCollectionVerseCount = (collectionId: string, collectionName: string) => {
    return bookmarks.filter(
      (b) =>
        b.collectionId === collectionId ||
        b.collectionName === collectionName ||
        (!b.collectionId && collectionId === 'prayers') // default bucket
    ).length;
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
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
              const count = getCollectionVerseCount(col.id, col.name);
              return (
                <Pressable
                  key={col.id}
                  onPress={() => {
                    // Filter pins to this collection
                    setViewingCollection(col);
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

            {/* If a collection was tapped, show its verses */}
            {viewingCollection && (
              <View
                style={{
                  marginTop: 24,
                  padding: 16,
                  borderRadius: 20,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: viewingCollection.color,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: 'Inter_600SemiBold',
                        color: colors.textPrimary,
                      }}
                    >
                      {viewingCollection.name}
                    </Text>
                  </View>
                  <Pressable onPress={() => setViewingCollection(null)} hitSlop={8}>
                    <X size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>

                {bookmarks.filter(
                  (b) =>
                    b.collectionId === viewingCollection.id ||
                    b.collectionName === viewingCollection.name ||
                    (!b.collectionId && viewingCollection.id === 'prayers')
                ).length === 0 ? (
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Inter_400Regular',
                      color: colors.textMuted,
                      textAlign: 'center',
                      paddingVertical: 16,
                    }}
                  >
                    No verses added to this collection yet. In the Reader, tap the bookmark icon on any verse to add it.
                  </Text>
                ) : (
                  bookmarks
                    .filter(
                      (b) =>
                        b.collectionId === viewingCollection.id ||
                        b.collectionName === viewingCollection.name ||
                        (!b.collectionId && viewingCollection.id === 'prayers')
                    )
                    .map((bm) => (
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
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.borderSubtle,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontFamily: 'Inter_600SemiBold',
                              color: colors.textPrimary,
                            }}
                          >
                            {bm.bookName} {bm.chapterNumber}:{bm.verseNumber}
                          </Text>
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeleteBookmark(bm);
                            }}
                          >
                            <Trash2 size={14} color={colors.danger} />
                          </Pressable>
                        </View>
                        {bm.verseText && (
                          <Text
                            numberOfLines={2}
                            style={{
                              fontSize: 12,
                              fontFamily: 'EBGaramond_400Regular_Italic',
                              color: colors.textSecondary,
                              marginTop: 2,
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
    </SafeAreaView>
  );
}
