import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
	Keyboard,
	useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
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
	ArrowLeft,
	ChevronsUpDown,
	ChevronsDownUp,
	Settings,
	Share2,
	Copy,
	CircleMinus,
	Lock,
	Sparkles,
	HeartHandshake,
	Clock,
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
	getUserPrayers,
	formatRelativeTime,
	LastReadPosition,
	Bookmark,
	VerseCollection,
	UserPrayer,
	COLLECTION_COLORS,
} from '../../lib/mmkv';
import { BookmarkPickerSheet } from '../../components/BookmarkPickerSheet';
import {
	getAllPrayers,
	getPrayersByCategory,
	isPrayerGated,
	PrayerItem,
	PrayerCategory,
} from '../../lib/prayers';
import { PrayerMeditationModal } from '../../components/PrayerMeditationModal';
import { PersonalPrayerModal } from '../../components/library/PersonalPrayerModal';
import { VerseCardShareModal } from '../../components/library/VerseCardShareModal';
import { useTheme } from '../../lib/themeContext';
import { useFeatureGate } from '../../lib/useFeatureGate';

type TabType = 'scripture' | 'prayers' | 'journal';
type ScriptureSubTab = 'collections' | 'all_verses';
type ScriptureFilter = 'all' | 'ot' | 'nt' | 'has_notes';
type PrayersSubTab = 'my_prayers' | 'liturgies';

