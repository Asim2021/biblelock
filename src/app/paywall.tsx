import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Image, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { usePurchases, isRevenueCatConfigured } from '../lib/purchases';
import { useTheme } from '../lib/themeContext';
import { getStreak, getUserName } from '../lib/mmkv';
import { SCROLL_BACKGROUNDS } from '../../assets/scroll-backgrounds';
import {
	X,
	Check,
	ShieldCheck,
	Flame,
	Clock,
	Zap,
	BarChart3,
	Bookmark,
	Sparkles,
	Heart,
	Share2,
	Type,
	Lock,
	CheckCircle2,
} from 'lucide-react-native';

interface FeatureComparison {
	icon: any;
	title: string;
	code: string;
	covenant: string;
	sanctuary: string;
}

const FEATURES: FeatureComparison[] = [
	{
		icon: ShieldCheck,
		title: 'Silence every app that steals your time',
		code: 'MOD-01',
		covenant: '5 Presets only',
		sanctuary: 'Unlimited custom apps',
	},
	{
		icon: Sparkles,
		title: 'Mood-guided verses when you need them most',
		code: 'MOD-02',
		covenant: 'Preview mode',
		sanctuary: '336 sacred mood verses & art',
	},
	{
		icon: Flame,
		title: 'Grace days: rest without losing your streak',
		code: 'MOD-03',
		covenant: 'None',
		sanctuary: '1 Grace Day / month',
	},
	{
		icon: Clock,
		title: 'Set your own pace (1-120 minutes)',
		code: 'MOD-04',
		covenant: '5m, 10m, 15m presets',
		sanctuary: '30m & custom (1–120m)',
	},
	{
		icon: Bookmark,
		title: 'Save and organize every verse that speaks to you',
		code: 'MOD-05',
		covenant: '1 list • 5 bookmarks',
		sanctuary: 'Unlimited lists & notes',
	},
	{
		icon: Zap,
		title: 'Scripture throughout your day (up to 24x)',
		code: 'MOD-06',
		covenant: '1 reminder • 6 verses/day',
		sanctuary: 'Multi-hour • 24 verses/day',
	},
	{
		icon: BarChart3,
		title: 'See your growth: 30-day reading heatmap',
		code: 'MOD-07',
		covenant: '7-day week view',
		sanctuary: '30-day heatmap & telemetry',
	},
	{
		icon: Heart,
		title: 'Complete prayer library (27+ liturgies)',
		code: 'MOD-08',
		covenant: 'Daily & Foundations (16)',
		sanctuary: 'Full Traditional Liturgy (27+)',
	},
];

