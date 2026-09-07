import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Bookmark as BookmarkIcon,
  BookOpen,
  ArrowRight,
  Trash2,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react-native';
import {
  getLastReadPosition,
  getBookmarks,
  deleteBookmark,
  LastReadPosition,
  Bookmark,
} from '../../lib/mmkv';

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [lastRead, setLastRead] = useState<LastReadPosition>(() => getLastReadPosition());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const loadData = useCallback(() => {
    setLastRead(getLastReadPosition());
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

  const handleDeleteBookmark = (id: string, label: string) => {
    Alert.alert(
      'Remove Bookmark',
      `Are you sure you want to remove "${label}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteBookmark(id);
            setBookmarks(getBookmarks());
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#0d120f' }}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={{ flex: 1 }}
        className="px-5"
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
      >
        {/* Screen Header */}
        <View className="pt-4 pb-3">
          <Text className="text-[11px] font-sans-medium text-[#78a898] uppercase tracking-widest">
            Saved Word
          </Text>
          <Text
            className="text-2xl font-serif-bold text-[#faf9f5]"
            style={{ fontFamily: 'EBGaramond_700Bold' }}
          >
            Library
          </Text>
        </View>

        {/* Pinned "Last Read" Marker Card */}
        <View className="mb-6 p-5 rounded-3xl bg-[#141e17] border border-[#233528] shadow-lg">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Clock size={14} color="#f5b800" style={{ marginRight: 6 }} />
              <Text className="text-[11px] font-sans-bold text-[#f5b800] uppercase tracking-wider">
                Last Read Position
              </Text>
            </View>
            <Text className="text-[11px] font-sans text-[#78a898]">
              {formatDate(lastRead.updatedAt)}
            </Text>
          </View>

          <Text
            className="text-xl font-serif-bold text-[#faf9f5] mb-1"
            style={{ fontFamily: 'EBGaramond_700Bold' }}
          >
            {lastRead.bookName} {lastRead.chapterNumber}:{lastRead.verseNumber || 1}
          </Text>

          <Text className="text-xs font-sans text-[#78a898] mb-4 leading-relaxed">
            Auto-saved bookmark where you last communed with Scripture.
          </Text>

          <Pressable
            onPress={() =>
              handleOpenScripture(
                lastRead.bookName,
                lastRead.chapterNumber,
                lastRead.verseNumber
              )
            }
            className="w-full py-3.5 rounded-2xl bg-[#f5b800] flex-row items-center justify-center active:opacity-90 shadow-md"
          >
            <BookOpen size={16} color="#141413" style={{ marginRight: 8 }} />
            <Text className="text-sm font-sans-bold text-[#141413] mr-1">
              Continue Reading
            </Text>
            <ArrowRight size={16} color="#141413" />
          </Pressable>
        </View>

        {/* Custom Bookmarks Section */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <BookmarkIcon size={16} color="#f5b800" style={{ marginRight: 6 }} />
            <Text className="text-base font-sans-bold text-[#faf9f5]">
              Bookmarks
            </Text>
            <View className="ml-2 px-2 py-0.5 rounded-full bg-[#1c2921] border border-[#293d31]">
              <Text className="text-[11px] font-sans-medium text-[#a3c4b6]">
                {bookmarks.length}
              </Text>
            </View>
          </View>
        </View>

        {bookmarks.length === 0 ? (
          <View className="p-8 rounded-3xl bg-[#121814] border border-[#1b271f] items-center text-center">
            <View className="w-14 h-14 rounded-2xl bg-[#18231c] border border-[#273a2e] items-center justify-center mb-3">
              <BookmarkIcon size={24} color="#5c7a6e" />
            </View>
            <Text className="text-base font-sans-bold text-[#faf9f5] mb-1">
              No bookmarks yet
            </Text>
            <Text className="text-xs font-sans text-[#78a898] text-center leading-relaxed mb-5 px-4">
              While reading Scripture in the Reader, tap the bookmark icon on any verse to save it to your Library.
            </Text>
            <Pressable
              onPress={() => router.push('/reader' as any)}
              className="px-5 py-2.5 rounded-xl bg-[#1c2921] border border-[#2a3f32] active:opacity-80"
            >
              <Text className="text-xs font-sans-bold text-[#f5b800]">
                Open Scripture Reader
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="space-y-3">
            {bookmarks.map((bm) => (
              <Pressable
                key={bm.id}
                onPress={() =>
                  handleOpenScripture(bm.bookName, bm.chapterNumber, bm.verseNumber)
                }
                className="p-4 rounded-2xl bg-[#141a16] border border-[#202c23] flex-row items-center justify-between active:opacity-85 mb-3"
              >
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center mb-1">
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: bm.color || '#f5b800' }}
                    />
                    <Text className="text-sm font-sans-bold text-[#faf9f5]">
                      {bm.bookName} {bm.chapterNumber}:{bm.verseNumber}
                    </Text>
                  </View>
                  {bm.note ? (
                    <Text className="text-xs font-sans text-[#a3c4b6] mb-1 leading-snug">
                      "{bm.note}"
                    </Text>
                  ) : null}
                  <Text className="text-[10px] font-sans text-[#5c7a6e]">
                    Saved {formatDate(bm.createdAt)}
                  </Text>
                </View>

                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteBookmark(
                      bm.id,
                      `${bm.bookName} ${bm.chapterNumber}:${bm.verseNumber}`
                    );
                  }}
                  className="w-8 h-8 rounded-lg bg-[#1c221e] border border-[#28362b] items-center justify-center active:opacity-70"
                >
                  <Trash2 size={13} color="#a37878" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
