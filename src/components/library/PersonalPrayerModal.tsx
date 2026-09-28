import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	Modal,
	Pressable,
	TextInput,
	Alert,
	Platform,
	ScrollView,
	Keyboard,
	useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkles, Trash2, Check, HeartHandshake } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import {
	UserPrayer,
	saveUserPrayer,
	deleteUserPrayer,
	markPrayerAnswered,
	formatRelativeTime,
} from '../../lib/mmkv';

export interface PersonalPrayerModalProps {
	visible: boolean;
	mode: 'create' | 'edit' | 'mark_answered';
	prayer?: UserPrayer | null;
	onClose: () => void;
	onSaved: () => void;
}

export function PersonalPrayerModal({
	visible,
	mode,
	prayer,
	onClose,
	onSaved,
}: PersonalPrayerModalProps) {
	const insets = useSafeAreaInsets();
	const { height: windowHeight } = useWindowDimensions();
	const { colors, isDark } = useTheme();

	const [title, setTitle] = useState('');
	const [request, setRequest] = useState('');
	const [reflection, setReflection] = useState('');
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	// On Android edge-to-edge / statusBarTranslucent dialogs, lifting by keyboardHeight + navBarInset
	// places the bottom sheet flush on top of the keyboard.
	const navBarInset = Platform.OS === 'android' ? Math.max(insets.bottom, 48) : insets.bottom;
	const effectiveKeyboardOffset = keyboardHeight > 0 ? keyboardHeight + navBarInset : 0;

	useEffect(() => {
		if (!visible) {
			setKeyboardHeight(0);
			return;
		}
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
	}, [visible]);

	useEffect(() => {
		if (visible) {
			if (prayer && (mode === 'edit' || mode === 'mark_answered')) {
				setTitle(prayer.title || '');
				setRequest(prayer.request || '');
				setReflection(prayer.answerReflection || '');
			} else {
				setTitle('');
				setRequest('');
				setReflection('');
			}
		}
	}, [visible, prayer, mode]);

	const handleSave = () => {
		if (mode === 'mark_answered') {
			if (!prayer) return;
			markPrayerAnswered(prayer.id, reflection.trim());
			onSaved();
			onClose();
			return;
		}

		const trimmedTitle = title.trim();
		const trimmedRequest = request.trim();

		if (!trimmedTitle) {
			Alert.alert('Title Required', 'Please enter a title for your prayer petition.');
			return;
		}

		if (!trimmedRequest) {
			Alert.alert('Request Required', 'Please write your prayer notes or petition.');
			return;
		}

		const prayerToSave: UserPrayer = {
			id: prayer && mode === 'edit' ? prayer.id : `prayer_${Date.now()}`,
			title: trimmedTitle,
			request: trimmedRequest,
			createdAt: prayer && mode === 'edit' ? prayer.createdAt : Date.now(),
			isAnswered: prayer ? prayer.isAnswered : false,
			answeredAt: prayer ? prayer.answeredAt : undefined,
			answerReflection: prayer ? prayer.answerReflection : undefined,
		};

		saveUserPrayer(prayerToSave);
		onSaved();
		onClose();
	};

	const handleDelete = () => {
		if (!prayer) return;
		Alert.alert(
			'Delete Prayer',
			`Are you sure you want to remove "${prayer.title}" from your prayer journal?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						deleteUserPrayer(prayer.id);
						onSaved();
						onClose();
					},
				},
			],
		);
	};

	if (!visible) return null;

	const isAnsweredMode = mode === 'mark_answered';

	return (
		<Modal
			visible={visible}
			transparent
			animationType='slide'
			statusBarTranslucent
			onRequestClose={() => {
				if (keyboardHeight > 0) {
					Keyboard.dismiss();
				} else {
					onClose();
				}
			}}
		>
			<View
				style={{
					flex: 1,
					backgroundColor: 'rgba(0,0,0,0.65)',
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
							onClose();
						}
					}}
				/>
				<View
					style={{
						backgroundColor: colors.surfaceElevated || colors.surface,
						borderTopLeftRadius: 28,
						borderTopRightRadius: 28,
						borderWidth: 1,
						borderColor: isAnsweredMode ? colors.accent : colors.border,
						maxHeight:
							effectiveKeyboardOffset > 0
								? Math.max(windowHeight - effectiveKeyboardOffset - insets.top - 16, 260)
								: '88%',
						flexDirection: 'column',
						paddingBottom: Math.max(16, insets.bottom),
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
						contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
						keyboardShouldPersistTaps='handled'
						showsVerticalScrollIndicator={false}
					>
							{/* Header Title & Tag */}
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: 16,
								}}
							>
								<View style={{ flex: 1, marginRight: 12 }}>
									<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
										<View
											style={{
												backgroundColor: colors.accentBg,
												paddingHorizontal: 6,
												paddingVertical: 2,
												borderRadius: 4,
												borderWidth: 1,
												borderColor: colors.accent,
												marginRight: 6,
											}}
										>
											<Text
												style={{
													fontSize: 9,
													fontFamily: 'Inter_700Bold',
													color: colors.accent,
													letterSpacing: 0.5,
													textTransform: 'uppercase',
												}}
											>
												{isAnsweredMode ? '[ PRAISE & TESTIMONY ]' : '[ PRAYER PETITION ]'}
											</Text>
										</View>
									</View>

									<Text
										style={{
											fontSize: 20,
											fontFamily: 'EBGaramond_700Bold',
											color: colors.textPrimary,
										}}
									>
										{isAnsweredMode
											? 'Celebrate Answered Prayer'
											: mode === 'edit'
											? 'Edit Prayer Request'
											: 'New Prayer Request'}
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

							{/* Answered Mode Context Card */}
							{isAnsweredMode && prayer && (
								<View
									style={{
										backgroundColor: isDark ? '#1a2318' : '#f4f9f2',
										borderWidth: 1,
										borderColor: isDark ? '#2e452c' : '#cde4cb',
										borderRadius: 14,
										padding: 14,
										marginBottom: 16,
									}}
								>
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between',
											marginBottom: 6,
										}}
									>
										<Text
											style={{
												fontSize: 15,
												fontFamily: 'Inter_600SemiBold',
												color: colors.textPrimary,
											}}
										>
											{prayer.title}
										</Text>
										<Text
											style={{
												fontSize: 11,
												fontFamily: 'Inter_400Regular',
												color: colors.textMuted,
											}}
										>
											Started {formatRelativeTime(prayer.createdAt)}
										</Text>
									</View>
									<Text
										style={{
											fontSize: 13,
											fontFamily: 'Inter_400Regular',
											color: colors.textSecondary,
											lineHeight: 18,
										}}
									>
										"{prayer.request}"
									</Text>
								</View>
							)}

							{/* Standard Form Inputs (Create / Edit) */}
							{!isAnsweredMode && (
								<>
									<Text
										style={{
											fontSize: 12,
											fontFamily: 'Inter_600SemiBold',
											color: colors.textSecondary,
											marginBottom: 6,
											textTransform: 'uppercase',
											letterSpacing: 0.5,
										}}
									>
										Title
									</Text>
									<TextInput
										value={title}
										onChangeText={setTitle}
										placeholder='e.g., Guidance in career, Peace for Sarah'
										placeholderTextColor={colors.textMuted}
										maxLength={50}
										style={{
											borderRadius: 12,
											borderWidth: 1,
											borderColor: colors.border,
											backgroundColor: colors.surface,
											color: colors.textPrimary,
											fontSize: 15,
											fontFamily: 'Inter_500Medium',
											paddingHorizontal: 14,
											paddingVertical: 12,
											marginBottom: 16,
										}}
									/>

									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between',
											marginBottom: 6,
										}}
									>
										<Text
											style={{
												fontSize: 12,
												fontFamily: 'Inter_600SemiBold',
												color: colors.textSecondary,
												textTransform: 'uppercase',
												letterSpacing: 0.5,
											}}
										>
											Petition & Scripture Anchors
										</Text>
										<Text style={{ fontSize: 11, color: colors.textMuted }}>
											{request.length}/500
										</Text>
									</View>
									<TextInput
										value={request}
										onChangeText={setRequest}
										placeholder='Pour out your heart, include verses, or describe the specific situation...'
										placeholderTextColor={colors.textMuted}
										maxLength={500}
										multiline
										numberOfLines={5}
										style={{
											borderRadius: 12,
											borderWidth: 1,
											borderColor: colors.border,
											backgroundColor: colors.surface,
											color: colors.textPrimary,
											fontSize: 14,
											fontFamily: 'Inter_400Regular',
											paddingHorizontal: 14,
											paddingVertical: 12,
											minHeight: 110,
											textAlignVertical: 'top',
											marginBottom: 20,
										}}
									/>
								</>
							)}

							{/* Answered Mode Testimony Input (Sutherland Psycho-Logic) */}
							{isAnsweredMode && (
								<>
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between',
											marginBottom: 6,
										}}
									>
										<Text
											style={{
												fontSize: 12,
												fontFamily: 'Inter_600SemiBold',
												color: colors.accent,
												textTransform: 'uppercase',
												letterSpacing: 0.5,
											}}
										>
											How Did God Answer? (Praise Testimony)
										</Text>
										<Text style={{ fontSize: 11, color: colors.textMuted }}>
											{reflection.length}/300
										</Text>
									</View>
									<TextInput
										value={reflection}
										onChangeText={setReflection}
										placeholder='Describe how the Lord provided, comforted, or answered this prayer...'
										placeholderTextColor={colors.textMuted}
										maxLength={300}
										multiline
										numberOfLines={4}
										autoFocus
										style={{
											borderRadius: 12,
											borderWidth: 1,
											borderColor: colors.accent,
											backgroundColor: colors.surface,
											color: colors.textPrimary,
											fontSize: 14,
											fontFamily: 'Inter_400Regular',
											paddingHorizontal: 14,
											paddingVertical: 12,
											minHeight: 95,
											textAlignVertical: 'top',
											marginBottom: 20,
										}}
									/>
								</>
							)}

							{/* Delete Prayer Button (when editing) */}
							{mode === 'edit' && (
								<Pressable
									onPress={handleDelete}
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: 20,
										paddingVertical: 6,
									}}
								>
									<Trash2 size={16} color={colors.danger} style={{ marginRight: 8 }} />
									<Text
										style={{
											fontSize: 13,
											fontFamily: 'Inter_500Medium',
											color: colors.danger,
										}}
									>
										Delete Prayer Petition
									</Text>
								</Pressable>
							)}

							{/* Action Footer Buttons */}
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
									onPress={handleSave}
									style={{
										flex: 1.5,
										paddingVertical: 14,
										borderRadius: 14,
										backgroundColor: colors.accent,
										alignItems: 'center',
										justifyContent: 'center',
										minHeight: 48,
										flexDirection: 'row',
										gap: 6,
									}}
								>
									{isAnsweredMode ? (
										<Sparkles size={16} color={colors.accentText || '#000000'} />
									) : (
										<Check size={16} color={colors.accentText || '#000000'} strokeWidth={2.5} />
									)}
									<Text
										style={{
											fontSize: 14,
											fontFamily: 'Inter_700Bold',
											color: colors.accentText || '#000000',
										}}
									>
										{isAnsweredMode
											? 'Record Testimony ✨'
											: mode === 'edit'
											? 'Update Petition'
											: 'Save Petition'}
									</Text>
								</Pressable>
							</View>
						</ScrollView>
					</View>
				</View>
		</Modal>
	);
}
