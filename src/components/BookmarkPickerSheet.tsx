import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	Modal,
	Pressable,
	TextInput,
	ScrollView,
	Alert,
	Platform,
	Keyboard,
	useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bookmark as BookmarkIcon, Plus, Check, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react-native';
import {
	getCollections,
	saveCollection,
	getBookmarks,
	getBookmarkByVerse,
	saveVerseBookmark,
	deleteBookmark,
	getBookmarkId,
	COLLECTION_COLORS,
	VerseCollection,
} from '../lib/mmkv';
import { useTheme } from '../lib/themeContext';
import { useFeatureGate } from '../lib/useFeatureGate';

export interface VerseData {
	bookIndex: number;
	bookName: string;
	chapterNumber: number;
	verseNumber: number;
	verseText: string;
	color?: string;
}

interface BookmarkPickerSheetProps {
	visible: boolean;
	verse: VerseData | null;
	onDone: () => void;
	onCancel: () => void;
}

interface BookmarkPickerContentProps {
	verse: VerseData;
	onDone: () => void;
	onCancel: () => void;
}

const BookmarkPickerContent: React.FC<BookmarkPickerContentProps> = ({ verse, onDone, onCancel }) => {
	const insets = useSafeAreaInsets();
	const { height: windowHeight } = useWindowDimensions();
	const { colors, isDark } = useTheme();
	const { isPremium, requirePremium } = useFeatureGate();

	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const scrollViewRef = useRef<ScrollView>(null);
	const isNoteExpandedRef = useRef(false);

	// On Android, statusBarTranslucent Dialogs span under the bottom navigation bar (48dp).
	// When keyboard opens, lifting by keyboardHeight + 48dp places the sheet flush on top of the keyboard.
	const navBarInset = Platform.OS === 'android' ? Math.max(insets.bottom, 48) : insets.bottom;
	const effectiveKeyboardOffset = keyboardHeight > 0 ? keyboardHeight + navBarInset : 0;

	const [collections, setCollections] = useState<VerseCollection[]>(() => getCollections());
	const [existingBookmark] = useState(() => getBookmarkByVerse(verse.bookName, verse.chapterNumber, verse.verseNumber));
	const [isEditing] = useState(() => !!existingBookmark);
	const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(() => {
		if (existingBookmark) {
			return existingBookmark.collectionIds || [];
		}
		const cols = getCollections();
		return cols.length > 0 ? [cols[0].id] : [];
	});
	const [note, setNote] = useState(() => existingBookmark?.note || '');
	const [isNoteExpanded, setIsNoteExpanded] = useState(() => !!existingBookmark?.note);

	// Keep isNoteExpandedRef in sync for keyboard listener
	useEffect(() => {
		isNoteExpandedRef.current = isNoteExpanded;
	}, [isNoteExpanded]);

	// Dynamically track keyboard height across iOS and Android
	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const showSub = Keyboard.addListener(showEvent, (e) => {
			setKeyboardHeight(e.endCoordinates.height);
			if (isNoteExpandedRef.current) {
				setTimeout(() => {
					scrollViewRef.current?.scrollToEnd({ animated: true });
				}, 80);
			}
		});
		const hideSub = Keyboard.addListener(hideEvent, () => {
			setKeyboardHeight(0);
		});

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, []);

	// Inline "Create New" collection state
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [newColName, setNewColName] = useState('');
	const [newColColor, setNewColColor] = useState(COLLECTION_COLORS[0]);

	const toggleCollection = (id: string) => {
		setSelectedCollectionIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
	};

	const handleStartCreateNew = () => {
		if (!isPremium && collections.length >= 1) {
			requirePremium('Unlimited collections');
			return;
		}
		setIsCreatingNew(true);
		setNewColName('');
		setNewColColor(COLLECTION_COLORS[Math.floor(Math.random() * COLLECTION_COLORS.length)]);
		setTimeout(() => {
			scrollViewRef.current?.scrollTo({ y: 0, animated: false });
		}, 50);
	};

	const handleCreateCollection = () => {
		const trimmed = newColName.trim();
		if (!trimmed) {
			Alert.alert('Name Required', 'Please enter a name for the collection.');
			return;
		}

		Keyboard.dismiss();
		const newId = `col_${Date.now()}`;
		const newCol: VerseCollection = {
			id: newId,
			name: trimmed,
			color: newColColor,
			createdAt: Date.now(),
		};

		saveCollection(newCol);
		const updated = getCollections();
		setCollections(updated);
		setSelectedCollectionIds([newId]);
		setIsCreatingNew(false);
		setNewColName('');
	};

	const handleSave = () => {
		if (collections.length === 0) {
			Alert.alert('Create a Collection', 'Please create a collection first to save this verse.');
			return;
		}

		// Check free tier limit (5 bookmarks max)
		if (!isEditing && !isPremium) {
			const allBookmarks = getBookmarks();
			if (allBookmarks.length >= 5) {
				requirePremium('Unlimited bookmarks');
				Alert.alert(
					'Bookmark Limit Reached',
					"You've saved 5 bookmarks on the Free Covenant Plan. Unlock Sanctuary to save unlimited verses.",
				);
				return;
			}
		}

		// Check if user unselected all collections
		if (selectedCollectionIds.length === 0) {
			if (isEditing) {
				Alert.alert('Remove Bookmark', 'This will remove the bookmark completely. Continue?', [
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Remove',
						style: 'destructive',
						onPress: () => {
							Keyboard.dismiss();
							const id = getBookmarkId(verse.bookName, verse.chapterNumber, verse.verseNumber);
							deleteBookmark(id);
							onDone();
						},
					},
				]);
				return;
			}
			Alert.alert('Selection Required', 'Please select at least one collection to save this verse.');
			return;
		}

		Keyboard.dismiss();
		saveVerseBookmark(verse, selectedCollectionIds, note);
		onDone();
	};

	return (
		<Modal
			visible={true}
			transparent
			statusBarTranslucent
			animationType='slide'
			onRequestClose={() => {
				if (keyboardHeight > 0) {
					Keyboard.dismiss();
				} else {
					onCancel();
				}
			}}
		>
			<View
				className='flex-1 justify-end'
				style={{
					backgroundColor: 'rgba(0,0,0,0.6)',
					paddingBottom: effectiveKeyboardOffset,
				}}
			>
				<Pressable
					style={{ flex: 1 }}
					onPress={() => {
						if (keyboardHeight > 0) {
							Keyboard.dismiss();
						} else {
							onCancel();
						}
					}}
				/>

				<View
					style={{
						backgroundColor: colors.surfaceElevated || colors.surface,
						borderTopLeftRadius: 24,
						borderTopRightRadius: 24,
						borderWidth: 1,
						borderColor: colors.border,
						maxHeight:
							effectiveKeyboardOffset > 0
								? Math.max(windowHeight - effectiveKeyboardOffset - insets.top - 16, 260)
								: '85%',
						flexDirection: 'column',
					}}
				>
					{/* Drag Handle Bar */}
					<View className='items-center pt-3 pb-2'>
						<View
							style={{
								width: 36,
								height: 4,
								borderRadius: 2,
								backgroundColor: colors.border,
							}}
						/>
					</View>

					{/* Fixed Header */}
					<View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 }}>
						{isCreatingNew ? (
							<View className='flex-row justify-between items-center'>
								<Text
									style={{
										fontFamily: 'EBGaramond_700Bold',
										fontSize: 20,
										color: colors.textPrimary,
									}}
								>
									Create New Collection
								</Text>
								<Pressable
									hitSlop={8}
									onPress={() => {
										Keyboard.dismiss();
										setIsCreatingNew(false);
									}}
									className='p-1 rounded-full'
									style={{ backgroundColor: colors.surfaceSubtle }}
								>
									<X size={18} color={colors.textSecondary} />
								</Pressable>
							</View>
						) : (
							<View className='flex-row justify-between items-center'>
								<View style={{ flex: 1, marginRight: 10 }}>
									<Text
										style={{
											fontFamily: 'EBGaramond_700Bold',
											fontSize: 22,
											color: colors.textPrimary,
										}}
									>
										{isEditing ? 'Edit Bookmark' : 'Bookmark Verse'}
									</Text>
									<Text
										style={{
											color: colors.textSecondary,
											fontSize: 13,
											marginTop: 2,
										}}
									>
										{verse.bookName} {verse.chapterNumber}:{verse.verseNumber}
									</Text>
								</View>

								{collections.length > 0 && (
									<Pressable
										onPress={handleStartCreateNew}
										className='flex-row items-center gap-1.5 px-3 py-1.5 rounded-full'
										style={{
											backgroundColor: colors.accent,
										}}
									>
										<Plus size={14} color={colors.accentText || '#000000'} strokeWidth={2.5} />
										<Text
											style={{
												color: colors.accentText || '#000000',
												fontSize: 13,
												fontFamily: 'Inter_700Bold',
											}}
										>
											Create New
										</Text>
									</Pressable>
								)}
							</View>
						)}
					</View>

					{/* Scrollable Middle Content */}
					<ScrollView
						ref={scrollViewRef}
						keyboardShouldPersistTaps='handled'
						keyboardDismissMode='on-drag'
						showsVerticalScrollIndicator={false}
						style={{ flexShrink: 1 }}
						contentContainerStyle={{
							paddingHorizontal: 20,
							paddingTop: 4,
							paddingBottom: 16,
						}}
					>
						{isCreatingNew ? (
							/* Inline Create Collection View */
							<View className='pt-1'>
								{/* Name Input */}
								<Text
									style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}
									className='font-sans font-medium uppercase tracking-wider'
								>
									Name
								</Text>
								<TextInput
									value={newColName}
									onChangeText={setNewColName}
									placeholder='e.g. Strength, Morning Grace'
									placeholderTextColor={colors.textMuted}
									autoFocus
									style={{
										backgroundColor: colors.surface,
										borderColor: colors.border,
										borderWidth: 1,
										borderRadius: 12,
										paddingHorizontal: 14,
										paddingVertical: 12,
										color: colors.textPrimary,
										fontSize: 15,
										marginBottom: 16,
									}}
								/>

								{/* Color Swatches */}
								<Text
									style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8 }}
									className='font-sans font-medium uppercase tracking-wider'
								>
									Choose a Color
								</Text>
								<View className='flex-row justify-between mb-4'>
									{COLLECTION_COLORS.map((c) => {
										const isSelected = newColColor === c;
										return (
											<Pressable
												key={c}
												onPress={() => setNewColColor(c)}
												style={{
													width: 44,
													height: 44,
													borderRadius: 22,
													backgroundColor: c,
													alignItems: 'center',
													justifyContent: 'center',
													borderWidth: isSelected ? 3 : 0,
													borderColor: colors.textPrimary,
												}}
											>
												{isSelected && <Check size={20} color='#ffffff' strokeWidth={3} />}
											</Pressable>
										);
									})}
								</View>
							</View>
						) : (
							/* Main Bookmark Picker View */
							<View className='pt-1'>
								{/* Empty State: No Collections Yet */}
								{collections.length === 0 ? (
									<View style={{ paddingVertical: 20, alignItems: 'center' }}>
										<Text
											style={{
												fontSize: 19,
												fontFamily: 'EBGaramond_700Bold',
												color: colors.textPrimary,
												textAlign: 'center',
												marginBottom: 6,
											}}
										>
											No Collections Yet
										</Text>
										<Text
											style={{
												fontSize: 13,
												fontFamily: 'Inter_400Regular',
												color: colors.textSecondary,
												textAlign: 'center',
												marginBottom: 20,
												lineHeight: 18,
												paddingHorizontal: 16,
											}}
										>
											Create your very first collection to organize and save this Scripture verse.
										</Text>
										<Pressable
											onPress={handleStartCreateNew}
											style={{
												backgroundColor: colors.accent,
												width: '100%',
												paddingVertical: 14,
												borderRadius: 14,
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'center',
												gap: 8,
												shadowColor: colors.accent,
												shadowOffset: { width: 0, height: 3 },
												shadowOpacity: 0.25,
												shadowRadius: 5,
												elevation: 3,
											}}
										>
											<Plus size={18} color={colors.accentText || '#000000'} strokeWidth={2.5} />
											<Text
												style={{
													color: colors.accentText || '#000000',
													fontSize: 15,
													fontFamily: 'Inter_700Bold',
												}}
											>
												Create First Collection
											</Text>
										</Pressable>
									</View>
								) : (
									<>
										{/* Collections List */}
										<Text
											style={{
												color: colors.textMuted,
												fontSize: 11,
												letterSpacing: 1,
												marginBottom: 8,
											}}
											className='font-sans font-semibold uppercase'
										>
											Save to Collections
										</Text>

										<View className='mb-2'>
											{collections.map((col) => {
												const isChecked = selectedCollectionIds.includes(col.id);
												return (
													<Pressable
														key={col.id}
														onPress={() => toggleCollection(col.id)}
														className='flex-row items-center justify-between py-3 px-3.5 mb-1.5 rounded-xl'
														style={{
															backgroundColor: isChecked
																? isDark
																	? '#1a261f'
																	: '#f0ede4'
																: colors.surface,
															borderWidth: 1,
															borderColor: isChecked ? col.color : colors.border,
														}}
													>
														<View className='flex-row items-center gap-3'>
															<View
																style={{
																	width: 30,
																	height: 30,
																	borderRadius: 8,
																	backgroundColor: `${col.color}20`,
																	alignItems: 'center',
																	justifyContent: 'center',
																}}
															>
																<BookmarkIcon
																	size={16}
																	color={col.color}
																	fill={isChecked ? col.color : 'transparent'}
																/>
															</View>
															<Text
																style={{
																	color: colors.textPrimary,
																	fontSize: 15,
																	fontWeight: isChecked ? '600' : '400',
																}}
															>
																{col.name}
															</Text>
														</View>

														{/* Checkbox indicator */}
														<View
															style={{
																width: 22,
																height: 22,
																borderRadius: 6,
																backgroundColor: isChecked ? col.color : 'transparent',
																borderWidth: isChecked ? 0 : 1.5,
																borderColor: colors.border,
																alignItems: 'center',
																justifyContent: 'center',
															}}
														>
															{isChecked && (
																<Check size={14} color='#ffffff' strokeWidth={3} />
															)}
														</View>
													</Pressable>
												);
											})}
										</View>
									</>
								)}

								{/* Note Field (Expandable) */}
								<View className='mb-2'>
									<Pressable
										onPress={() => {
											const next = !isNoteExpanded;
											setIsNoteExpanded(next);
											if (next) {
												setTimeout(() => {
													scrollViewRef.current?.scrollToEnd({ animated: true });
												}, 80);
											}
										}}
										className='flex-row items-center justify-between py-2 px-1'
									>
										<Text
											style={{
												color: note.trim() ? colors.accent : colors.textSecondary,
												fontSize: 13,
												fontWeight: '500',
											}}
										>
											{note.trim()
												? `Note: "${note.slice(0, 24)}${note.length > 24 ? '...' : ''}"`
												: '+ Add a personal note (optional)'}
										</Text>
										{isNoteExpanded ? (
											<ChevronUp size={16} color={colors.textSecondary} />
										) : (
											<ChevronDown size={16} color={colors.textSecondary} />
										)}
									</Pressable>

									{isNoteExpanded && (
										<View className='mt-1'>
											<TextInput
												value={note}
												onChangeText={setNote}
												placeholder='What does this verse speak to you?'
												placeholderTextColor={colors.textMuted}
												maxLength={200}
												multiline
												numberOfLines={3}
												onFocus={() => {
													setTimeout(() => {
														scrollViewRef.current?.scrollToEnd({ animated: true });
													}, 100);
												}}
												style={{
													backgroundColor: colors.surface,
													borderColor: colors.border,
													borderWidth: 1,
													borderRadius: 12,
													padding: 12,
													color: colors.textPrimary,
													fontSize: 14,
													textAlignVertical: 'top',
													minHeight: 70,
												}}
											/>
											<Text
												style={{
													color: colors.textMuted,
													fontSize: 11,
													textAlign: 'right',
													marginTop: 4,
												}}
											>
												{note.length}/200
											</Text>
										</View>
									)}
								</View>
							</View>
						)}
					</ScrollView>

					{/* Fixed Bottom Action Buttons Footer */}
					<View
						style={{
							paddingHorizontal: 20,
							paddingTop: 12,
							paddingBottom:
								keyboardHeight > 0
									? 14
									: Platform.OS === 'android'
										? Math.max(insets.bottom, 48) + 14
										: Math.max(insets.bottom, 16),
							borderTopWidth: 1,
							borderTopColor: colors.border,
							backgroundColor: colors.surfaceElevated || colors.surface,
						}}
					>
						{isCreatingNew ? (
							<View className='flex-row gap-3'>
								<Pressable
									onPress={() => {
										Keyboard.dismiss();
										setIsCreatingNew(false);
									}}
									className='flex-1 py-3.5 rounded-xl items-center justify-center'
									style={{ backgroundColor: colors.surfaceSubtle }}
								>
									<Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '600' }}>
										Cancel
									</Text>
								</Pressable>

								<Pressable
									onPress={handleCreateCollection}
									className='flex-1 py-3.5 rounded-xl items-center justify-center'
									style={{ backgroundColor: colors.accent }}
								>
									<Text
										style={{
											color: colors.accentText || '#000000',
											fontSize: 15,
											fontWeight: '700',
										}}
									>
										Create & Add
									</Text>
								</Pressable>
							</View>
						) : (
							<View className='flex-row gap-3'>
								<Pressable
									onPress={() => {
										Keyboard.dismiss();
										onCancel();
									}}
									className='flex-1 py-3.5 rounded-xl items-center justify-center'
									style={{ backgroundColor: colors.surfaceSubtle }}
								>
									<Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '600' }}>
										Cancel
									</Text>
								</Pressable>

								{collections.length > 0 && (
									<Pressable
										onPress={handleSave}
										className='flex-1 py-3.5 rounded-xl items-center justify-center'
										style={{ backgroundColor: colors.accent }}
									>
										<Text
											style={{
												color: colors.accentText || '#000000',
												fontSize: 15,
												fontWeight: '700',
											}}
										>
											Done
										</Text>
									</Pressable>
								)}
							</View>
						)}
					</View>
				</View>
			</View>
		</Modal>
	);
};

export const BookmarkPickerSheet: React.FC<BookmarkPickerSheetProps> = ({ visible, verse, onDone, onCancel }) => {
	if (!visible || !verse) return null;

	return (
		<BookmarkPickerContent
			key={`${verse.bookName}_${verse.chapterNumber}_${verse.verseNumber}`}
			verse={verse}
			onDone={onDone}
			onCancel={onCancel}
		/>
	);
};