export default function PaywallScreen() {
	const router = useRouter();
	const { colors, isDark } = useTheme();
	const { offerings, purchasePackage, restorePurchases, isLoading } = usePurchases();
	const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>('annual');
	const [isProcessing, setIsProcessing] = useState(false);

	const streak = getStreak().currentStreak;
	const userName = getUserName();

	let subtitle = "You told yourself you'd read your Bible today. This keeps that promise.";
	if (streak >= 7) {
		subtitle = `${streak}-day streak active, ${userName}. Sanctuary protects your progress with zero interruptions.`;
	} else if (streak >= 3) {
		subtitle = `You've chosen Scripture over scrolling for ${streak} consecutive days. Strengthen the foundation.`;
	}

	const currentPackages = offerings?.current?.availablePackages || [];
	const annualPkg =
		offerings?.current?.annual ||
		currentPackages.find(
			(p) => p.identifier.toLowerCase().includes('annual') || (p.packageType as string) === 'ANNUAL',
		);
	const monthlyPkg =
		offerings?.current?.monthly ||
		currentPackages.find(
			(p) => p.identifier.toLowerCase().includes('monthly') || (p.packageType as string) === 'MONTHLY',
		);
	const lifetimePkg =
		offerings?.current?.lifetime ||
		currentPackages.find(
			(p) => p.identifier.toLowerCase().includes('lifetime') || (p.packageType as string) === 'LIFETIME',
		);

	const annualPrice = annualPkg?.product?.priceString || '$29.99';
	const monthlyPrice = monthlyPkg?.product?.priceString || '$4.99';
	const lifetimePrice = lifetimePkg?.product?.priceString || '$119.99';

	const handleSubscribe = async () => {
		setIsProcessing(true);
		let targetPackage = null;
		if (selectedPlan === 'annual') targetPackage = annualPkg;
		else if (selectedPlan === 'monthly') targetPackage = monthlyPkg;
		else if (selectedPlan === 'lifetime') targetPackage = lifetimePkg;
		if (!targetPackage && currentPackages.length > 0) targetPackage = currentPackages[0];

		let success = false;
		if (targetPackage) {
			success = await purchasePackage(targetPackage);
		} else {
			if (__DEV__ || !isRevenueCatConfigured()) {
				success = await purchasePackage({ identifier: selectedPlan } as any);
			} else {
				Alert.alert(
					'Product Unavailable',
					'Unable to connect to store products. Please check your internet connection or try again shortly.',
				);
			}
		}

		setIsProcessing(false);
		if (success) {
			Alert.alert('Sanctuary Access Granted 🙏', 'All premium disciplines and tools have been unlocked.', [
				{ text: 'Enter Sanctuary', onPress: () => router.back() },
			]);
		}
	};

	const handleRestore = async () => {
		setIsProcessing(true);
		const restored = await restorePurchases();
		setIsProcessing(false);
		if (restored) {
			Alert.alert('Purchases Restored', 'Your previous subscription has been restored.', [
				{ text: 'OK', onPress: () => router.back() },
			]);
		} else {
			Alert.alert('Restore Purchases', 'No active subscription found for this Apple or Google Play account.');
		}
	};

	const openLink = async (url: string) => {
		try {
			await Linking.openURL(url);
		} catch (e) {
			Alert.alert('Unable to Open Link', `Please visit: ${url}`);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			{/* Top Telemetry Header Bar */}
			<View
				style={{
					borderBottomColor: colors.border,
					borderBottomWidth: 1,
					backgroundColor: colors.surface,
				}}
				className='px-5 py-3 flex-row justify-between items-center'
			>
				<View className='flex-row items-center'>
					<View
						style={{
							backgroundColor: colors.accent,
							width: 6,
							height: 6,
							borderRadius: 3,
							marginRight: 8,
						}}
					/>
					<Text
						style={{ color: colors.textSecondary }}
						className='text-[10px] font-sans-bold uppercase tracking-widest'
					>
						YOUR DAILY SHIELD
					</Text>
				</View>

				<Pressable
					onPress={() => router.back()}
					hitSlop={12}
					style={{
						backgroundColor: colors.surfaceElevated,
						borderColor: colors.border,
						borderWidth: 1,
					}}
					className='w-8 h-8 items-center justify-center rounded-lg active:opacity-70'
				>
					<X size={15} color={colors.textPrimary} />
				</Pressable>
			</View>

			<ScrollView
				className='flex-1 px-5'
				contentContainerStyle={{ paddingBottom: 48 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Hero Architectural Header */}
				<View className='items-center mt-5 mb-5'>
					<View
						style={{
							backgroundColor: colors.accentBg,
							borderColor: colors.accent,
							borderWidth: 1.5,
							shadowColor: colors.accent,
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: isDark ? 0.35 : 0.15,
							shadowRadius: 10,
							elevation: 4,
						}}
						className='w-16 h-16 rounded-2xl items-center justify-center mb-3 p-1'
					>
						<Image
							source={require('../../assets/images/icon.png')}
							style={{ width: '100%', height: '100%', borderRadius: 12 }}
							resizeMode='cover'
						/>
					</View>

					<View
						style={{
							backgroundColor: colors.surfaceSubtle,
							borderColor: colors.border,
							borderWidth: 1,
						}}
						className='px-2.5 py-0.5 rounded mb-2'
					>
						<Text
							style={{ color: colors.accent }}
							className='text-[10px] font-sans-bold uppercase tracking-widest'
						>
							[ STOP SCROLLING · START READING ]
						</Text>
					</View>

					<Text
						style={{
							fontFamily: 'EBGaramond_700Bold',
							color: colors.textPrimary,
						}}
						className='text-3xl text-center'
					>
						Guard Your Walk with God
					</Text>
					<Text
						style={{ color: colors.textSecondary }}
						className='text-xs text-center mt-1.5 px-3 leading-relaxed'
					>
						{subtitle}
					</Text>
				</View>

				{/* Pricing Plans Architecture */}
				<View className='mb-3'>
					<Text
						style={{ color: colors.accent }}
						className='text-xs font-sans-bold uppercase tracking-widest mb-2.5'
					>
						CHOOSE YOUR PLAN
					</Text>

					{/* Annual Plan (Hero Card with 7-Day Free Trial) */}
					<Pressable
						onPress={() => setSelectedPlan('annual')}
						style={{
							backgroundColor: selectedPlan === 'annual' ? colors.accentBg : colors.surface,
							borderColor: selectedPlan === 'annual' ? colors.accent : colors.border,
							borderWidth: selectedPlan === 'annual' ? 2 : 1,
							borderRadius: 14,
							padding: 14,
							marginBottom: 10,
						}}
					>
						{/* Top Banner Tag */}
						<View className='flex-row items-center justify-between mb-2'>
							<View
								style={{
									backgroundColor: colors.accent,
								}}
								className='px-2.5 py-0.5 rounded'
							>
								<Text
									style={{ color: colors.accentText }}
									className='text-[9px] font-sans-bold uppercase tracking-wider'
								>
									★ RECOMMENDED // 7-DAY FREE TRIAL
								</Text>
							</View>
							<View
								style={{
									backgroundColor: colors.surfaceElevated,
									borderColor: colors.borderSubtle,
									borderWidth: 1,
								}}
								className='px-2 py-0.5 rounded'
							>
								<Text
									style={{ color: colors.accent }}
									className='text-[10px] font-sans-bold uppercase'
								>
									SAVE 50%
								</Text>
							</View>
						</View>

						<View className='flex-row items-center justify-between'>
							<View className='flex-1 mr-3'>
								<Text style={{ color: colors.textPrimary }} className='text-base font-sans-bold'>
									Annual Sanctuary
								</Text>
								<Text style={{ color: colors.textSecondary }} className='text-xs mt-0.5'>
									<Text style={{ color: colors.accent, fontWeight: '700' }}>$2.49/mo</Text> · {annualPrice} billed yearly after 7-day trial
								</Text>
							</View>

							{/* Tactical Radio Indicator */}
							<View
								style={{
									borderColor: selectedPlan === 'annual' ? colors.accent : colors.borderSubtle,
									backgroundColor: selectedPlan === 'annual' ? colors.accent : 'transparent',
									borderWidth: 1.5,
								}}
								className='w-5 h-5 rounded-full items-center justify-center'
							>
								{selectedPlan === 'annual' && (
									<View style={{ backgroundColor: colors.accentText }} className='w-2 h-2 rounded-full' />
								)}
							</View>
						</View>
					</Pressable>

					{/* Monthly Plan */}
					<Pressable
						onPress={() => setSelectedPlan('monthly')}
						style={{
							backgroundColor: selectedPlan === 'monthly' ? colors.accentBg : colors.surface,
							borderColor: selectedPlan === 'monthly' ? colors.accent : colors.border,
							borderWidth: selectedPlan === 'monthly' ? 2 : 1,
							borderRadius: 14,
							padding: 14,
							marginBottom: 10,
						}}
						className='flex-row items-center justify-between'
					>
						<View className='flex-1 mr-3'>
							<Text style={{ color: colors.textPrimary }} className='text-base font-sans-bold'>
								Monthly Sanctuary
							</Text>
							<Text style={{ color: colors.textSecondary }} className='text-xs mt-0.5'>
								<Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{monthlyPrice}/month</Text> · Flexible commitment, cancel anytime
							</Text>
						</View>
						<View
							style={{
								borderColor: selectedPlan === 'monthly' ? colors.accent : colors.borderSubtle,
								backgroundColor: selectedPlan === 'monthly' ? colors.accent : 'transparent',
								borderWidth: 1.5,
							}}
							className='w-5 h-5 rounded-full items-center justify-center'
						>
							{selectedPlan === 'monthly' && (
								<View style={{ backgroundColor: colors.accentText }} className='w-2 h-2 rounded-full' />
							)}
						</View>
					</Pressable>

					{/* Lifetime Plan */}
					<Pressable
						onPress={() => setSelectedPlan('lifetime')}
						style={{
							backgroundColor: selectedPlan === 'lifetime' ? colors.accentBg : colors.surface,
							borderColor: selectedPlan === 'lifetime' ? colors.accent : colors.border,
							borderWidth: selectedPlan === 'lifetime' ? 2 : 1,
							borderRadius: 14,
							padding: 14,
						}}
						className='flex-row items-center justify-between'
					>
						<View className='flex-1 mr-3'>
							<View className='flex-row items-center'>
								<Text style={{ color: colors.textPrimary }} className='text-base font-sans-bold'>
									Lifetime Sanctuary
								</Text>
								<View
									style={{
										backgroundColor: colors.surfaceElevated,
										borderColor: colors.borderSubtle,
										borderWidth: 1,
									}}
									className='ml-2 px-1.5 py-0.5 rounded'
								>
									<Text
										style={{ color: colors.textSecondary }}
										className='text-[9px] font-sans-bold uppercase'
									>
										ONE-TIME
									</Text>
								</View>
							</View>
							<Text style={{ color: colors.textSecondary }} className='text-xs mt-0.5'>
								<Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{lifetimePrice}</Text> · Single investment, perpetual unlock
							</Text>
						</View>
						<View
							style={{
								borderColor: selectedPlan === 'lifetime' ? colors.accent : colors.borderSubtle,
								backgroundColor: selectedPlan === 'lifetime' ? colors.accent : 'transparent',
								borderWidth: 1.5,
							}}
							className='w-5 h-5 rounded-full items-center justify-center'
						>
							{selectedPlan === 'lifetime' && (
								<View style={{ backgroundColor: colors.accentText }} className='w-2 h-2 rounded-full' />
							)}
						</View>
					</Pressable>
				</View>

				{/* 3-Step Trial Timeline (when Annual plan is selected) */}
				{selectedPlan === 'annual' && (
					<View
						style={{
							backgroundColor: colors.surface,
							borderColor: colors.borderSubtle,
							borderWidth: 1,
							borderRadius: 14,
							padding: 14,
							marginBottom: 16,
						}}
					>
						<View className='flex-row items-center justify-between mb-3 border-b pb-2' style={{ borderBottomColor: colors.borderSubtle }}>
							<View className='flex-row items-center'>
								<Sparkles size={13} color={colors.accent} />
								<Text style={{ color: colors.accent }} className='text-xs font-sans-bold uppercase tracking-wider ml-1.5'>
									HOW YOUR FREE TRIAL WORKS
								</Text>
							</View>
							<Text style={{ color: colors.textMuted }} className='text-[9px] font-sans-medium uppercase'>
								AUTOMATED
							</Text>
						</View>

						<View className='space-y-2.5'>
							{/* Step 1 */}
							<View className='flex-row items-start'>
								<View
									style={{ backgroundColor: colors.accent }}
									className='w-5 h-5 rounded items-center justify-center mr-2.5 mt-0.5'
								>
									<Text style={{ color: colors.accentText }} className='text-[10px] font-sans-bold'>01</Text>
								</View>
								<View className='flex-1'>
									<Text style={{ color: colors.textPrimary }} className='text-xs font-sans-bold'>
										Today: Instant Zero-Cost Access ($0.00)
									</Text>
									<Text style={{ color: colors.textSecondary }} className='text-[11px] font-sans'>
										Full immediate unlock of all Sanctuary blocker presets and sacred tools.
									</Text>
								</View>
							</View>

							{/* Step 2 */}
							<View className='flex-row items-start'>
								<View
									style={{
										backgroundColor: colors.surfaceElevated,
										borderColor: colors.borderSubtle,
										borderWidth: 1,
									}}
									className='w-5 h-5 rounded items-center justify-center mr-2.5 mt-0.5'
								>
									<Text style={{ color: colors.textSecondary }} className='text-[10px] font-sans-bold'>05</Text>
								</View>
								<View className='flex-1'>
									<Text style={{ color: colors.textPrimary }} className='text-xs font-sans-bold'>
										Day 5: 48-Hour Courtesy Reminder
									</Text>
									<Text style={{ color: colors.textSecondary }} className='text-[11px] font-sans'>
										We dispatch a push reminder 2 days before your trial period concludes.
									</Text>
								</View>
							</View>

							{/* Step 3 */}
							<View className='flex-row items-start'>
								<View
									style={{
										backgroundColor: colors.surfaceElevated,
										borderColor: colors.borderSubtle,
										borderWidth: 1,
									}}
									className='w-5 h-5 rounded items-center justify-center mr-2.5 mt-0.5'
								>
									<Text style={{ color: colors.textSecondary }} className='text-[10px] font-sans-bold'>07</Text>
								</View>
								<View className='flex-1'>
									<Text style={{ color: colors.textPrimary }} className='text-xs font-sans-bold'>
										Day 7: Subscription Renews
									</Text>
									<Text style={{ color: colors.textSecondary }} className='text-[11px] font-sans'>
										Renews at {annualPrice}/year ($2.49/mo). Easily cancel anytime before in app store settings.
									</Text>
								</View>
							</View>
						</View>
					</View>
				)}

				{/* Primary High-Tactile CTA Button */}
				<Pressable
					onPress={handleSubscribe}
					disabled={isProcessing}
					style={{
						backgroundColor: colors.accent,
						width: '100%',
						paddingVertical: 15,
						borderRadius: 14,
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 6,
						opacity: isProcessing ? 0.7 : 1,
						shadowColor: colors.accent,
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: isDark ? 0.4 : 0.2,
						shadowRadius: 8,
						elevation: 4,
					}}
				>
					{isProcessing ? (
						<ActivityIndicator size='small' color={colors.accentText} />
					) : (
						<View className='items-center'>
							<Text
								style={{
									color: colors.accentText,
									fontSize: 16,
									fontWeight: '700',
									fontFamily: 'Inter_700Bold',
									letterSpacing: 0.5,
								}}
							>
								{selectedPlan === 'annual'
									? 'START 7-DAY FREE TRIAL'
									: selectedPlan === 'lifetime'
										? `UNLOCK FOREVER — ${lifetimePrice}`
										: `SUBSCRIBE FOR ${monthlyPrice}/MO`}
							</Text>
							{selectedPlan === 'annual' && (
								<Text
									style={{
										color: colors.accentText,
										fontSize: 10,
										opacity: 0.9,
										marginTop: 2,
										fontFamily: 'Inter_600SemiBold',
										letterSpacing: 0.3,
									}}
								>
									$0.00 TODAY · THEN {annualPrice}/YEAR · CANCEL ANYTIME
								</Text>
							)}
						</View>
					)}
				</Pressable>

				{/* Behavioral Anchor Guarantee */}
				<Text
					style={{ color: colors.accent }}
					className='text-xs font-sans-medium text-center mt-1.5 mb-6'
				>
					{selectedPlan === 'annual'
						? "Less than the app time you'll reclaim — $2.49/mo"
						: selectedPlan === 'lifetime'
							? 'One payment. No more "just one more scroll."'
							: '$4.99/mo — the cost of one skipped distraction'}
				</Text>

				{/* Sacred Telemetry Viewport (Dedicated Cosmic Instrument Viewport) */}
				<View
					style={{
						borderRadius: 18,
						overflow: 'hidden',
						borderWidth: 1.5,
						borderColor: isDark ? '#2b3f33' : '#324a3c',
						backgroundColor: '#070b09',
						marginBottom: 18,
						shadowColor: '#000000',
						shadowOffset: { width: 0, height: 6 },
						shadowOpacity: 0.45,
						shadowRadius: 14,
						elevation: 8,
					}}
				>
					{/* Authentic Deep Starfield Background */}
					<Image
						source={SCROLL_BACKGROUNDS[7] || SCROLL_BACKGROUNDS[0]}
						style={StyleSheet.absoluteFill}
						resizeMode='cover'
					/>

					{/* Calibrated Dark Vignette Overlay for Crisp Readability */}
					<Svg
						pointerEvents='none'
						style={StyleSheet.absoluteFill}
						width='100%'
						height='100%'
					>
						<Defs>
							<LinearGradient id='viewportGradient' x1='0' y1='0' x2='0' y2='1'>
								<Stop offset='0%' stopColor='#070b09' stopOpacity={0.65} />
								<Stop offset='45%' stopColor='#070b09' stopOpacity={0.75} />
								<Stop offset='80%' stopColor='#070b09' stopOpacity={0.92} />
								<Stop offset='100%' stopColor='#070b09' stopOpacity={0.98} />
							</LinearGradient>
						</Defs>
						<Rect width='100%' height='100%' fill='url(#viewportGradient)' />
					</Svg>

					<View style={{ padding: 16 }}>
						{/* Viewport HUD Status Bar */}
						<View className='flex-row items-center justify-between mb-3.5'>
							<View
								style={{
									backgroundColor: 'rgba(245, 184, 0, 0.16)',
									borderColor: '#f5b800',
									borderWidth: 1,
								}}
								className='flex-row items-center px-2 py-0.5 rounded'
							>
								<View className='w-1.5 h-1.5 rounded-full bg-[#f5b800] mr-1.5' />
								<Text className='text-[10px] font-sans-bold uppercase tracking-wider text-[#f5b800]'>
									SACRED ENGINE // REELS
								</Text>
							</View>

							<View
								style={{
									backgroundColor: 'rgba(255, 255, 255, 0.08)',
									borderColor: 'rgba(255, 255, 255, 0.16)',
									borderWidth: 1,
								}}
								className='px-2 py-0.5 rounded'
							>
								<Text className='text-[10px] font-sans-medium text-white/70'>
									VIEWPORT • 336 CARDS
								</Text>
							</View>
						</View>

						{/* Mood State Telemetry Pills */}
						<View className='flex-row items-center mb-3.5'>
							<View
								style={{
									backgroundColor: '#232014',
									borderColor: '#f5b800',
									borderWidth: 1,
								}}
								className='px-2.5 py-1 rounded mr-2'
							>
								<Text className='text-[11px] font-sans-bold text-[#f5b800]'>
									🕊️ Peace
								</Text>
							</View>
							<View
								style={{
									backgroundColor: 'rgba(255, 255, 255, 0.07)',
									borderColor: 'rgba(255, 255, 255, 0.15)',
									borderWidth: 1,
								}}
								className='px-2.5 py-1 rounded mr-2'
							>
								<Text className='text-[11px] font-sans-medium text-white/75'>
									🛡️ Strength
								</Text>
							</View>
							<View
								style={{
									backgroundColor: 'rgba(255, 255, 255, 0.07)',
									borderColor: 'rgba(255, 255, 255, 0.15)',
									borderWidth: 1,
								}}
								className='px-2.5 py-1 rounded'
							>
								<Text className='text-[11px] font-sans-medium text-white/75'>
									✨ Comfort
								</Text>
							</View>
						</View>

						{/* Scripture Card Simulation & Tactical Floating Controls */}
						<View className='flex-row items-center justify-between mb-3.5'>
							<View className='flex-1 pr-3'>
								<Text
									style={{
										fontFamily: 'EBGaramond_700Bold',
										color: '#faf9f5',
										textShadowColor: 'rgba(0, 0, 0, 0.95)',
										textShadowOffset: { width: 0, height: 1.5 },
										textShadowRadius: 4,
									}}
									className='text-base leading-snug italic'
								>
									“Come to me, all who labor and are heavy laden, and I will give you rest.”
								</Text>
								<Text
									style={{
										color: '#f5b800',
										letterSpacing: 0.5,
									}}
									className='text-xs font-sans-bold mt-1.5'
								>
									MATTHEW 11:28 • KJV
								</Text>
							</View>

							{/* Tactical Viewport Controls */}
							<View className='items-center space-y-2'>
								<View
									style={{
										backgroundColor: 'rgba(15, 22, 18, 0.85)',
										borderColor: 'rgba(245, 184, 0, 0.4)',
										borderWidth: 1,
									}}
									className='w-7 h-7 rounded-lg items-center justify-center mb-1.5'
								>
									<Heart size={13} color='#f5b800' fill='#f5b800' />
								</View>
								<View
									style={{
										backgroundColor: 'rgba(15, 22, 18, 0.85)',
										borderColor: 'rgba(255, 255, 255, 0.18)',
										borderWidth: 1,
									}}
									className='w-7 h-7 rounded-lg items-center justify-center mb-1.5'
								>
									<Type size={13} color='#faf9f5' />
								</View>
								<View
									style={{
										backgroundColor: 'rgba(15, 22, 18, 0.85)',
										borderColor: 'rgba(255, 255, 255, 0.18)',
										borderWidth: 1,
									}}
									className='w-7 h-7 rounded-lg items-center justify-center'
								>
									<Share2 size={13} color='#faf9f5' />
								</View>
							</View>
						</View>

						{/* Viewport Footer Telemetry */}
						<View
							style={{
								borderTopColor: 'rgba(255, 255, 255, 0.12)',
								borderTopWidth: 1,
							}}
							className='pt-2.5 flex-row items-center justify-between'
						>
							<View className='flex-row items-center'>
								<Sparkles size={12} color='#f5b800' />
								<Text className='text-[10px] font-sans-bold uppercase tracking-wider text-white/80 ml-1.5'>
									336 Curated Mood Verses & Sacred Art
								</Text>
							</View>
							<View
								style={{
									backgroundColor: 'rgba(93, 184, 114, 0.22)',
									borderColor: '#5db872',
									borderWidth: 1,
								}}
								className='px-2 py-0.5 rounded'
							>
								<Text className='text-[9px] font-sans-bold uppercase tracking-wider text-[#5db872]'>
									COUNTS TO GOAL
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Swiss Modular Comparison Matrix ("WHAT YOU GET") */}
				<View
					style={{
						backgroundColor: colors.surface,
						borderColor: colors.border,
						borderWidth: 1,
						borderRadius: 16,
						padding: 14,
						marginBottom: 18,
					}}
				>
					<View className='flex-row items-center justify-between pb-3 border-b' style={{ borderBottomColor: colors.borderSubtle }}>
						<Text
							style={{ color: colors.accent }}
							className='text-xs font-sans-bold uppercase tracking-widest'
						>
							WHAT CHANGES FOR YOU
						</Text>
						<Text
							style={{ color: colors.textMuted }}
							className='text-[10px] font-sans-medium uppercase'
						>
							COVENANT vs SANCTUARY
						</Text>
					</View>

					{FEATURES.map((feat, idx) => {
						const IconComponent = feat.icon;
						return (
							<View
								key={feat.title}
								style={{
									borderTopColor: colors.borderSubtle,
									borderTopWidth: idx !== 0 ? 1 : 0,
									paddingVertical: 10,
								}}
							>
								{/* Module Header */}
								<View className='flex-row items-center justify-between mb-1.5'>
									<View className='flex-row items-center flex-1'>
										<View
											style={{
												backgroundColor: colors.accentBg,
												borderColor: colors.accent,
												borderWidth: 0.5,
											}}
											className='w-6 h-6 rounded-md items-center justify-center mr-2'
										>
											<IconComponent size={13} color={colors.accent} />
										</View>
										<Text
											style={{ color: colors.textPrimary }}
											className='text-xs font-sans-bold'
											numberOfLines={1}
										>
											{feat.title}
										</Text>
									</View>
								</View>

								{/* Precision Split Telemetry Strip (Zero Text Collision) */}
								<View className='flex-row items-stretch gap-1.5 pl-8'>
									{/* Free / Covenant Pill */}
									<View
										style={{
											flex: 1,
											backgroundColor: colors.surfaceSubtle,
											borderColor: colors.borderSubtle,
											borderWidth: 1,
										}}
										className='px-2.5 py-1.5 rounded-md justify-center'
									>
										<Text
											style={{ color: colors.textMuted }}
											className='text-[9px] font-sans-bold uppercase tracking-wider mb-0.5'
										>
											FREE COVENANT
										</Text>
										<Text
											style={{ color: colors.textSecondary }}
											className='text-[11px] font-sans'
											numberOfLines={1}
										>
											{feat.covenant}
										</Text>
									</View>

									{/* Pro / Sanctuary Badge */}
									<View
										style={{
											flex: 1.25,
											backgroundColor: colors.accentBg,
											borderColor: colors.accent,
											borderWidth: 1,
										}}
										className='px-2.5 py-1.5 rounded-md justify-center'
									>
										<View className='flex-row items-center justify-between mb-0.5'>
											<Text
												style={{ color: colors.accent }}
												className='text-[9px] font-sans-bold uppercase tracking-wider'
											>
												SANCTUARY
											</Text>
											<Check size={11} color={colors.accent} strokeWidth={3} />
										</View>
										<Text
											style={{ color: colors.textPrimary }}
											className='text-[11px] font-sans-bold'
											numberOfLines={1}
										>
											{feat.sanctuary}
										</Text>
									</View>
								</View>
							</View>
						);
					})}
				</View>

				{/* Secondary Bottom CTA Button */}
				<Pressable
					onPress={handleSubscribe}
					disabled={isProcessing}
					style={{
						backgroundColor: colors.accent,
						width: '100%',
						paddingVertical: 15,
						borderRadius: 14,
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 6,
						opacity: isProcessing ? 0.7 : 1,
						shadowColor: colors.accent,
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: isDark ? 0.4 : 0.2,
						shadowRadius: 8,
						elevation: 4,
					}}
				>
					{isProcessing ? (
						<ActivityIndicator size='small' color={colors.accentText} />
					) : (
						<View className='items-center'>
							<Text
								style={{
									color: colors.accentText,
									fontSize: 16,
									fontWeight: '700',
									fontFamily: 'Inter_700Bold',
									letterSpacing: 0.5,
								}}
							>
								{selectedPlan === 'annual'
									? 'START 7-DAY FREE TRIAL'
									: selectedPlan === 'lifetime'
										? `UNLOCK FOREVER — ${lifetimePrice}`
										: `SUBSCRIBE FOR ${monthlyPrice}/MO`}
							</Text>
							{selectedPlan === 'annual' && (
								<Text
									style={{
										color: colors.accentText,
										fontSize: 10,
										opacity: 0.9,
										marginTop: 2,
										fontFamily: 'Inter_600SemiBold',
										letterSpacing: 0.3,
									}}
								>
									$0.00 TODAY · THEN {annualPrice}/YEAR · CANCEL ANYTIME
								</Text>
							)}
						</View>
					)}
				</Pressable>

				{/* Behavioral Anchor Guarantee */}
				<Text
					style={{ color: colors.accent }}
					className='text-xs font-sans-medium text-center mt-1.5 mb-3'
				>
					{selectedPlan === 'annual'
						? '~$2.49/month — replace scrolling with Scripture'
						: selectedPlan === 'lifetime'
							? 'Single investment for lifetime focus and habit shield'
							: 'Less than a coffee to guard your daily scripture walk'}
				</Text>

				{/* Legal and Compliance Links */}
				<View className='flex-row items-center justify-center space-x-3 mt-1 mb-2'>
					<Pressable onPress={() => openLink('https://bibleunlock.in/terms')} hitSlop={8}>
						<Text style={{ color: colors.textSecondary }} className='text-xs font-sans-medium underline'>
							Terms of Service
						</Text>
					</Pressable>
					<Text style={{ color: colors.textMuted }}>•</Text>
					<Pressable onPress={() => openLink('https://bibleunlock.in/privacy')} hitSlop={8}>
						<Text style={{ color: colors.textSecondary }} className='text-xs font-sans-medium underline'>
							Privacy Policy
						</Text>
					</Pressable>
					<Text style={{ color: colors.textMuted }}>•</Text>
					<Pressable onPress={handleRestore} hitSlop={8}>
						<Text style={{ color: colors.textSecondary }} className='text-xs font-sans-medium underline'>
							Restore Purchases
						</Text>
					</Pressable>
				</View>

				{/* Store Compliance Disclosure */}
				<Text style={{ color: colors.textMuted }} className='text-[10px] text-center mt-1 leading-relaxed px-2'>
					Annual plan includes a 7-day free trial, then renews at {annualPrice}/year. Subscriptions automatically renew unless cancelled in store account settings at least 24 hours before the end of the trial or current period. Payment is charged to your Apple ID or Google Play account.
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}