export default function LibraryScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { height: windowHeight } = useWindowDimensions();
	const { colors, isDark } = useTheme();
	const { isPremium, requirePremium } = useFeatureGate();

	// Dynamic keyboard offset for modals on Android & iOS
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const navBarInset = Platform.OS === 'android' ? Math.max(insets.bottom, 48) : insets.bottom;
	const effectiveKeyboardOffset = keyboardHeight > 0 ? keyboardHeight + navBarInset : 0;

	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const showSub = Keyboard.addListener(showEvent, (e) => {
			setKeyboardHeight(e.endCoordinates.height);
		});
		const hideSub = Keyboard.addListener(hideEvent, () => {
			setKeyboardHeight(0);
		});

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	// Primary 3 Pillars
	const [activeTab, setActiveTab] = useState<TabType>('scripture');
	const [searchQuery, setSearchQuery] = useState('');

	// Sub-segment states
	const [scriptureSubTab, setScriptureSubTab] = useState<ScriptureSubTab>('collections');
	const [scriptureFilter, setScriptureFilter] = useState<ScriptureFilter>('all');
	const [prayersSubTab, setPrayersSubTab] = useState<PrayersSubTab>('my_prayers');

	// Local State Data
	const [lastRead, setLastRead] = useState<LastReadPosition>(() => getLastReadPosition());
	const [collections, setCollections] = useState<VerseCollection[]>([]);
	const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
	const [userPrayers, setUserPrayers] = useState<UserPrayer[]>([]);

	// Collection New / Edit Modal
	const [isEditModalVisible, setIsEditModalVisible] = useState(false);
	const [editingCollection, setEditingCollection] = useState<VerseCollection | null>(null);
	const [collectionName, setCollectionName] = useState('');
	const [selectedColor, setSelectedColor] = useState(COLLECTION_COLORS[4]);

	// Full-screen Collection Detail View
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

	// Sacred Verse Card Share Modal
	const [cardShareVerse, setCardShareVerse] = useState<Bookmark | null>(null);
	const [isCardShareVisible, setIsCardShareVisible] = useState(false);

	// Personal Prayer Modal
	const [isPersonalPrayerModalVisible, setIsPersonalPrayerModalVisible] = useState(false);
	const [personalPrayerModalMode, setPersonalPrayerModalMode] = useState<'create' | 'edit' | 'mark_answered'>('create');
	const [selectedPersonalPrayer, setSelectedPersonalPrayer] = useState<UserPrayer | null>(null);

	// Liturgies State
	const [selectedPrayerCategory, setSelectedPrayerCategory] = useState<'all' | PrayerCategory>('all');
	const [selectedPrayerForModal, setSelectedPrayerForModal] = useState<PrayerItem | null>(null);
	const [isLiturgiesModalVisible, setIsLiturgiesModalVisible] = useState(false);

	const loadData = useCallback(() => {
		setLastRead(getLastReadPosition());
		setCollections(getCollections());
		setBookmarks(getBookmarks());
		setUserPrayers(getUserPrayers());
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData]),
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

	// Collection CRUD
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
			],
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
			],
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
				],
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

	// Personal Prayer Handlers
	const handleOpenCreatePrayer = () => {
		const activeCount = userPrayers.filter((p) => !p.isAnswered).length;
		if (!isPremium && activeCount >= 5) {
			requirePremium('Unlimited personal prayers');
			return;
		}
		setSelectedPersonalPrayer(null);
		setPersonalPrayerModalMode('create');
		setIsPersonalPrayerModalVisible(true);
	};

	const handleOpenEditPrayer = (prayer: UserPrayer) => {
		setSelectedPersonalPrayer(prayer);
		setPersonalPrayerModalMode('edit');
		setIsPersonalPrayerModalVisible(true);
	};

	const handleOpenMarkAnswered = (prayer: UserPrayer) => {
		setSelectedPersonalPrayer(prayer);
		setPersonalPrayerModalMode('mark_answered');
		setIsPersonalPrayerModalVisible(true);
	};

	// Copy all reflections in Journal
	const handleCopyAllReflections = async () => {
		const notesList = bookmarks.filter((b) => b.note && b.note.trim().length > 0);
		if (notesList.length === 0) {
			Alert.alert('No Notes', 'You do not have any saved verse reflections yet.');
			return;
		}
		const compiled = notesList
			.map(
				(b) =>
					`[${b.bookName} ${b.chapterNumber}:${b.verseNumber}]\n"${b.verseText}"\nReflection: ${b.note}\n`
			)
			.join('\n---\n\n');

		try {
			await Share.share({
				title: 'Bible Unlock Spiritual Reflections',
				message: compiled,
			});
		} catch {}
	};

	// Computed counts for telemetry
	const activePrayers = useMemo(() => userPrayers.filter((p) => !p.isAnswered), [userPrayers]);
	const answeredPrayers = useMemo(() => userPrayers.filter((p) => p.isAnswered), [userPrayers]);

	// Filtered collections
	const filteredCollections = useMemo(() => {
		if (!searchQuery.trim()) return collections;
		const q = searchQuery.toLowerCase();
		return collections.filter((c) => c.name.toLowerCase().includes(q));
	}, [collections, searchQuery]);

	// Filtered all verses
	const filteredAllVerses = useMemo(() => {
		const q = searchQuery.toLowerCase().trim();
		return bookmarks.filter((b) => {
			if (scriptureFilter === 'ot' && b.bookIndex >= 39) return false;
			if (scriptureFilter === 'nt' && b.bookIndex < 39) return false;
			if (scriptureFilter === 'has_notes' && (!b.note || !b.note.trim())) return false;
			if (!q) return true;
			return (
				b.bookName.toLowerCase().includes(q) ||
				`${b.chapterNumber}:${b.verseNumber}`.includes(q) ||
				b.verseText?.toLowerCase().includes(q)
			);
		});
	}, [bookmarks, searchQuery, scriptureFilter]);

	// Filtered notes (Journal)
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

	// Filtered liturgies
	const filteredLiturgies = useMemo(() => {
		const baseList =
			selectedPrayerCategory === 'all'
				? getAllPrayers()
				: getPrayersByCategory(selectedPrayerCategory);
		if (!searchQuery.trim()) return baseList;
		const q = searchQuery.toLowerCase().trim();
		return baseList.filter(
			(p) =>
				p.title.toLowerCase().includes(q) ||
				p.prayerText.toLowerCase().includes(q)
		);
	}, [selectedPrayerCategory, searchQuery]);

	// Memoized verse counts per collection
	const collectionVerseCountMap = useMemo(() => {
		const map: Record<string, number> = {};
		for (const b of bookmarks) {
			if (b.collectionIds) {
				for (const cid of b.collectionIds) {
					map[cid] = (map[cid] || 0) + 1;
				}
			}
		}
		return map;
	}, [bookmarks]);

	// Verses for currently viewed collection
	const collectionBookmarks = useMemo(() => {
		if (!viewingCollection) return [];
		return bookmarks.filter((b) => (b.collectionIds || []).includes(viewingCollection.id));
	}, [viewingCollection, bookmarks]);

	const sortedCollectionBookmarks = useMemo(() => {
		const list = [...collectionBookmarks];
		if (sortMode === 'date') {
			return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
		}
		return list.sort(
			(a, b) => a.bookIndex - b.bookIndex || a.chapterNumber - b.chapterNumber || a.verseNumber - b.verseNumber,
		);
	}, [collectionBookmarks, sortMode]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
			{viewingCollection ? (
				/* Full-Screen Collection Detail Takeover */
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
								Back to Vault
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

					{/* Sub-header Toolbar */}
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							paddingHorizontal: 20,
							paddingVertical: 12,
							backgroundColor: colors.surface,
							borderBottomWidth: 1,
							borderBottomColor: colors.borderSubtle || colors.border,
						}}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
							<View
								style={{
									width: 12,
									height: 12,
									borderRadius: 6,
									backgroundColor: viewingCollection.color || colors.accent,
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
							<Pressable onPress={() => setIsSortSheetVisible(true)} hitSlop={8} style={{ padding: 4 }}>
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
				/* Primary Vault View */
				<View style={{ flex: 1 }}>
					{/* 1. Industrial Telemetry Header */}
					<View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
						<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
							<View
								style={{
									backgroundColor: colors.accentBg,
									paddingHorizontal: 6,
									paddingVertical: 2,
									borderRadius: 4,
									borderWidth: 1,
									borderColor: colors.accent,
									marginRight: 8,
								}}
							>
								<Text
									style={{
										fontSize: 9,
										fontFamily: 'Inter_700Bold',
										color: colors.accent,
										letterSpacing: 0.8,
										textTransform: 'uppercase',
									}}
								>
									[ SANCTUARY VAULT ]
								</Text>
							</View>
						</View>
						<Text
							style={{
								fontSize: 24,
								fontFamily: 'EBGaramond_700Bold',
								color: colors.textPrimary,
								marginBottom: 6,
							}}
						>
							Library & Treasury
						</Text>

						{/* Telemetry Numbers Strip */}
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								gap: 12,
								paddingVertical: 6,
								borderBottomWidth: 1,
								borderBottomColor: colors.border,
							}}
						>
							<Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary }}>
								SAVED: <Text style={{ fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>{bookmarks.length}</Text>
							</Text>
							<Text style={{ fontSize: 11, color: colors.border }}>•</Text>
							<Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary }}>
								COLLECTIONS: <Text style={{ fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>{collections.length}</Text>
							</Text>
							<Text style={{ fontSize: 11, color: colors.border }}>•</Text>
							<Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary }}>
								PRAYERS: <Text style={{ fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>{activePrayers.length}</Text>
							</Text>
							{answeredPrayers.length > 0 && (
								<>
									<Text style={{ fontSize: 11, color: colors.border }}>•</Text>
									<Text style={{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.accent }}>
										ANSWERED: <Text style={{ fontFamily: 'Inter_700Bold', color: colors.accent }}>{answeredPrayers.length} ✨</Text>
									</Text>
								</>
							)}
						</View>
					</View>

					{/* 2. Byron Sharp Usability: Unconditional Top "Resume Reading" Hero Card */}
					<View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
						<Pressable
							onPress={() =>
								handleOpenScripture(lastRead.bookName, lastRead.chapterNumber, lastRead.verseNumber)
							}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								backgroundColor: colors.surface,
								borderRadius: 14,
								paddingHorizontal: 14,
								paddingVertical: 12,
								borderWidth: 1,
								borderColor: colors.border,
								borderLeftWidth: 4,
								borderLeftColor: '#38bdf8',
							}}
						>
							<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
								<View
									style={{
										width: 32,
										height: 32,
										borderRadius: 8,
										backgroundColor: isDark ? '#122533' : '#e0f2fe',
										alignItems: 'center',
										justifyContent: 'center',
										marginRight: 10,
									}}
								>
									<BookOpen size={16} color='#38bdf8' />
								</View>
								<View style={{ flex: 1 }}>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
										<Text
											style={{
												fontSize: 14,
												fontFamily: 'Inter_700Bold',
												color: colors.textPrimary,
											}}
										>
											{lastRead.bookName} {lastRead.chapterNumber}:{lastRead.verseNumber || 1}
										</Text>
										<Text
											style={{
												fontSize: 10,
												fontFamily: 'Inter_600SemiBold',
												color: '#38bdf8',
												textTransform: 'uppercase',
											}}
										>
											[ AUTO ]
										</Text>
									</View>
									<Text
										style={{
											fontSize: 11,
											fontFamily: 'Inter_400Regular',
											color: colors.textMuted,
										}}
									>
										Read {formatRelativeTime(lastRead.updatedAt)}
									</Text>
								</View>
							</View>

							<View
								style={{
									backgroundColor: colors.accentBg,
									paddingHorizontal: 10,
									paddingVertical: 6,
									borderRadius: 8,
									borderWidth: 1,
									borderColor: colors.accent,
								}}
							>
								<Text
									style={{
										fontSize: 11,
										fontFamily: 'Inter_700Bold',
										color: colors.accent,
									}}
								>
									Resume →
								</Text>
							</View>
						</Pressable>
					</View>

					{/* 3. 3-Pillar Master Segmented Switcher */}
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
						{(['scripture', 'prayers', 'journal'] as TabType[]).map((tab) => {
							const isActive = activeTab === tab;
							const label =
								tab === 'scripture'
									? '01 Scripture'
									: tab === 'prayers'
									? '02 Prayers'
									: '03 Journal';
							return (
								<Pressable
									key={tab}
									onPress={() => {
										setActiveTab(tab);
										setSearchQuery('');
									}}
									style={{
										flex: 1,
										paddingVertical: 8,
										borderRadius: 20,
										alignItems: 'center',
										backgroundColor: isActive ? (isDark ? '#1f303d' : '#ffffff') : 'transparent',
									}}
								>
									<Text
										style={{
											fontSize: 13,
											fontFamily: isActive ? 'Inter_700Bold' : 'Inter_500Medium',
											color: isActive ? colors.textPrimary : colors.textSecondary,
										}}
									>
										{label}
									</Text>
								</Pressable>
							);
						})}
					</View>

					{/* Scrollable Pillar Content */}
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 + insets.bottom }}
						showsVerticalScrollIndicator={false}
					>
						{/* ============================================================== */}
						{/* PILLAR 01: SCRIPTURE VAULT */}
						{/* ============================================================== */}
						{activeTab === 'scripture' && (
							<View>
								{/* Scripture Sub-segment Switch */}
								<View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
									<Pressable
										onPress={() => setScriptureSubTab('collections')}
										style={{
											paddingVertical: 6,
											paddingHorizontal: 14,
											borderRadius: 12,
											backgroundColor:
												scriptureSubTab === 'collections'
													? colors.accent
													: isDark
													? '#141d24'
													: '#ebe7de',
										}}
									>
										<Text
											style={{
												fontSize: 12,
												fontFamily:
													scriptureSubTab === 'collections'
														? 'Inter_700Bold'
														: 'Inter_500Medium',
												color:
													scriptureSubTab === 'collections'
														? (colors.accentText || '#000000')
														: colors.textSecondary,
											}}
										>
											Collections ({collections.length})
										</Text>
									</Pressable>

									<Pressable
										onPress={() => setScriptureSubTab('all_verses')}
										style={{
											paddingVertical: 6,
											paddingHorizontal: 14,
											borderRadius: 12,
											backgroundColor:
												scriptureSubTab === 'all_verses'
													? colors.accent
													: isDark
													? '#141d24'
													: '#ebe7de',
										}}
									>
										<Text
											style={{
												fontSize: 12,
												fontFamily:
													scriptureSubTab === 'all_verses'
														? 'Inter_700Bold'
														: 'Inter_500Medium',
												color:
													scriptureSubTab === 'all_verses'
														? (colors.accentText || '#000000')
														: colors.textSecondary,
											}}
										>
											All Verses ({bookmarks.length})
										</Text>
									</Pressable>
								</View>

								{/* Search Bar */}
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										backgroundColor: isDark ? '#141d24' : '#ffffff',
										borderWidth: 1,
										borderColor: isDark ? '#202e38' : '#e4dfd3',
										borderRadius: 14,
										paddingHorizontal: 12,
										paddingVertical: 8,
										marginBottom: 12,
									}}
								>
									<Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
									<TextInput
										value={searchQuery}
										onChangeText={setSearchQuery}
										placeholder={
											scriptureSubTab === 'collections'
												? 'Search collections...'
												: 'Search verses or citations...'
										}
										placeholderTextColor={colors.textMuted}
										style={{
											flex: 1,
											color: colors.textPrimary,
											fontSize: 13,
											fontFamily: 'Inter_400Regular',
											padding: 0,
										}}
									/>
									{searchQuery.length > 0 && (
										<Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
											<X size={15} color={colors.textMuted} />
										</Pressable>
									)}
								</View>

								{/* SUB-VIEW A: COLLECTIONS */}
								{scriptureSubTab === 'collections' && (
									<View>
										{filteredCollections.length === 0 ? (
											<View
												style={{
													alignItems: 'center',
													paddingVertical: 36,
													backgroundColor: colors.surface,
													borderRadius: 16,
													borderWidth: 1,
													borderColor: colors.border,
													paddingHorizontal: 20,
													marginTop: 4,
												}}
											>
												<BookmarkIcon size={32} color={colors.accent} style={{ marginBottom: 10 }} />
												<Text
													style={{
														fontSize: 16,
														fontFamily: 'Inter_700Bold',
														color: colors.textPrimary,
														marginBottom: 4,
													}}
												>
													No Collections Yet
												</Text>
												<Text
													style={{
														fontSize: 12,
														fontFamily: 'Inter_400Regular',
														color: colors.textSecondary,
														textAlign: 'center',
														lineHeight: 18,
														marginBottom: 16,
													}}
												>
													Organize your favorite Scriptures by topic (e.g. Peace, Strength, Morning Prayers).
												</Text>
												<Pressable
													onPress={handleOpenNewCollection}
													style={{
														backgroundColor: colors.accent,
														paddingHorizontal: 16,
														paddingVertical: 10,
														borderRadius: 12,
													}}
												>
													<Text
														style={{
															fontSize: 13,
															fontFamily: 'Inter_700Bold',
															color: colors.accentText || '#000000',
														}}
													>
														+ Create First Collection
													</Text>
												</Pressable>
											</View>
										) : (
											filteredCollections.map((col) => {
												const count = collectionVerseCountMap[col.id] || 0;
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
															borderBottomColor: colors.border,
														}}
													>
														<View style={{ marginRight: 14 }}>
															<BookmarkIcon
																size={22}
																color={col.color || colors.accent}
																fill={col.color || colors.accent}
															/>
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
											})
										)}

										{filteredCollections.length > 0 && (
											<Pressable
												onPress={handleOpenNewCollection}
												style={{
													flexDirection: 'row',
													alignItems: 'center',
													justifyContent: 'center',
													marginTop: 18,
													paddingVertical: 12,
													borderRadius: 14,
													backgroundColor: isDark ? '#18231c' : '#f0ece2',
													borderWidth: 1,
													borderColor: isDark ? '#273d30' : '#e0dbcf',
												}}
											>
												<Plus size={16} color={colors.accent} style={{ marginRight: 6 }} />
												<Text
													style={{
														fontSize: 13,
														fontFamily: 'Inter_700Bold',
														color: colors.accent,
													}}
												>
													New Collection
												</Text>
											</Pressable>
										)}
									</View>
								)}

								{/* SUB-VIEW B: ALL VERSES (Flat List with OT / NT Filters) */}
								{scriptureSubTab === 'all_verses' && (
									<View>
										{/* Filter Chips */}
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											contentContainerStyle={{ gap: 6, paddingBottom: 10 }}
										>
											{(
												[
													{ key: 'all', label: `All (${bookmarks.length})` },
													{
														key: 'ot',
														label: `Old Testament (${
															bookmarks.filter((b) => b.bookIndex < 39).length
														})`,
													},
													{
														key: 'nt',
														label: `New Testament (${
															bookmarks.filter((b) => b.bookIndex >= 39).length
														})`,
													},
													{
														key: 'has_notes',
														label: `With Notes (${
															bookmarks.filter((b) => b.note && b.note.trim()).length
														})`,
													},
												] as const
											).map((chip) => {
												const isSelected = scriptureFilter === chip.key;
												return (
													<Pressable
														key={chip.key}
														onPress={() => setScriptureFilter(chip.key)}
														style={{
															paddingHorizontal: 12,
															paddingVertical: 5,
															borderRadius: 10,
															backgroundColor: isSelected
																? colors.accentBg
																: isDark
																? '#141d24'
																: '#f0ece2',
															borderWidth: 1,
															borderColor: isSelected ? colors.accent : colors.border,
														}}
													>
														<Text
															style={{
																fontSize: 11,
																fontFamily: isSelected
																	? 'Inter_700Bold'
																	: 'Inter_500Medium',
																color: isSelected ? colors.accent : colors.textSecondary,
															}}
														>
															{chip.label}
														</Text>
													</Pressable>
												);
											})}
										</ScrollView>

										{/* Verses List */}
										{filteredAllVerses.length === 0 ? (
											<View style={{ alignItems: 'center', paddingVertical: 40 }}>
												<Text
													style={{
														fontSize: 15,
														fontFamily: 'Inter_600SemiBold',
														color: colors.textPrimary,
														marginBottom: 4,
													}}
												>
													No saved verses found
												</Text>
												<Text
													style={{
														fontSize: 12,
														fontFamily: 'Inter_400Regular',
														color: colors.textSecondary,
														textAlign: 'center',
													}}
												>
													Tap the bookmark icon in the Reader while studying Scripture.
												</Text>
											</View>
										) : (
											filteredAllVerses.map((bm) => (
												<Pressable
													key={bm.id}
													onPress={() =>
														handleOpenScripture(bm.bookName, bm.chapterNumber, bm.verseNumber)
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
														</View>

														<Pressable
															onPress={(e) => {
																e.stopPropagation();
																setSelectedVerseOptions(bm);
															}}
															hitSlop={8}
															style={{ padding: 4 }}
														>
															<MoreHorizontal size={18} color={colors.textSecondary} />
														</Pressable>
													</View>

													{bm.verseText && (
														<Text
															numberOfLines={2}
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
							</View>
						)}

						{/* ============================================================== */}
						{/* PILLAR 02: PRAYER TREASURY */}
						{/* ============================================================== */}
						{activeTab === 'prayers' && (
							<View>
								{/* Prayers Sub-segment Switch */}
								<View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
									<Pressable
										onPress={() => setPrayersSubTab('my_prayers')}
										style={{
											paddingVertical: 6,
											paddingHorizontal: 14,
											borderRadius: 12,
											backgroundColor:
												prayersSubTab === 'my_prayers'
													? colors.accent
													: isDark
													? '#141d24'
													: '#ebe7de',
										}}
									>
										<Text
											style={{
												fontSize: 12,
												fontFamily:
													prayersSubTab === 'my_prayers' ? 'Inter_700Bold' : 'Inter_500Medium',
												color:
													prayersSubTab === 'my_prayers'
														? (colors.accentText || '#000000')
														: colors.textSecondary,
											}}
										>
											My Prayers ({userPrayers.length})
										</Text>
									</Pressable>

									<Pressable
										onPress={() => setPrayersSubTab('liturgies')}
										style={{
											paddingVertical: 6,
											paddingHorizontal: 14,
											borderRadius: 12,
											backgroundColor:
												prayersSubTab === 'liturgies'
													? colors.accent
													: isDark
													? '#141d24'
													: '#ebe7de',
										}}
									>
										<Text
											style={{
												fontSize: 12,
												fontFamily:
													prayersSubTab === 'liturgies' ? 'Inter_700Bold' : 'Inter_500Medium',
												color:
													prayersSubTab === 'liturgies'
														? (colors.accentText || '#000000')
														: colors.textSecondary,
											}}
										>
											Liturgies ({getAllPrayers().length})
										</Text>
									</Pressable>
								</View>

								{/* SUB-VIEW A: MY PERSONAL PRAYERS & ANSWERED PRAYERS */}
								{prayersSubTab === 'my_prayers' && (
									<View>
										{/* Action Header Row */}
										<View
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'space-between',
												marginBottom: 12,
											}}
										>
											<Text
												style={{
													fontSize: 12,
													fontFamily: 'Inter_700Bold',
													color: colors.textSecondary,
													letterSpacing: 0.8,
													textTransform: 'uppercase',
												}}
											>
												Active Petitions ({activePrayers.length})
											</Text>

											<Pressable
												onPress={handleOpenCreatePrayer}
												style={{
													flexDirection: 'row',
													alignItems: 'center',
													backgroundColor: colors.accent,
													paddingHorizontal: 12,
													paddingVertical: 6,
													borderRadius: 10,
													gap: 4,
												}}
											>
												<Plus size={14} color={colors.accentText || '#000000'} />
												<Text
													style={{
														fontSize: 12,
														fontFamily: 'Inter_700Bold',
														color: colors.accentText || '#000000',
													}}
												>
													New Petition
												</Text>
											</Pressable>
										</View>

										{/* Active Prayers List */}
										{activePrayers.length === 0 ? (
											<View
												style={{
													alignItems: 'center',
													paddingVertical: 28,
													backgroundColor: colors.surface,
													borderRadius: 14,
													borderWidth: 1,
													borderColor: colors.border,
													paddingHorizontal: 20,
													marginBottom: 16,
												}}
											>
												<HeartHandshake size={28} color={colors.accent} style={{ marginBottom: 8 }} />
												<Text
													style={{
														fontSize: 15,
														fontFamily: 'Inter_700Bold',
														color: colors.textPrimary,
														marginBottom: 4,
													}}
												>
													No Active Prayer Requests
												</Text>
												<Text
													style={{
														fontSize: 12,
														fontFamily: 'Inter_400Regular',
														color: colors.textSecondary,
														textAlign: 'center',
														lineHeight: 18,
													}}
												>
													Commit your burdens to the Lord in prayer. When He answers, mark them as answered to celebrate His faithfulness.
												</Text>
											</View>
										) : (
											activePrayers.map((p) => (
												<View
													key={p.id}
													style={{
														backgroundColor: colors.surface,
														borderRadius: 14,
														borderWidth: 1,
														borderColor: colors.border,
														padding: 14,
														marginBottom: 10,
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
														<Text
															style={{
																fontSize: 15,
																fontFamily: 'Inter_700Bold',
																color: colors.textPrimary,
																flex: 1,
																marginRight: 8,
															}}
														>
															{p.title}
														</Text>
														<Pressable onPress={() => handleOpenEditPrayer(p)} hitSlop={8}>
															<MoreHorizontal size={18} color={colors.textSecondary} />
														</Pressable>
													</View>

													<Text
														style={{
															fontSize: 13,
															fontFamily: 'Inter_400Regular',
															color: colors.textSecondary,
															lineHeight: 18,
															marginBottom: 10,
														}}
													>
														{p.request}
													</Text>

													<View
														style={{
															flexDirection: 'row',
															alignItems: 'center',
															justifyContent: 'space-between',
															paddingTop: 8,
															borderTopWidth: 1,
															borderTopColor: colors.borderSubtle || colors.border,
														}}
													>
														<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
															<Clock size={12} color={colors.textMuted} />
															<Text style={{ fontSize: 11, color: colors.textMuted }}>
																{formatRelativeTime(p.createdAt)}
															</Text>
														</View>

														{/* Sutherland Psycho-Logic Mark Answered CTA */}
														<Pressable
															onPress={() => handleOpenMarkAnswered(p)}
															style={{
																flexDirection: 'row',
																alignItems: 'center',
																gap: 4,
																backgroundColor: colors.accentBg,
																paddingHorizontal: 10,
																paddingVertical: 5,
																borderRadius: 8,
																borderWidth: 1,
																borderColor: colors.accent,
															}}
														>
															<Sparkles size={13} color={colors.accent} />
															<Text
																style={{
																	fontSize: 12,
																	fontFamily: 'Inter_700Bold',
																	color: colors.accent,
																}}
															>
																Mark Answered ✨
															</Text>
														</Pressable>
													</View>
												</View>
											))
										)}

										{/* Answered Prayers Archive */}
										{answeredPrayers.length > 0 && (
											<View style={{ marginTop: 14 }}>
												<View
													style={{
														flexDirection: 'row',
														alignItems: 'center',
														gap: 6,
														marginBottom: 10,
													}}
												>
													<Sparkles size={14} color={colors.accent} />
													<Text
														style={{
															fontSize: 12,
															fontFamily: 'Inter_700Bold',
															color: colors.accent,
															letterSpacing: 0.8,
															textTransform: 'uppercase',
														}}
													>
														Answered Prayers Archive ({answeredPrayers.length})
													</Text>
												</View>

												{answeredPrayers.map((p) => (
													<View
														key={p.id}
														style={{
															backgroundColor: isDark ? '#1a2318' : '#f4f9f2',
															borderRadius: 14,
															borderWidth: 1,
															borderColor: isDark ? '#2e452c' : '#cde4cb',
															borderLeftWidth: 4,
															borderLeftColor: colors.accent,
															padding: 14,
															marginBottom: 10,
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
															<Text
																style={{
																	fontSize: 15,
																	fontFamily: 'Inter_700Bold',
																	color: colors.textPrimary,
																	flex: 1,
																	marginRight: 8,
																}}
															>
																{p.title}
															</Text>
															<Pressable onPress={() => handleOpenEditPrayer(p)} hitSlop={8}>
																<MoreHorizontal size={18} color={colors.textSecondary} />
															</Pressable>
														</View>

														<Text
															style={{
																fontSize: 12,
																fontFamily: 'Inter_400Regular',
																color: colors.textSecondary,
																marginBottom: 8,
															}}
														>
															Original: "{p.request}"
														</Text>

														{/* Praise Testimony */}
														{p.answerReflection && (
															<View
																style={{
																	backgroundColor: isDark ? '#131b12' : '#ffffff',
																	borderRadius: 10,
																	padding: 10,
																	borderWidth: 1,
																	borderColor: isDark ? '#253823' : '#d7e7d6',
																	marginTop: 2,
																}}
															>
																<Text
																	style={{
																		fontSize: 11,
																		fontFamily: 'Inter_700Bold',
																		color: colors.accent,
																		marginBottom: 2,
																		textTransform: 'uppercase',
																	}}
																>
																	✨ God's Faithfulness
																</Text>
																<Text
																	style={{
																		fontSize: 13,
																		fontFamily: 'EBGaramond_400Regular_Italic',
																		color: colors.textPrimary,
																		lineHeight: 18,
																	}}
																>
																	"{p.answerReflection}"
																</Text>
															</View>
														)}

														<Text
															style={{
																fontSize: 10,
																fontFamily: 'Inter_400Regular',
																color: colors.textMuted,
																marginTop: 8,
															}}
														>
															Answered {formatRelativeTime(p.answeredAt || p.createdAt)}
														</Text>
													</View>
												))}
											</View>
										)}
									</View>
								)}

								{/* SUB-VIEW B: LITURGIES */}
								{prayersSubTab === 'liturgies' && (
									<View>
										{/* Category Filter Pills */}
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											contentContainerStyle={{ gap: 6, paddingBottom: 12 }}
										>
											{(
												[
													{ key: 'all', label: `All (${getAllPrayers().length})` },
													{ key: 'daily', label: `Daily (${getPrayersByCategory('daily').length})` },
													{
														key: 'foundations',
														label: `Foundations (${getPrayersByCategory('foundations').length})`,
													},
													{
														key: 'traditional',
														label: `Traditional (${getPrayersByCategory('traditional').length})`,
													},
												] as const
											).map((cat) => {
												const isSelected = selectedPrayerCategory === cat.key;
												const isCatGated = cat.key === 'traditional' && !isPremium;
												return (
													<Pressable
														key={cat.key}
														onPress={() => setSelectedPrayerCategory(cat.key)}
														style={{
															flexDirection: 'row',
															alignItems: 'center',
															gap: 4,
															paddingVertical: 5,
															paddingHorizontal: 12,
															borderRadius: 12,
															backgroundColor: isSelected
																? colors.accent
																: isDark
																? '#141d24'
																: '#ebe7de',
														}}
													>
														{isCatGated && (
															<Lock
																size={10}
																color={
																	isSelected
																		? (colors.accentText || '#000000')
																		: colors.textSecondary
																}
															/>
														)}
														<Text
															style={{
																fontSize: 11,
																fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_500Medium',
																color: isSelected
																	? (colors.accentText || '#000000')
																	: colors.textSecondary,
															}}
														>
															{cat.label}
														</Text>
													</Pressable>
												);
											})}
										</ScrollView>

										{/* Liturgies List */}
										{filteredLiturgies.map((prayer) => {
											const isLocked = isPrayerGated(prayer) && !isPremium;
											const categoryLabel =
												prayer.category === 'daily'
													? 'Daily Rhythm'
													: prayer.category === 'foundations'
													? 'Foundations & Creeds'
													: 'Traditional Liturgy';
											const previewText = prayer.prayerText.replace(/\n+/g, ' ').trim();

											return (
												<Pressable
													key={prayer.id}
													onPress={() => {
														if (isLocked) {
															requirePremium('Traditional Liturgies & Historical Creeds');
															return;
														}
														setSelectedPrayerForModal(prayer);
														setIsLiturgiesModalVisible(true);
													}}
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
														<Text
															style={{
																fontSize: 16,
																fontFamily: 'EBGaramond_700Bold',
																color: colors.textPrimary,
																flex: 1,
																marginRight: 8,
															}}
															numberOfLines={1}
														>
															{prayer.title}
														</Text>
														<View
															style={{
																flexDirection: 'row',
																alignItems: 'center',
																gap: 4,
																paddingHorizontal: 8,
																paddingVertical: 2,
																borderRadius: 6,
																backgroundColor: isLocked
																	? (isDark ? '#2e2415' : '#fef3c7')
																	: (isDark ? '#1a2730' : '#eef2f6'),
															}}
														>
															{isLocked && (
																<Lock size={9} color={isDark ? '#f59e0b' : '#b45309'} />
															)}
															<Text
																style={{
																	fontSize: 10,
																	fontFamily: 'Inter_600SemiBold',
																	color: isLocked
																		? (isDark ? '#f59e0b' : '#b45309')
																		: colors.textMuted,
																	textTransform: 'uppercase',
																}}
															>
																{isLocked ? 'Sanctuary' : categoryLabel}
															</Text>
														</View>
													</View>

													<Text
														numberOfLines={2}
														style={{
															fontSize: 13,
															fontFamily: 'Inter_400Regular',
															color: colors.textSecondary,
															lineHeight: 18,
															marginBottom: 6,
														}}
													>
														{previewText}
													</Text>

													<View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
														{isLocked && (
															<Lock size={12} color={isDark ? '#f59e0b' : '#b45309'} />
														)}
														<Text
															style={{
																fontSize: 12,
																fontFamily: 'Inter_700Bold',
																color: isLocked
																	? (isDark ? '#f59e0b' : '#b45309')
																	: colors.accent,
															}}
														>
															{isLocked ? 'Unlock with Sanctuary' : 'Pray & Meditate →'}
														</Text>
													</View>
												</Pressable>
											);
										})}
									</View>
								)}
							</View>
						)}

						{/* ============================================================== */}
						{/* PILLAR 03: SPIRITUAL JOURNAL (Reflections & Notes) */}
						{/* ============================================================== */}
						{activeTab === 'journal' && (
							<View>
								{/* Header & Export Action */}
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
										marginBottom: 12,
									}}
								>
									<Text
										style={{
											fontSize: 12,
											fontFamily: 'Inter_700Bold',
											color: colors.textSecondary,
											letterSpacing: 0.8,
											textTransform: 'uppercase',
										}}
									>
										Verse Reflections ({filteredNotes.length})
									</Text>

									<Pressable
										onPress={handleCopyAllReflections}
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											gap: 4,
											paddingHorizontal: 10,
											paddingVertical: 5,
											borderRadius: 8,
											backgroundColor: colors.surfaceSubtle,
										}}
									>
										<Share2 size={13} color={colors.textSecondary} />
										<Text
											style={{
												fontSize: 11,
												fontFamily: 'Inter_600SemiBold',
												color: colors.textSecondary,
											}}
										>
											Export Notes
										</Text>
									</Pressable>
								</View>

								{/* Search Bar */}
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										backgroundColor: isDark ? '#141d24' : '#ffffff',
										borderWidth: 1,
										borderColor: isDark ? '#202e38' : '#e4dfd3',
										borderRadius: 14,
										paddingHorizontal: 12,
										paddingVertical: 8,
										marginBottom: 12,
									}}
								>
									<Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
									<TextInput
										value={searchQuery}
										onChangeText={setSearchQuery}
										placeholder='Search reflections or Scripture...'
										placeholderTextColor={colors.textMuted}
										style={{
											flex: 1,
											color: colors.textPrimary,
											fontSize: 13,
											fontFamily: 'Inter_400Regular',
											padding: 0,
										}}
									/>
									{searchQuery.length > 0 && (
										<Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
											<X size={15} color={colors.textMuted} />
										</Pressable>
									)}
								</View>

								{/* Journal Timeline List */}
								{filteredNotes.length === 0 ? (
									<View
										style={{
											alignItems: 'center',
											paddingVertical: 36,
											backgroundColor: colors.surface,
											borderRadius: 16,
											borderWidth: 1,
											borderColor: colors.border,
											paddingHorizontal: 20,
										}}
									>
										<FileText size={32} color={colors.accent} style={{ marginBottom: 10 }} />
										<Text
											style={{
												fontSize: 16,
												fontFamily: 'Inter_700Bold',
												color: colors.textPrimary,
												marginBottom: 4,
											}}
										>
											No Notes Written Yet
										</Text>
										<Text
											style={{
												fontSize: 12,
												fontFamily: 'Inter_400Regular',
												color: colors.textSecondary,
												textAlign: 'center',
												lineHeight: 18,
											}}
										>
											While reading in the Scripture Reader, tap any verse to write your reflections and insights. They will gather here in your spiritual journal.
										</Text>
									</View>
								) : (
									filteredNotes.map((bm) => (
										<View
											key={bm.id}
											style={{
												padding: 14,
												borderRadius: 16,
												backgroundColor: colors.surface,
												borderWidth: 1,
												borderColor: colors.border,
												marginBottom: 12,
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
												<Pressable
													onPress={() =>
														handleOpenScripture(bm.bookName, bm.chapterNumber, bm.verseNumber)
													}
												>
													<Text
														style={{
															fontSize: 14,
															fontFamily: 'Inter_700Bold',
															color: colors.accent,
														}}
													>
														{bm.bookName} {bm.chapterNumber}:{bm.verseNumber}
													</Text>
												</Pressable>

												<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
													<Pressable
														onPress={() => {
															setEditingNoteBookmark(bm);
															setNoteInput(bm.note || '');
														}}
														hitSlop={8}
													>
														<Text
															style={{
																fontSize: 12,
																fontFamily: 'Inter_600SemiBold',
																color: colors.textSecondary,
															}}
														>
															Edit
														</Text>
													</Pressable>

													<Pressable
														onPress={() => {
															setCardShareVerse(bm);
															setIsCardShareVisible(true);
														}}
														hitSlop={8}
													>
														<Sparkles size={15} color={colors.accent} />
													</Pressable>
												</View>
											</View>

											{bm.verseText && (
												<Text
													numberOfLines={2}
													style={{
														fontSize: 12,
														fontFamily: 'EBGaramond_400Regular_Italic',
														color: colors.textMuted,
														marginBottom: 8,
													}}
												>
													"{bm.verseText}"
												</Text>
											)}

											<View
												style={{
													backgroundColor: colors.surfaceSubtle,
													borderRadius: 10,
													padding: 10,
													marginBottom: 6,
												}}
											>
												<Text
													style={{
														fontSize: 13,
														fontFamily: 'Inter_400Regular',
														color: colors.textPrimary,
														lineHeight: 19,
													}}
												>
													{bm.note}
												</Text>
											</View>

											<Text style={{ fontSize: 10, color: colors.textMuted }}>
												{formatRelativeTime(bm.createdAt)}
											</Text>
										</View>
									))
								)}
							</View>
						)}
					</ScrollView>
				</View>
			)}

			{/* ============================================================== */}
			{/* MODALS & BOTTOM SHEETS */}
			{/* ============================================================== */}

			{/* 1. Personal Prayer Modal (Create / Edit / Celebrate Answered) */}
			<PersonalPrayerModal
				visible={isPersonalPrayerModalVisible}
				mode={personalPrayerModalMode}
				prayer={selectedPersonalPrayer}
				onClose={() => {
					setIsPersonalPrayerModalVisible(false);
					setSelectedPersonalPrayer(null);
				}}
				onSaved={loadData}
			/>

			{/* 2. Sacred Verse Card Share Modal */}
			<VerseCardShareModal
				visible={isCardShareVisible}
				bookmark={cardShareVerse}
				onClose={() => {
					setIsCardShareVisible(false);
					setCardShareVerse(null);
				}}
			/>

			{/* 3. New / Edit Collection Modal */}
			<Modal
				visible={isEditModalVisible}
				transparent
				animationType='slide'
				statusBarTranslucent
				onRequestClose={() => {
					if (keyboardHeight > 0) {
						Keyboard.dismiss();
					} else {
						setIsEditModalVisible(false);
					}
				}}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.6)',
						justifyContent: 'flex-end',
						paddingBottom: effectiveKeyboardOffset,
					}}
				>
					<Pressable
						style={{ flex: 1 }}
						onPress={() => {
							if (keyboardHeight > 0) {
								Keyboard.dismiss();
							} else {
								setIsEditModalVisible(false);
							}
						}}
					/>
					<View
						style={{
							backgroundColor: isDark ? '#141d24' : '#ffffff',
							borderTopLeftRadius: 28,
							borderTopRightRadius: 28,
							paddingHorizontal: 22,
							paddingTop: 12,
							paddingBottom: Math.max(16, insets.bottom),
							borderWidth: 1,
							borderColor: isDark ? '#23323e' : '#e4dfd3',
							maxHeight:
								effectiveKeyboardOffset > 0
									? Math.max(windowHeight - effectiveKeyboardOffset - insets.top - 16, 260)
									: '88%',
						}}
					>
						<ScrollView
							keyboardShouldPersistTaps='handled'
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingBottom: 16 }}
						>
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

							<TextInput
								value={collectionName}
								onChangeText={setCollectionName}
								placeholder='Collection name (e.g. Psalms of Peace)'
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
											{isSelected && <Check size={20} color='#ffffff' strokeWidth={3} />}
										</Pressable>
									);
								})}
							</View>

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
									<Trash2 size={18} color='#ef4444' style={{ marginRight: 10 }} />
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
										backgroundColor: isDark ? '#23323e' : '#f0ece1',
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
										backgroundColor: colors.accent,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Text
										style={{
											fontSize: 15,
											fontFamily: 'Inter_700Bold',
											color: colors.accentText || '#000000',
										}}
									>
										Save
									</Text>
								</Pressable>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* 4. Per-Verse Options Bottom Sheet */}
			<Modal
				visible={selectedVerseOptions !== null}
				transparent
				animationType='slide'
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

							{/* Share as Sacred Art Card ✨ */}
							<Pressable
								onPress={() => {
									if (!selectedVerseOptions) return;
									const bm = selectedVerseOptions;
									setSelectedVerseOptions(null);
									setCardShareVerse(bm);
									setIsCardShareVisible(true);
								}}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									paddingVertical: 12,
									paddingHorizontal: 12,
									borderRadius: 12,
									backgroundColor: colors.accentBg,
									borderWidth: 1,
									borderColor: colors.accent,
								}}
							>
								<Sparkles size={18} color={colors.accent} style={{ marginRight: 12 }} />
								<Text
									style={{
										fontSize: 15,
										fontFamily: 'Inter_700Bold',
										color: colors.accent,
									}}
								>
									Share as Sacred Card ✨
								</Text>
							</Pressable>

							{/* Add / Edit Note */}
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

							{/* Share Verse Text */}
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
									Share Verse Text
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

			{/* 5. Sort Options Bottom Sheet */}
			<Modal
				visible={isSortSheetVisible}
				transparent
				animationType='slide'
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
							{sortMode === 'date' && <Check size={18} color={colors.accent} strokeWidth={2.5} />}
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
							{sortMode === 'book' && <Check size={18} color={colors.accent} strokeWidth={2.5} />}
						</Pressable>
					</Pressable>
				</Pressable>
			</Modal>

			{/* 6. Note Editing Modal */}
			<Modal
				visible={editingNoteBookmark !== null}
				transparent
				animationType='fade'
				statusBarTranslucent
				onRequestClose={() => {
					if (keyboardHeight > 0) {
						Keyboard.dismiss();
					} else {
						setEditingNoteBookmark(null);
					}
				}}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.6)',
						justifyContent: 'center',
						alignItems: 'center',
						paddingHorizontal: 20,
						paddingBottom: effectiveKeyboardOffset,
					}}
				>
					<Pressable
						style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
						onPress={() => {
							if (keyboardHeight > 0) {
								Keyboard.dismiss();
							} else {
								setEditingNoteBookmark(null);
							}
						}}
					/>
					<View
						style={{
							width: '100%',
							maxWidth: 420,
							maxHeight:
								effectiveKeyboardOffset > 0
									? Math.max(windowHeight - effectiveKeyboardOffset - insets.top - 16, 260)
									: '85%',
							backgroundColor: colors.surfaceElevated || colors.surface,
							borderRadius: 20,
							borderWidth: 1,
							borderColor: colors.border,
							padding: 20,
						}}
					>
						<ScrollView
							keyboardShouldPersistTaps='handled'
							showsVerticalScrollIndicator={false}
							bounces={false}
						>
							<Text
								style={{
									fontSize: 18,
									fontFamily: 'EBGaramond_700Bold',
									color: colors.textPrimary,
									marginBottom: 4,
								}}
							>
								Verse Reflection
							</Text>
							<Text
								style={{
									fontSize: 13,
									fontFamily: 'Inter_700Bold',
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
								placeholder='Add personal reflections, prayer, or context...'
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
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* 7. Re-edit Bookmark Collections Picker Sheet */}
			{isPickerVisible && (
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
			)}

			{/* 8. Liturgies Prayer Meditation Modal */}
			<PrayerMeditationModal
				visible={isLiturgiesModalVisible}
				prayer={selectedPrayerForModal}
				onClose={() => {
					setIsLiturgiesModalVisible(false);
					setSelectedPrayerForModal(null);
				}}
			/>
		</SafeAreaView>
	);
}
