import React, { useState, useRef } from 'react';
import {
	View,
	Text,
	Modal,
	Pressable,
	Image,
	ScrollView,
	Share,
	ActivityIndicator,
	Alert,
	Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Share2, Sparkles, Image as ImageIcon } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import { SCROLL_BACKGROUNDS } from '../../../assets/scroll-backgrounds';
import { Bookmark } from '../../lib/mmkv';
import { useTheme } from '../../lib/themeContext';

export interface VerseCardShareModalProps {
	visible: boolean;
	bookmark: Bookmark | null;
	onClose: () => void;
}

export function VerseCardShareModal({
	visible,
	bookmark,
	onClose,
}: VerseCardShareModalProps) {
	const insets = useSafeAreaInsets();
	const { colors, isDark } = useTheme();

	const [selectedBgIndex, setSelectedBgIndex] = useState(0);
	const [isSharing, setIsSharing] = useState(false);
	const cardRef = useRef<View>(null);

	if (!visible || !bookmark) return null;

	const handleShare = async () => {
		setIsSharing(true);
		try {
			if (cardRef.current && Platform.OS !== 'web') {
				const uri = await captureRef(cardRef, {
					format: 'png',
					quality: 0.95,
					result: 'tmpfile',
				});
				await Share.share({
					url: uri,
					message: `"${bookmark.verseText}" — ${bookmark.bookName} ${bookmark.chapterNumber}:${bookmark.verseNumber}\nhttps://bibleunlock.app`,
				});
			} else {
				// Fallback to text share
				await Share.share({
					message: `"${bookmark.verseText}" — ${bookmark.bookName} ${bookmark.chapterNumber}:${bookmark.verseNumber}\nhttps://bibleunlock.app`,
				});
			}
			onClose();
		} catch (error: any) {
			if (error?.message !== 'User did not share') {
				// Fallback to plain text on image error
				try {
					await Share.share({
						message: `"${bookmark.verseText}" — ${bookmark.bookName} ${bookmark.chapterNumber}:${bookmark.verseNumber}\nhttps://bibleunlock.app`,
					});
					onClose();
				} catch {
					Alert.alert('Share Failed', 'Unable to generate share image.');
				}
			}
		} finally {
			setIsSharing(false);
		}
	};

	// Determine font size based on verse text length
	const verseLength = bookmark.verseText.length;
	const fontSize = verseLength > 180 ? 15 : verseLength > 120 ? 17 : 19;
	const lineHeight = fontSize * 1.5;

	return (
		<Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
			<Pressable
				onPress={onClose}
				style={{
					flex: 1,
					backgroundColor: 'rgba(0,0,0,0.7)',
					justifyContent: 'flex-end',
				}}
			>
				<Pressable
					onPress={(e) => e.stopPropagation()}
					style={{
						backgroundColor: colors.surfaceElevated || colors.surface,
						borderTopLeftRadius: 28,
						borderTopRightRadius: 28,
						borderWidth: 1,
						borderColor: colors.border,
						paddingBottom: Math.max(20, insets.bottom + 12),
						maxHeight: '92%',
					}}
				>
					{/* Drag Notch */}
					<View
						style={{
							width: 38,
							height: 4,
							borderRadius: 2,
							backgroundColor: colors.border,
							alignSelf: 'center',
							marginTop: 12,
							marginBottom: 16,
						}}
					/>

					<ScrollView
						contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
						showsVerticalScrollIndicator={false}
					>
						{/* Header */}
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: 16,
							}}
						>
							<View>
								<Text
									style={{
										fontSize: 10,
										fontFamily: 'Inter_700Bold',
										letterSpacing: 1.2,
										textTransform: 'uppercase',
										color: colors.accent,
										marginBottom: 2,
									}}
								>
									[ SACRED ART CARD ]
								</Text>
								<Text
									style={{
										fontSize: 20,
										fontFamily: 'EBGaramond_700Bold',
										color: colors.textPrimary,
									}}
								>
									Share Verse Card
								</Text>
							</View>

							<Pressable
								onPress={onClose}
								hitSlop={10}
								style={{
									width: 36,
									height: 36,
									borderRadius: 18,
									backgroundColor: colors.surfaceSubtle,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<X size={18} color={colors.textSecondary} />
							</Pressable>
						</View>

						{/* 4:5 Social Aspect Ratio Card (The Render Target) */}
						<View
							style={{
								alignSelf: 'center',
								width: 290,
								height: 362,
								borderRadius: 20,
								overflow: 'hidden',
								borderWidth: 1,
								borderColor: isDark ? '#2e3d34' : '#d2cbbf',
								shadowColor: '#000000',
								shadowOffset: { width: 0, height: 8 },
								shadowOpacity: 0.35,
								shadowRadius: 16,
								elevation: 10,
								marginBottom: 18,
							}}
						>
							<View
								ref={cardRef}
								collapsable={false}
								style={{
									width: 290,
									height: 362,
									backgroundColor: '#0a0f0c',
									position: 'relative',
								}}
							>
								{/* Background Artwork */}
								<Image
									source={SCROLL_BACKGROUNDS[selectedBgIndex] || SCROLL_BACKGROUNDS[0]}
									style={{
										width: '100%',
										height: '100%',
										position: 'absolute',
									}}
									resizeMode='cover'
								/>

								{/* Dark Gradient Overlay for Crisp Legibility */}
								<View
									style={{
										width: '100%',
										height: '100%',
										position: 'absolute',
										backgroundColor: 'rgba(8, 14, 11, 0.72)',
									}}
								/>

								{/* Card Content Stack */}
								<View
									style={{
										flex: 1,
										padding: 22,
										justifyContent: 'space-between',
									}}
								>
									{/* Top Badge */}
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<View
											style={{
												backgroundColor: 'rgba(245, 184, 0, 0.16)',
												paddingHorizontal: 8,
												paddingVertical: 3,
												borderRadius: 6,
												borderWidth: 1,
												borderColor: '#f5b800',
											}}
										>
											<Text
												style={{
													fontSize: 9,
													fontFamily: 'Inter_700Bold',
													color: '#f5b800',
													letterSpacing: 0.8,
													textTransform: 'uppercase',
												}}
											>
												[ SCRIPTURE MEMORY ]
											</Text>
										</View>
									</View>

									{/* Center Quote & Citation */}
									<View style={{ marginVertical: 12 }}>
										<Text
											style={{
												fontSize,
												lineHeight,
												fontFamily: 'EBGaramond_400Regular_Italic',
												color: '#ffffff',
												textAlign: 'center',
												marginBottom: 14,
												textShadowColor: 'rgba(0,0,0,0.85)',
												textShadowOffset: { width: 0, height: 1 },
												textShadowRadius: 4,
											}}
										>
											"{bookmark.verseText}"
										</Text>

										<Text
											style={{
												fontSize: 13,
												fontFamily: 'Inter_700Bold',
												color: '#f5b800',
												textAlign: 'center',
												letterSpacing: 0.5,
											}}
										>
											— {bookmark.bookName} {bookmark.chapterNumber}:{bookmark.verseNumber}
										</Text>
									</View>

									{/* Godin Understated Attribution */}
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'center',
											paddingTop: 8,
											borderTopWidth: 1,
											borderTopColor: 'rgba(255, 255, 255, 0.14)',
										}}
									>
										<Text
											style={{
												fontSize: 9,
												fontFamily: 'Inter_600SemiBold',
												letterSpacing: 1.2,
												color: 'rgba(255, 255, 255, 0.65)',
												textTransform: 'uppercase',
											}}
										>
											BIBLE UNLOCK • BIBLEUNLOCK.APP
										</Text>
									</View>
								</View>
							</View>
						</View>

						{/* Artwork Background Selector */}
						<Text
							style={{
								fontSize: 12,
								fontFamily: 'Inter_600SemiBold',
								color: colors.textSecondary,
								marginBottom: 10,
								textTransform: 'uppercase',
								letterSpacing: 0.5,
							}}
						>
							Choose Sacred Background
						</Text>

						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ gap: 10, paddingBottom: 18 }}
						>
							{SCROLL_BACKGROUNDS.slice(0, 6).map((bg, idx) => {
								const isSelected = selectedBgIndex === idx;
								return (
									<Pressable
										key={idx}
										onPress={() => setSelectedBgIndex(idx)}
										style={{
											width: 48,
											height: 48,
											borderRadius: 12,
											overflow: 'hidden',
											borderWidth: 2,
											borderColor: isSelected ? colors.accent : colors.border,
										}}
									>
										<Image source={bg} style={{ width: '100%', height: '100%' }} resizeMode='cover' />
									</Pressable>
								);
							})}
						</ScrollView>

						{/* Action Buttons */}
						<View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
							<Pressable
								onPress={onClose}
								style={{
									flex: 1,
									paddingVertical: 14,
									borderRadius: 14,
									backgroundColor: colors.surfaceSubtle,
									alignItems: 'center',
									justifyContent: 'center',
									minHeight: 48,
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
								onPress={handleShare}
								disabled={isSharing}
								style={{
									flex: 1.6,
									paddingVertical: 14,
									borderRadius: 14,
									backgroundColor: colors.accent,
									alignItems: 'center',
									justifyContent: 'center',
									minHeight: 48,
									flexDirection: 'row',
									gap: 8,
								}}
							>
								{isSharing ? (
									<ActivityIndicator size='small' color={colors.accentText || '#000000'} />
								) : (
									<>
										<Share2 size={16} color={colors.accentText || '#000000'} />
										<Text
											style={{
												fontSize: 14,
												fontFamily: 'Inter_700Bold',
												color: colors.accentText || '#000000',
											}}
										>
											Share Sacred Card
										</Text>
									</>
								)}
							</Pressable>
						</View>
					</ScrollView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
