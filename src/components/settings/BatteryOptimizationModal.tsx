import React from 'react';
import {
	View,
	Text,
	Modal,
	Pressable,
	ScrollView,
	Linking,
} from 'react-native';
import { ShieldCheck, BatteryCharging, X, ExternalLink } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { Button } from '../Button';

interface BatteryOptimizationModalProps {
	visible: boolean;
	onClose: () => void;
}

export function BatteryOptimizationModal({ visible, onClose }: BatteryOptimizationModalProps) {
	const { colors, isDark } = useTheme();

	const handleOpenBatterySettings = async () => {
		try {
			await Linking.openSettings();
		} catch (e) {
			console.warn('[BatteryModal] Failed to open system settings:', e);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType='fade'
			statusBarTranslucent
			onRequestClose={onClose}
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
						maxWidth: 400,
						maxHeight: '85%',
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
							marginBottom: 12,
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
								<BatteryCharging size={20} color={colors.accent} />
							</View>
							<View>
								<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
									<Text
										style={{
											fontSize: 10,
											fontFamily: 'Inter_700Bold',
											letterSpacing: 1,
											color: colors.accent,
											textTransform: 'uppercase',
										}}
									>
										[ SHIELD RELIABILITY ]
									</Text>
								</View>
								<Text
									style={{
										fontSize: 16,
										fontFamily: 'Inter_700Bold',
										color: colors.textPrimary,
									}}
								>
									Keep Shield Active
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

					<ScrollView showsVerticalScrollIndicator={false}>
						<Text
							style={{
								fontSize: 13,
								color: colors.textSecondary,
								lineHeight: 19,
								marginBottom: 14,
							}}
						>
							Phone manufacturers (Samsung OneUI, Xiaomi MIUI, Pixel, Oppo) aggressively sleep
							background apps to conserve battery, which can terminate Bible Unlock's accessibility
							shield.
						</Text>

						{/* Instruction Steps */}
						<View
							style={{
								backgroundColor: colors.background,
								borderRadius: 12,
								padding: 14,
								borderWidth: 1,
								borderColor: colors.borderSubtle,
								marginBottom: 14,
								gap: 12,
							}}
						>
							<View style={{ flexDirection: 'row', gap: 10 }}>
								<View
									style={{
										width: 22,
										height: 22,
										borderRadius: 6,
										backgroundColor: colors.surfaceSubtle,
										alignItems: 'center',
										justifyContent: 'center',
										borderWidth: 1,
										borderColor: colors.borderSubtle,
									}}
								>
									<Text
										style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.accent }}
									>
										1
									</Text>
								</View>
								<Text
									style={{ fontSize: 13, color: colors.textPrimary, flex: 1, lineHeight: 18 }}
								>
									Tap <Text style={{ fontFamily: 'Inter_700Bold' }}>"Open App Settings"</Text>{' '}
									below to access system app details.
								</Text>
							</View>

							<View style={{ flexDirection: 'row', gap: 10 }}>
								<View
									style={{
										width: 22,
										height: 22,
										borderRadius: 6,
										backgroundColor: colors.surfaceSubtle,
										alignItems: 'center',
										justifyContent: 'center',
										borderWidth: 1,
										borderColor: colors.borderSubtle,
									}}
								>
									<Text
										style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.accent }}
									>
										2
									</Text>
								</View>
								<Text
									style={{ fontSize: 13, color: colors.textPrimary, flex: 1, lineHeight: 18 }}
								>
									Tap on <Text style={{ fontFamily: 'Inter_700Bold' }}>"Battery"</Text> or{' '}
									<Text style={{ fontFamily: 'Inter_700Bold' }}>"App Battery Usage"</Text>.
								</Text>
							</View>

							<View style={{ flexDirection: 'row', gap: 10 }}>
								<View
									style={{
										width: 22,
										height: 22,
										borderRadius: 6,
										backgroundColor: colors.surfaceSubtle,
										alignItems: 'center',
										justifyContent: 'center',
										borderWidth: 1,
										borderColor: colors.borderSubtle,
									}}
								>
									<Text
										style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.accent }}
									>
										3
									</Text>
								</View>
								<Text
									style={{ fontSize: 13, color: colors.textPrimary, flex: 1, lineHeight: 18 }}
								>
									Choose{' '}
									<Text style={{ fontFamily: 'Inter_700Bold', color: colors.accent }}>
										"Unrestricted"
									</Text>{' '}
									or{' '}
									<Text style={{ fontFamily: 'Inter_700Bold', color: colors.accent }}>
										"Don't Optimize"
									</Text>
									.
								</Text>
							</View>
						</View>

						{/* Guarantee Banner */}
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: 'rgba(16, 185, 129, 0.12)',
								padding: 10,
								borderRadius: 10,
								marginBottom: 16,
								borderWidth: 1,
								borderColor: 'rgba(16, 185, 129, 0.25)',
								gap: 8,
							}}
						>
							<ShieldCheck size={16} color='#10b981' />
							<Text
								style={{
									fontSize: 11,
									color: '#10b981',
									fontFamily: 'Inter_600SemiBold',
									flex: 1,
									lineHeight: 16,
								}}
							>
								Guarantees 100% reliable distraction blocking with negligible battery drain.
							</Text>
						</View>
					</ScrollView>

					{/* Action Buttons */}
					<View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
						<Button
							title='Close'
							variant='ghost'
							size='md'
							onPress={onClose}
							style={{ flex: 1 }}
						/>
						<Button
							title='Open App Settings'
							variant='primary'
							size='md'
							onPress={handleOpenBatterySettings}
							style={{ flex: 1.5 }}
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
}
