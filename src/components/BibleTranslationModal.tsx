import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Modal, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { X, Check, Download, Trash2, Search, Globe, BookOpen, Sparkles } from 'lucide-react-native';
import { useTheme } from '../lib/themeContext';
import { BibleCatalogItem, BIBLE_CATALOG, getTranslationBadge } from '../data/bibleCatalog';
import { getInstalledBibles, downloadBible, deleteBible } from '../lib/bibleDownloader';
import { useBibleTranslation } from '../lib/bible';

interface BibleTranslationModalProps {
	visible: boolean;
	onClose: () => void;
}

export const BibleTranslationModal: React.FC<BibleTranslationModalProps> = ({ visible, onClose }) => {
	const { colors, isDark } = useTheme();
	const [activeTranslation, setActiveTranslation] = useBibleTranslation();

	const [activeTab, setActiveTab] = useState<'installed' | 'download'>('installed');
	const [installedList, setInstalledList] = useState<BibleCatalogItem[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('All');

	// Track download states: { [code]: progress number 0..1 }
	const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
	const [downloadingCode, setDownloadingCode] = useState<string | null>(null);

	const refreshInstalled = useCallback(async () => {
		const list = await getInstalledBibles();
		setInstalledList(list);
	}, []);

	useEffect(() => {
		if (visible) {
			refreshInstalled();
		}
	}, [visible, refreshInstalled]);

	const installedCodes = useMemo(() => {
		return new Set(installedList.map((item) => item.code));
	}, [installedList]);

	// Distinct language filter chips
	const languageOptions = useMemo(() => {
		const langs = new Set<string>();
		BIBLE_CATALOG.forEach((item) => {
			if (!item.isPreloaded) {
				langs.add(item.language);
			}
		});
		return ['All', ...Array.from(langs).sort()];
	}, []);

	// Filter available downloadable translations
	const filteredCatalog = useMemo(() => {
		return BIBLE_CATALOG.filter((item) => {
			// Filter by language chip
			if (selectedLanguageFilter !== 'All' && item.language !== selectedLanguageFilter) {
				return false;
			}
			// Filter by search query
			if (!searchQuery.trim()) return true;
			const q = searchQuery.toLowerCase().trim();
			return (
				item.name.toLowerCase().includes(q) ||
				item.nativeName.toLowerCase().includes(q) ||
				item.language.toLowerCase().includes(q) ||
				item.code.toLowerCase().includes(q)
			);
		});
	}, [searchQuery, selectedLanguageFilter]);

	const handleSelectTranslation = (code: string) => {
		setActiveTranslation(code);
		onClose();
	};

	const handleStartDownload = async (item: BibleCatalogItem) => {
		if (downloadingCode) return; // Prevent concurrent downloads

		setDownloadingCode(item.code);
		setDownloadProgress((prev) => ({ ...prev, [item.code]: 0.05 }));

		const res = await downloadBible(item, (pct) => {
			setDownloadProgress((prev) => ({ ...prev, [item.code]: pct }));
		});

		setDownloadingCode(null);
		setDownloadProgress((prev) => {
			const copy = { ...prev };
			delete copy[item.code];
			return copy;
		});

		if (res.success) {
			await refreshInstalled();
			Alert.alert(
				'Download Complete',
				`${item.name} (${item.language}) is now saved on your device for offline reading. Switch to this translation now?`,
				[
					{ text: 'Later', style: 'cancel' },
					{
						text: 'Switch Now',
						onPress: () => {
							setActiveTranslation(item.code);
							onClose();
						},
					},
				],
			);
		} else {
			Alert.alert('Download Failed', res.error || 'Please check your connection and try again.');
		}
	};

	const handleDeleteTranslation = (item: BibleCatalogItem) => {
		Alert.alert(
			'Remove Translation',
			`Are you sure you want to remove ${item.name} from your device? You can re-download it anytime.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: async () => {
						await deleteBible(item.code);
						await refreshInstalled();
					},
				},
			],
		);
	};

	return (
		<Modal visible={visible} animationType='slide' transparent={true} onRequestClose={onClose}>
			<View
				style={{
					flex: 1,
					backgroundColor: 'rgba(0, 0, 0, 0.65)',
					justifyContent: 'flex-end',
				}}
			>
				<View
					style={{
						backgroundColor: colors.background,
						borderTopLeftRadius: 28,
						borderTopRightRadius: 28,
						borderWidth: 1,
						borderColor: colors.border,
						height: '82%',
						display: 'flex',
					}}
				>
					{/* Header */}
					<View
						style={{
							paddingTop: 18,
							paddingBottom: 14,
							paddingHorizontal: 20,
							borderBottomWidth: 1,
							borderBottomColor: colors.borderSubtle,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<View className='flex-row items-center'>
							<View
								style={{
									width: 36,
									height: 36,
									borderRadius: 10,
									backgroundColor: colors.accentBg,
									alignItems: 'center',
									justifyContent: 'center',
									marginRight: 10,
								}}
							>
								<Globe size={18} color={colors.accent} />
							</View>
							<View>
								<Text
									style={{
										fontSize: 18,
										fontFamily: 'EBGaramond_700Bold',
										color: colors.textPrimary,
									}}
								>
									Bible Translations
								</Text>
								<Text style={{ fontSize: 11, color: colors.textSecondary }}>
									Offline Scripture in your language
								</Text>
							</View>
						</View>

						<Pressable
							onPress={onClose}
							hitSlop={10}
							accessibilityRole='button'
							accessibilityLabel='Close'
							style={{
								width: 32,
								height: 32,
								borderRadius: 16,
								backgroundColor: colors.surfaceSubtle,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<X size={16} color={colors.textSecondary} />
						</Pressable>
					</View>

					{/* Segmented Control Tabs */}
					<View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
						<View
							style={{
								flexDirection: 'row',
								backgroundColor: colors.surfaceSubtle,
								borderRadius: 14,
								padding: 4,
							}}
						>
							<Pressable
								onPress={() => setActiveTab('installed')}
								style={{
									flex: 1,
									paddingVertical: 9,
									borderRadius: 10,
									backgroundColor: activeTab === 'installed' ? colors.surface : 'transparent',
									alignItems: 'center',
									borderWidth: activeTab === 'installed' ? 1 : 0,
									borderColor: colors.border,
								}}
							>
								<Text
									style={{
										fontSize: 13,
										fontFamily: activeTab === 'installed' ? 'Inter_700Bold' : 'Inter_500Medium',
										color: activeTab === 'installed' ? colors.accent : colors.textSecondary,
									}}
								>
									Installed ({installedList.length})
								</Text>
							</Pressable>

							<Pressable
								onPress={() => setActiveTab('download')}
								style={{
									flex: 1,
									paddingVertical: 9,
									borderRadius: 10,
									backgroundColor: activeTab === 'download' ? colors.surface : 'transparent',
									alignItems: 'center',
									borderWidth: activeTab === 'download' ? 1 : 0,
									borderColor: colors.border,
								}}
							>
								<Text
									style={{
										fontSize: 13,
										fontFamily: activeTab === 'download' ? 'Inter_700Bold' : 'Inter_500Medium',
										color: activeTab === 'download' ? colors.accent : colors.textSecondary,
									}}
								>
									Download Languages
								</Text>
							</Pressable>
						</View>
					</View>

					{/* TAB 1: INSTALLED BIBLES */}
					{activeTab === 'installed' && (
						<ScrollView
							contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
							showsVerticalScrollIndicator={false}
						>
							<Text
								style={{
									fontSize: 12,
									fontFamily: 'Inter_600SemiBold',
									color: colors.textSecondary,
									textTransform: 'uppercase',
									letterSpacing: 0.5,
									marginBottom: 10,
									paddingHorizontal: 4,
								}}
							>
								Ready For Offline Reading
							</Text>

							{installedList.map((item) => {
								const isActive = item.code === activeTranslation;

								return (
									<Pressable
										key={item.code}
										onPress={() => handleSelectTranslation(item.code)}
										accessibilityRole='button'
										accessibilityLabel={`Select ${item.name}`}
										style={({ pressed }) => ({
											padding: 16,
											borderRadius: 18,
											backgroundColor: colors.surface,
											borderWidth: 1,
											borderColor: isActive ? colors.accent : colors.border,
											marginBottom: 10,
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between',
											opacity: pressed ? 0.9 : 1,
										})}
									>
										<View style={{ flex: 1, marginRight: 12 }}>
											<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
												<View
													style={{
														paddingHorizontal: 6,
														paddingVertical: 2,
														borderRadius: 4,
														backgroundColor: colors.surfaceSubtle,
														borderWidth: 1,
														borderColor: colors.borderSubtle,
														marginRight: 6,
													}}
												>
													<Text
														style={{
															fontSize: 11,
															fontFamily: 'Inter_700Bold',
															color: colors.accent,
															letterSpacing: 0.5,
														}}
													>
														{item.shortCode || getTranslationBadge(item.code)}
													</Text>
												</View>

												<Text
													style={{
														fontSize: 15,
														fontFamily: 'Inter_700Bold',
														color: colors.textPrimary,
														marginRight: 6,
													}}
												>
													{item.name}
												</Text>

												{item.isPreloaded ? (
													<View
														style={{
															paddingHorizontal: 6,
															paddingVertical: 2,
															borderRadius: 4,
															backgroundColor: colors.surfaceSubtle,
														}}
													>
														<Text
															style={{
																fontSize: 10,
																fontFamily: 'Inter_600SemiBold',
																color: colors.textMuted,
															}}
														>
															Default
														</Text>
													</View>
												) : (
													<View
														style={{
															paddingHorizontal: 6,
															paddingVertical: 2,
															borderRadius: 4,
															backgroundColor: colors.successBg || '#1e382b',
														}}
													>
														<Text
															style={{
																fontSize: 10,
																fontFamily: 'Inter_600SemiBold',
																color: colors.success,
															}}
														>
															Downloaded
														</Text>
													</View>
												)}
											</View>

											<Text
												style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}
											>
												{item.nativeName} • {item.language}
											</Text>
											<Text style={{ fontSize: 11, color: colors.textMuted }}>
												{item.description}
											</Text>
										</View>

										<View className='flex-row items-center'>
											{/* Delete button for downloaded non-preloaded Bibles */}
											{!item.isPreloaded && (
												<Pressable
													onPress={() => handleDeleteTranslation(item)}
													hitSlop={8}
													accessibilityRole='button'
													accessibilityLabel={`Delete ${item.name}`}
													style={{
														width: 36,
														height: 36,
														borderRadius: 18,
														backgroundColor: colors.surfaceSubtle,
														alignItems: 'center',
														justifyContent: 'center',
														marginRight: 8,
													}}
												>
													<Trash2 size={16} color={colors.danger} />
												</Pressable>
											)}

											{/* Active Radio Badge */}
											<View
												style={{
													width: 28,
													height: 28,
													borderRadius: 14,
													borderWidth: 1.5,
													borderColor: isActive ? colors.accent : colors.border,
													backgroundColor: isActive ? colors.accent : 'transparent',
													alignItems: 'center',
													justifyContent: 'center',
												}}
											>
												{isActive && <Check size={16} color='#141413' strokeWidth={3} />}
											</View>
										</View>
									</Pressable>
								);
							})}

							{/* Callout to download more */}
							<Pressable
								onPress={() => setActiveTab('download')}
								style={{
									marginTop: 10,
									padding: 16,
									borderRadius: 18,
									backgroundColor: colors.surfaceSubtle,
									borderWidth: 1,
									borderColor: colors.borderSubtle,
									borderStyle: 'dashed',
									alignItems: 'center',
									flexDirection: 'row',
									justifyContent: 'center',
								}}
							>
								<Download size={16} color={colors.accent} style={{ marginRight: 8 }} />
								<Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.accent }}>
									+ Download More Languages
								</Text>
							</Pressable>
						</ScrollView>
					)}

					{/* TAB 2: DOWNLOAD LANGUAGES */}
					{activeTab === 'download' && (
						<View style={{ flex: 1 }}>
							{/* Search Bar */}
							<View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 }}>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										backgroundColor: colors.surface,
										borderWidth: 1,
										borderColor: colors.border,
										borderRadius: 14,
										paddingHorizontal: 12,
										height: 44,
									}}
								>
									<Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
									<TextInput
										value={searchQuery}
										onChangeText={setSearchQuery}
										placeholder='Search Turkish, Spanish, French...'
										placeholderTextColor={colors.textMuted}
										style={{
											flex: 1,
											color: colors.textPrimary,
											fontSize: 14,
											fontFamily: 'Inter_500Medium',
										}}
									/>
									{searchQuery.length > 0 && (
										<Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
											<X size={16} color={colors.textMuted} />
										</Pressable>
									)}
								</View>
							</View>

							{/* Quick Language Chips */}
							<View style={{ paddingBottom: 8 }}>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={{ paddingHorizontal: 16 }}
								>
									{languageOptions.map((lang) => {
										const isSelected = selectedLanguageFilter === lang;
										return (
											<Pressable
												key={lang}
												onPress={() => setSelectedLanguageFilter(lang)}
												style={{
													paddingHorizontal: 14,
													paddingVertical: 6,
													borderRadius: 20,
													backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
													borderWidth: 1,
													borderColor: isSelected ? colors.accent : colors.border,
													marginRight: 6,
												}}
											>
												<Text
													style={{
														fontSize: 12,
														fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_500Medium',
														color: isSelected ? '#141413' : colors.textSecondary,
													}}
												>
													{lang}
												</Text>
											</Pressable>
										);
									})}
								</ScrollView>
							</View>

							{/* Available Translations List */}
							<ScrollView
								contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
								showsVerticalScrollIndicator={false}
							>
								{filteredCatalog.length === 0 ? (
									<View style={{ paddingVertical: 40, alignItems: 'center' }}>
										<Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 4 }}>
											No matching translations found
										</Text>
										<Text style={{ fontSize: 12, color: colors.textMuted }}>
											Try searching for a different language or country
										</Text>
									</View>
								) : (
									filteredCatalog.map((item) => {
										const isInstalled = installedCodes.has(item.code);
										const isDownloading = downloadingCode === item.code;
										const progress = downloadProgress[item.code] || 0;

										return (
											<View
												key={item.code}
												style={{
													padding: 16,
													borderRadius: 18,
													backgroundColor: colors.surface,
													borderWidth: 1,
													borderColor: colors.border,
													marginBottom: 10,
													flexDirection: 'row',
													alignItems: 'center',
													justifyContent: 'space-between',
												}}
											>
												<View style={{ flex: 1, marginRight: 12 }}>
													<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
														<View
															style={{
																paddingHorizontal: 6,
																paddingVertical: 2,
																borderRadius: 4,
																backgroundColor: colors.surfaceSubtle,
																borderWidth: 1,
																borderColor: colors.borderSubtle,
																marginRight: 6,
															}}
														>
															<Text
																style={{
																	fontSize: 11,
																	fontFamily: 'Inter_700Bold',
																	color: colors.accent,
																	letterSpacing: 0.5,
																}}
															>
																{item.shortCode || getTranslationBadge(item.code)}
															</Text>
														</View>

														<Text
															style={{
																fontSize: 15,
																fontFamily: 'Inter_700Bold',
																color: colors.textPrimary,
																marginRight: 6,
															}}
														>
															{item.name}
														</Text>

														<View
															style={{
																paddingHorizontal: 6,
																paddingVertical: 2,
																borderRadius: 4,
																backgroundColor: colors.surfaceSubtle,
															}}
														>
															<Text
																style={{
																	fontSize: 10,
																	fontFamily: 'Inter_600SemiBold',
																	color: colors.accent,
																}}
															>
																{item.language}
															</Text>
														</View>
													</View>

													<Text
														style={{
															fontSize: 12,
															color: colors.textSecondary,
															marginBottom: 2,
														}}
													>
														{item.nativeName} • {item.sizeFormatted}
													</Text>
													<Text style={{ fontSize: 11, color: colors.textMuted }}>
														{item.description}
													</Text>
												</View>

												{/* Action Column */}
												<View style={{ alignItems: 'flex-end', minWidth: 84 }}>
													{isInstalled ? (
														<View
															style={{
																paddingHorizontal: 10,
																paddingVertical: 6,
																borderRadius: 12,
																backgroundColor: colors.surfaceSubtle,
																flexDirection: 'row',
																alignItems: 'center',
															}}
														>
															<Check
																size={13}
																color={colors.success}
																style={{ marginRight: 4 }}
															/>
															<Text
																style={{
																	fontSize: 12,
																	fontFamily: 'Inter_600SemiBold',
																	color: colors.success,
																}}
															>
																Ready
															</Text>
														</View>
													) : isDownloading ? (
														<View style={{ alignItems: 'center' }}>
															<ActivityIndicator size='small' color={colors.accent} />
															<Text
																style={{
																	fontSize: 10,
																	color: colors.accent,
																	marginTop: 4,
																	fontFamily: 'Inter_700Bold',
																}}
															>
																{Math.round(progress * 100)}%
															</Text>
														</View>
													) : (
														<Pressable
															onPress={() => handleStartDownload(item)}
															disabled={Boolean(downloadingCode)}
															accessibilityRole='button'
															accessibilityLabel={`Download ${item.name}`}
															style={({ pressed }) => ({
																paddingHorizontal: 12,
																paddingVertical: 8,
																borderRadius: 12,
																backgroundColor: colors.accent,
																flexDirection: 'row',
																alignItems: 'center',
																opacity: pressed ? 0.9 : 1,
															})}
														>
															<Download
																size={13}
																color='#141413'
																style={{ marginRight: 5 }}
															/>
															<Text
																style={{
																	fontSize: 12,
																	fontFamily: 'Inter_700Bold',
																	color: '#141413',
																}}
															>
																Get
															</Text>
														</Pressable>
													)}
												</View>
											</View>
										);
									})
								)}
							</ScrollView>
						</View>
					)}
				</View>
			</View>
		</Modal>
	);
};
