import React, { useState } from 'react';
import {
	View,
	Text,
	Modal,
	Pressable,
	TextInput,
	Alert,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from 'react-native';
import {
	DownloadCloud,
	Download,
	X,
	CheckCircle,
	Share2,
	FileText,
	Upload,
	FolderOpen,
} from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { Button } from '../Button';
import {
	shareBackup,
	downloadBackupFile,
	pickAndReadBackupFile,
	importBackupJSON,
} from '../../lib/backup';

interface DataBackupModalProps {
	visible: boolean;
	onClose: () => void;
	onRestoreSuccess: () => void;
}

export function DataBackupModal({ visible, onClose, onRestoreSuccess }: DataBackupModalProps) {
	const { colors } = useTheme();
	const [tab, setTab] = useState<'export' | 'import'>('export');
	const [importText, setImportText] = useState('');
	const [isDownloading, setIsDownloading] = useState(false);
	const [isSharing, setIsSharing] = useState(false);
	const [isPickingFile, setIsPickingFile] = useState(false);

	const handleDownload = async () => {
		setIsDownloading(true);
		const res = await downloadBackupFile();
		setIsDownloading(false);
		if (res.success && res.fileName) {
			Alert.alert(
				'Backup Saved',
				`Your backup has been saved successfully:\n\n📄 ${res.fileName}\n\nStored in your device download folder with timestamp.`,
			);
		} else if (!res.cancelled && res.error) {
			Alert.alert('Download Error', res.error);
		}
	};

	const handleShare = async () => {
		setIsSharing(true);
		const shared = await shareBackup();
		setIsSharing(false);
		if (shared) {
			Alert.alert(
				'Backup Shared',
				'Your Bible Unlock backup JSON has been shared. Store it in a safe place or notes app.',
			);
		}
	};

	const executeImport = (rawJson: string) => {
		const res = importBackupJSON(rawJson.trim());
		if (res.success && res.stats) {
			Alert.alert(
				'Restore Successful',
				`Successfully restored:\n• ${res.stats.bookmarks} Bookmarks\n• ${res.stats.collections} Collections\n• ${res.stats.historyDays} Active Streak Records`,
				[
					{
						text: 'Done',
						onPress: () => {
							setImportText('');
							onRestoreSuccess();
							onClose();
						},
					},
				],
			);
		} else {
			Alert.alert('Restore Failed', res.error || 'Invalid backup data format.');
		}
	};

	const handlePickFile = async () => {
		setIsPickingFile(true);
		const res = await pickAndReadBackupFile();
		setIsPickingFile(false);

		if (res.cancelled) return;
		if (!res.success || !res.content) {
			Alert.alert('File Error', res.error || 'Failed to read selected file.');
			return;
		}

		setImportText(res.content);

		Alert.alert(
			'Restore from File',
			`Selected: ${res.fileName || 'backup.json'}\n\nDo you want to restore your bookmarks, collections, streak history, and daily goals from this backup file?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Restore Now',
					style: 'destructive',
					onPress: () => {
						executeImport(res.content!);
					},
				},
			],
		);
	};

	const handleImport = () => {
		if (!importText.trim()) {
			Alert.alert('Empty Input', 'Please paste your valid Bible Unlock backup JSON text.');
			return;
		}

		Alert.alert(
			'Restore Local Data',
			'This will restore your saved bookmarks, collections, habit streak history, and daily goals from the backup.\n\nCurrent local data will be updated.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Restore Now',
					style: 'destructive',
					onPress: () => {
						executeImport(importText.trim());
					},
				},
			],
		);
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType='fade'
			statusBarTranslucent
			onRequestClose={onClose}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.75)',
						justifyContent: 'center',
						alignItems: 'center',
						padding: 20,
					}}
				>
					<Pressable
						style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
						onPress={onClose}
					/>
					<View
						style={{
							width: '100%',
							maxWidth: 420,
							maxHeight: '88%',
							backgroundColor: colors.surface,
							borderColor: colors.borderSubtle,
							borderWidth: 1,
							borderRadius: 20,
							padding: 20,
							elevation: 8,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 6 },
							shadowOpacity: 0.3,
							shadowRadius: 12,
						}}
					>
						{/* Header */}
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: 14,
							}}
						>
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
								<View
									style={{
										width: 36,
										height: 36,
										borderRadius: 10,
										backgroundColor: colors.accentBg,
										alignItems: 'center',
										justifyContent: 'center',
										borderWidth: 1,
										borderColor: colors.accent,
									}}
								>
									<DownloadCloud size={20} color={colors.accent} />
								</View>
								<View>
									<Text
										style={{
											fontSize: 10,
											fontFamily: 'Inter_700Bold',
											letterSpacing: 1,
											color: colors.accent,
											textTransform: 'uppercase',
										}}
									>
										[ OFFLINE DATA VAULT ]
									</Text>
									<Text
										style={{
											fontSize: 16,
											fontFamily: 'Inter_700Bold',
											color: colors.textPrimary,
										}}
									>
										Backup & Portability
									</Text>
								</View>
							</View>
							<Pressable
								onPress={onClose}
								hitSlop={12}
								accessibilityRole='button'
								accessibilityLabel='Close dialog'
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

						{/* Segmented Control */}
						<View
							style={{
								flexDirection: 'row',
								backgroundColor: colors.surfaceSubtle,
								borderRadius: 12,
								padding: 4,
								marginBottom: 16,
								borderWidth: 1,
								borderColor: colors.borderSubtle,
							}}
						>
							<Pressable
								onPress={() => setTab('export')}
								accessibilityRole='button'
								accessibilityLabel='Export Backup tab'
								style={{
									flex: 1,
									paddingVertical: 9,
									alignItems: 'center',
									borderRadius: 8,
									backgroundColor: tab === 'export' ? colors.accent : 'transparent',
								}}
							>
								<Text
									style={{
										fontSize: 12,
										fontFamily: 'Inter_700Bold',
										letterSpacing: 0.5,
										color: tab === 'export' ? '#141413' : colors.textSecondary,
									}}
								>
									EXPORT BACKUP
								</Text>
							</Pressable>
							<Pressable
								onPress={() => setTab('import')}
								accessibilityRole='button'
								accessibilityLabel='Restore Data tab'
								style={{
									flex: 1,
									paddingVertical: 9,
									alignItems: 'center',
									borderRadius: 8,
									backgroundColor: tab === 'import' ? colors.accent : 'transparent',
								}}
							>
								<Text
									style={{
										fontSize: 12,
										fontFamily: 'Inter_700Bold',
										letterSpacing: 0.5,
										color: tab === 'import' ? '#141413' : colors.textSecondary,
									}}
								>
									RESTORE DATA
								</Text>
							</Pressable>
						</View>

						<ScrollView showsVerticalScrollIndicator={false}>
							{tab === 'export' ? (
								<View>
									<Text
										style={{
											fontSize: 13,
											color: colors.textSecondary,
											lineHeight: 19,
											marginBottom: 14,
										}}
									>
										Save a private copy of your Scripture journey. Exporting bundles your reading
										streaks, custom verse collections, bookmarks, notes, and goals into a standard
										JSON file with timestamp.
									</Text>

									<View
										style={{
											backgroundColor: colors.background,
											borderRadius: 12,
											padding: 12,
											borderWidth: 1,
											borderColor: colors.borderSubtle,
											marginBottom: 16,
											gap: 8,
										}}
									>
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
											<CheckCircle size={15} color={colors.accent} />
											<Text
												style={{
													fontSize: 12,
													color: colors.textPrimary,
													fontFamily: 'Inter_500Medium',
												}}
											>
												100% Offline & Private (no cloud tracking)
											</Text>
										</View>
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
											<CheckCircle size={15} color={colors.accent} />
											<Text
												style={{
													fontSize: 12,
													color: colors.textPrimary,
													fontFamily: 'Inter_500Medium',
												}}
											>
												Timestamped JSON file for safe storage or transfers
											</Text>
										</View>
									</View>

									{/* Action Button 1: Download to Device Folder */}
									<Button
										title={isDownloading ? 'Saving to Device...' : 'Download Backup File (.json)'}
										variant='primary'
										size='md'
										onPress={handleDownload}
										disabled={isDownloading || isSharing}
										style={{ width: '100%', marginBottom: 10 }}
									/>

									{/* Action Button 2: Share via Native Sheet */}
									<Button
										title={isSharing ? 'Sharing...' : 'Share via Apps (Drive / Notes / WhatsApp)'}
										variant='outline'
										size='md'
										onPress={handleShare}
										disabled={isDownloading || isSharing}
										style={{ width: '100%', marginBottom: 6 }}
									/>
								</View>
							) : (
								<View>
									<Text
										style={{
											fontSize: 13,
											color: colors.textSecondary,
											lineHeight: 19,
											marginBottom: 14,
										}}
									>
										Restore your Scripture bookmarks, collections, habit streak history, and daily
										goals from an exported JSON backup file or raw text.
									</Text>

									{/* File Picker Action Card */}
									<View
										style={{
											backgroundColor: colors.background,
											borderRadius: 14,
											padding: 14,
											borderWidth: 1,
											borderColor: colors.borderSubtle,
											marginBottom: 12,
										}}
									>
										<View
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												gap: 10,
												marginBottom: 12,
											}}
										>
											<View
												style={{
													width: 32,
													height: 32,
													borderRadius: 8,
													backgroundColor: colors.accentBg,
													alignItems: 'center',
													justifyContent: 'center',
													borderWidth: 1,
													borderColor: colors.accent,
												}}
											>
												<FolderOpen size={16} color={colors.accent} />
											</View>
											<View style={{ flex: 1 }}>
												<Text
													style={{
														fontSize: 13,
														fontFamily: 'Inter_700Bold',
														color: colors.textPrimary,
													}}
												>
													Select Backup File (.json)
												</Text>
												<Text
													style={{
														fontSize: 11,
														fontFamily: 'Inter_400Regular',
														color: colors.textSecondary,
														marginTop: 1,
													}}
												>
													Load a file stored in Downloads or Google Drive
												</Text>
											</View>
										</View>

										<Button
											title={isPickingFile ? 'Opening File...' : 'Choose File from Device'}
											variant='primary'
											size='md'
											loading={isPickingFile}
											onPress={handlePickFile}
											disabled={isPickingFile}
											style={{ width: '100%' }}
										/>
									</View>

									{/* Divider */}
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											marginVertical: 10,
											gap: 10,
										}}
									>
										<View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
										<Text
											style={{
												fontSize: 10,
												fontFamily: 'Inter_700Bold',
												letterSpacing: 0.8,
												color: colors.textMuted,
												textTransform: 'uppercase',
											}}
										>
											OR PASTE RAW JSON
										</Text>
										<View style={{ flex: 1, height: 1, backgroundColor: colors.borderSubtle }} />
									</View>

									<TextInput
										value={importText}
										onChangeText={setImportText}
										multiline
										numberOfLines={4}
										placeholder='Paste JSON backup text here...'
										placeholderTextColor={colors.textMuted}
										style={{
											width: '100%',
											height: 90,
											backgroundColor: colors.background,
											borderRadius: 12,
											padding: 12,
											borderWidth: 1,
											borderColor: colors.borderSubtle,
											color: colors.textPrimary,
											fontFamily: 'Inter_400Regular',
											fontSize: 12,
											textAlignVertical: 'top',
											marginBottom: 10,
										}}
									/>

									<Button
										title='Validate & Restore Pasted Text'
										variant='outline'
										size='md'
										onPress={handleImport}
										disabled={isPickingFile || !importText.trim()}
										style={{ width: '100%', marginBottom: 6 }}
									/>
								</View>
							)}
						</ScrollView>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
