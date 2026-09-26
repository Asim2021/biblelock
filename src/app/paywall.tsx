import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Image, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { usePurchases, isRevenueCatConfigured } from '../lib/purchases';
import { useTheme } from '../lib/themeContext';
import { getStreak, getUserName } from '../lib/mmkv';
import { Card } from '../components/Card';
import { SCROLL_BACKGROUNDS } from '../../assets/scroll-backgrounds';
import { X, Check, ShieldCheck, Flame, Clock, Zap, BarChart3, Bookmark, Sparkles, Heart, Share2, Type } from 'lucide-react-native';

const FEATURES = [
	{
		icon: ShieldCheck,
		title: 'Block Any App on Device',
		free: '5 Presets only',
		pro: 'Unlimited custom apps',
	},
	{
		icon: Sparkles,
		title: 'Bible Scroll Visual Feed',
		free: 'Preview mode',
		pro: '336 sacred mood verses & art',
	},
	{
		icon: Flame,
		title: 'Streak Grace Protection',
		free: '—',
		pro: '1 Grace Day / month',
	},
	{
		icon: Clock,
		title: 'Reading Goals & Custom Time',
		free: '5m, 10m, 15m',
		pro: '30m & custom (1–120m)',
	},
	{
		icon: Bookmark,
		title: 'Study Library Collections',
		free: '1 collection • 5 bookmarks',
		pro: 'Unlimited collections & notes',
	},
	{
		icon: Zap,
		title: 'Daily Reminders & Verse Alerts',
		free: '1 reminder • 6 verses/day',
		pro: 'Multi-hour alerts • 24 verses/day',
	},
	{
		icon: BarChart3,
		title: 'Spiritual Growth Analytics',
		free: '7-Day Week view',
		pro: '30-Day Heatmap & Year telemetry',
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

	let subtitle = 'Choose Scripture over scrolling. Start your journey deeper.';
	if (streak >= 7) {
		subtitle = `A ${streak}-day streak, ${userName}. Don't let it break — Sanctuary protects your progress.`;
	} else if (streak >= 3) {
		subtitle = `You've chosen Scripture over scrolling for ${streak} days. That's who you're becoming.`;
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
	const lifetimePrice = lifetimePkg?.product?.priceString || '$79.99';

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
					'Unable to connect to store products. Please check your internet connection or try again shortly.'
				);
			}
		}

		setIsProcessing(false);
		if (success) {
			Alert.alert('Welcome to the Sanctuary 🙏', 'Your subscription is active. All premium features unlocked.', [
				{ text: 'Continue', onPress: () => router.back() },
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
			Alert.alert('Restore', 'No active subscription found for this Apple or Google Play account.');
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
			{/* Modal Close Header */}
			<View
				style={{ borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }}
				className='px-5 py-3 flex-row justify-between items-center'
			>
				<View className='w-8' />
				<Text style={{ color: colors.accent }} className='text-xs font-sans-bold uppercase tracking-widest'>
					SANCTUARY
				</Text>
				<Pressable
					onPress={() => router.back()}
					style={{
						backgroundColor: colors.surfaceElevated,
						borderColor: colors.borderSubtle,
						borderWidth: 1,
					}}
					className='w-8 h-8 items-center justify-center rounded-full active:opacity-70'
				>
					<X size={16} color={colors.textPrimary} />
				</Pressable>
			</View>

			<ScrollView
				className='flex-1 px-5'
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Hero Title & Master Icon */}
				<View className='items-center my-4'>
					<View
						style={{
							backgroundColor: colors.accentBg,
							borderColor: colors.accent,
							borderWidth: 1.5,
							shadowColor: colors.accent,
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: isDark ? 0.35 : 0.15,
							shadowRadius: 10,
							elevation: 5,
						}}
						className='w-16 h-16 rounded-2xl items-center justify-center mb-2.5 p-1'
					>
						<Image
							source={require('../../assets/images/icon.png')}
							style={{ width: '100%', height: '100%', borderRadius: 12 }}
							resizeMode='cover'
						/>
					</View>
					<Text
						style={{
							fontFamily: 'EBGaramond_700Bold',
							color: colors.textPrimary,
						}}
						className='text-2xl text-center'
					>
						Enter the Sanctuary
					</Text>
					<Text
						style={{ color: colors.textSecondary }}
						className='text-xs text-center mt-1 px-4 leading-relaxed'
					>
						{subtitle}
					</Text>
				</View>

				{/* Bible Scroll Signature Feature Spotlight */}
				<View
					style={{
						borderRadius: 20,
						overflow: 'hidden',
						borderWidth: 1.5,
						borderColor: colors.accent,
						marginBottom: 16,
						backgroundColor: '#0d120f',
						shadowColor: colors.accent,
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: isDark ? 0.35 : 0.15,
						shadowRadius: 12,
						elevation: 6,
					}}
				>
					{/* Sacred Background Art */}
					<Image
						source={SCROLL_BACKGROUNDS[7] || SCROLL_BACKGROUNDS[0]}
						style={StyleSheet.absoluteFill}
						resizeMode='cover'
					/>

					{/* Dark Multi-Stop Gradient Overlay for guaranteed contrast */}
					<Svg
						pointerEvents='none'
						style={StyleSheet.absoluteFill}
						width='100%'
						height='100%'
					>
						<Defs>
							<LinearGradient id='paywallScrollMockup' x1='0' y1='0' x2='0' y2='1'>
								<Stop offset='0%' stopColor='#0d120f' stopOpacity='0.55' />
								<Stop offset='40%' stopColor='#0d120f' stopOpacity='0.70' />
								<Stop offset='75%' stopColor='#0d120f' stopOpacity='0.85' />
								<Stop offset='100%' stopColor='#0d120f' stopOpacity='0.96' />
							</LinearGradient>
						</Defs>
						<Rect width='100%' height='100%' fill='url(#paywallScrollMockup)' />
					</Svg>

					<View style={{ padding: 16 }}>
						{/* Top Tag Row */}
						<View className='flex-row items-center justify-between mb-3'>
							<View
								style={{
									backgroundColor: 'rgba(245, 184, 0, 0.18)',
									borderColor: colors.accent,
									borderWidth: 1,
								}}
								className='flex-row items-center px-2.5 py-1 rounded-full'
							>
								<Sparkles size={11} color={colors.accent} />
								<Text
									style={{ color: colors.accent }}
									className='text-[10px] font-sans-bold uppercase tracking-wider ml-1.5'
								>
									Sanctuary Exclusive • Bible Scroll
								</Text>
							</View>

							<View
								style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
								className='px-2 py-0.5 rounded-full'
							>
								<Text className='text-[10px] font-sans-medium text-white/90'>
									Vertical Reels
								</Text>
							</View>
						</View>

						{/* Mood Filter Simulation */}
						<View className='flex-row items-center space-x-1.5 mb-3'>
							<View
								style={{
									backgroundColor: 'rgba(245, 184, 0, 0.25)',
									borderColor: colors.accent,
									borderWidth: 1,
								}}
								className='px-2.5 py-1 rounded-full mr-1.5'
							>
								<Text style={{ color: colors.accent }} className='text-[11px] font-sans-bold'>
									🕊️ Peace
								</Text>
							</View>
							<View
								style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1 }}
								className='px-2.5 py-1 rounded-full mr-1.5'
							>
								<Text className='text-[11px] font-sans-medium text-white/80'>
									🛡️ Strength
								</Text>
							</View>
							<View
								style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1 }}
								className='px-2.5 py-1 rounded-full'
							>
								<Text className='text-[11px] font-sans-medium text-white/80'>
									✨ Comfort
								</Text>
							</View>
						</View>

						{/* Scripture Card Simulation & Floating Actions */}
						<View className='flex-row items-center justify-between mb-3'>
							<View className='flex-1 pr-3'>
								<Text
									style={{
										fontFamily: 'EBGaramond_700Bold',
										textShadowColor: 'rgba(0, 0, 0, 0.9)',
										textShadowOffset: { width: 0, height: 2 },
										textShadowRadius: 4,
									}}
									className='text-base text-white leading-snug italic'
								>
									“Come to me, all who labor and are heavy laden, and I will give you rest.”
								</Text>
								<Text
									style={{ color: colors.accent }}
									className='text-xs font-sans-bold mt-1.5'
								>
									Matthew 11:28 • KJV
								</Text>
							</View>

							{/* Mock Floating Action Stack */}
							<View className='items-center space-y-2'>
								<View
									style={{
										backgroundColor: 'rgba(20, 20, 20, 0.65)',
										borderColor: 'rgba(255, 255, 255, 0.18)',
										borderWidth: 1,
									}}
									className='w-7 h-7 rounded-full items-center justify-center mb-1.5'
								>
									<Heart size={13} color={colors.accent} fill={colors.accent} />
								</View>
								<View
									style={{
										backgroundColor: 'rgba(20, 20, 20, 0.65)',
										borderColor: 'rgba(255, 255, 255, 0.18)',
										borderWidth: 1,
									}}
									className='w-7 h-7 rounded-full items-center justify-center mb-1.5'
								>
									<Type size={13} color='#ffffff' />
								</View>
								<View
									style={{
										backgroundColor: 'rgba(20, 20, 20, 0.65)',
										borderColor: 'rgba(255, 255, 255, 0.18)',
										borderWidth: 1,
									}}
									className='w-7 h-7 rounded-full items-center justify-center'
								>
									<Share2 size={13} color='#ffffff' />
								</View>
							</View>
						</View>

						{/* Bottom Benefit Callout */}
						<View
							style={{ borderTopColor: 'rgba(255, 255, 255, 0.12)', borderTopWidth: 1 }}
							className='pt-2.5 flex-row items-center justify-between'
						>
							<View className='flex-row items-center flex-1 mr-2'>
								<Sparkles size={12} color={colors.accent} />
								<Text className='text-[11px] font-sans-medium text-white/80 ml-1.5'>
									336 Curated Mood Verses & Sacred Art
								</Text>
							</View>
							<View
								style={{
									backgroundColor: 'rgba(16, 185, 129, 0.2)',
									borderColor: 'rgba(16, 185, 129, 0.4)',
									borderWidth: 1,
								}}
								className='px-2 py-0.5 rounded'
							>
								<Text className='text-[10px] font-sans-bold text-emerald-300 uppercase'>
									Counts to Goal
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Comparison Feature Table */}
				<Card
					style={{
						backgroundColor: colors.surface,
						borderColor: colors.border,
						borderWidth: 1,
						padding: 14,
						marginBottom: 16,
						borderRadius: 16,
					}}
				>
					<Text
						style={{ color: colors.accent }}
						className='text-xs font-sans-bold uppercase tracking-wider mb-2'
					>
						What You Get
					</Text>
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
								<View className='flex-row items-center mb-1'>
									<View
										style={{ backgroundColor: colors.accentBg }}
										className='w-6 h-6 rounded-md items-center justify-center mr-2'
									>
										<IconComponent size={14} color={colors.accent} />
									</View>
									<Text style={{ color: colors.textPrimary }} className='text-sm font-sans-semibold'>
										{feat.title}
									</Text>
								</View>
								<View className='flex-row justify-between items-center ml-8'>
									<Text style={{ color: colors.textSecondary }} className='text-xs'>
										Covenant: {feat.free}
									</Text>
									<View className='flex-row items-center'>
										<Check size={13} color={colors.accent} strokeWidth={2.5} />
										<Text
											style={{ color: colors.accent }}
											className='text-xs font-sans-medium ml-1'
										>
											{feat.pro}
										</Text>
									</View>
								</View>
							</View>
						);
					})}
				</Card>

				{/* Pricing Plan Selector */}
				<View className='mb-3'>
					{/* Annual Card (Hero with 7-Day Free Trial) */}
					<Pressable
						onPress={() => setSelectedPlan('annual')}
						style={{
							backgroundColor: selectedPlan === 'annual' ? colors.accentBg : colors.surface,
							borderColor: selectedPlan === 'annual' ? colors.accent : colors.border,
							borderWidth: 1.5,
							borderRadius: 14,
							padding: 14,
							marginBottom: 10,
						}}
						className='flex-row items-center justify-between'
					>
						<View className='flex-1 mr-3'>
							<View className='flex-row items-center flex-wrap gap-1.5'>
								<Text style={{ color: colors.textPrimary }} className='text-base font-sans-bold'>
									Annual Sanctuary
								</Text>
								<View
									style={{ backgroundColor: colors.accent }}
									className='px-2 py-0.5 rounded-full'
								>
									<Text
										style={{ color: colors.accentText }}
										className='text-[10px] font-sans-bold uppercase'
									>
										7-Day Free Trial
									</Text>
								</View>
								<View
									style={{
										backgroundColor: colors.surfaceElevated,
										borderColor: colors.borderSubtle,
										borderWidth: 1,
									}}
									className='px-2 py-0.5 rounded-full'
								>
									<Text
										style={{ color: colors.accent }}
										className='text-[10px] font-sans-bold uppercase'
									>
										Save 50%
									</Text>
								</View>
							</View>
							<Text style={{ color: colors.textSecondary }} className='text-xs mt-1'>
								$2.49/mo · {annualPrice} billed yearly after 7-day trial
							</Text>
						</View>
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
					</Pressable>

					{/* Monthly Card */}
					<Pressable
						onPress={() => setSelectedPlan('monthly')}
						style={{
							backgroundColor: selectedPlan === 'monthly' ? colors.accentBg : colors.surface,
							borderColor: selectedPlan === 'monthly' ? colors.accent : colors.border,
							borderWidth: 1.5,
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
							<Text style={{ color: colors.textSecondary }} className='text-xs mt-1'>
								{monthlyPrice}/month · Cancel anytime
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

					{/* Lifetime Card */}
					<Pressable
						onPress={() => setSelectedPlan('lifetime')}
						style={{
							backgroundColor: selectedPlan === 'lifetime' ? colors.accentBg : colors.surface,
							borderColor: selectedPlan === 'lifetime' ? colors.accent : colors.border,
							borderWidth: 1.5,
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
									className='ml-2.5 px-2 py-0.5 rounded-full'
								>
									<Text
										style={{ color: colors.textSecondary }}
										className='text-[10px] font-sans-bold uppercase'
									>
										Forever
									</Text>
								</View>
							</View>
							<Text style={{ color: colors.textSecondary }} className='text-xs mt-1'>
								{lifetimePrice} · Pay once, keep forever
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
						<View className='flex-row items-center mb-2.5'>
							<Sparkles size={13} color={colors.accent} />
							<Text style={{ color: colors.accent }} className='text-xs font-sans-bold uppercase tracking-wider ml-1.5'>
								How Your 7-Day Free Trial Works
							</Text>
						</View>

						<View className='space-y-2'>
							<View className='flex-row items-start'>
								<View style={{ backgroundColor: colors.accent }} className='w-4.5 h-4.5 rounded-full items-center justify-center mr-2.5 mt-0.5'>
									<Text style={{ color: colors.accentText }} className='text-[10px] font-sans-bold'>1</Text>
								</View>
								<View className='flex-1'>
									<Text style={{ color: colors.textPrimary }} className='text-xs font-sans-bold'>Today: Instant Access ($0.00)</Text>
									<Text style={{ color: colors.textSecondary }} className='text-[11px] font-sans'>Full access to all Sanctuary spiritual disciplines.</Text>
								</View>
							</View>

							<View className='flex-row items-start'>
								<View style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle, borderWidth: 1 }} className='w-4.5 h-4.5 rounded-full items-center justify-center mr-2.5 mt-0.5'>
									<Text style={{ color: colors.textSecondary }} className='text-[10px] font-sans-bold'>5</Text>
								</View>
								<View className='flex-1'>
									<Text style={{ color: colors.textPrimary }} className='text-xs font-sans-bold'>Day 5: Friendly Reminder</Text>
									<Text style={{ color: colors.textSecondary }} className='text-[11px] font-sans'>We notify you 2 days before the trial period concludes.</Text>
								</View>
							</View>

							<View className='flex-row items-start'>
								<View style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.borderSubtle, borderWidth: 1 }} className='w-4.5 h-4.5 rounded-full items-center justify-center mr-2.5 mt-0.5'>
									<Text style={{ color: colors.textSecondary }} className='text-[10px] font-sans-bold'>7</Text>
								</View>
								<View className='flex-1'>
									<Text style={{ color: colors.textPrimary }} className='text-xs font-sans-bold'>Day 7: Subscription Begins</Text>
									<Text style={{ color: colors.textSecondary }} className='text-[11px] font-sans'>Renews at {annualPrice}/year ($2.49/mo). Cancel anytime before.</Text>
								</View>
							</View>
						</View>
					</View>
				)}

				{/* Primary CTA Button */}
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
						marginBottom: 4,
						opacity: isProcessing ? 0.7 : 1,
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
								}}
							>
								{selectedPlan === 'annual'
									? 'Start 7-Day Free Trial'
									: selectedPlan === 'lifetime'
										? `Unlock Forever — ${lifetimePrice}`
										: `Start for ${monthlyPrice}/mo`}
							</Text>
							{selectedPlan === 'annual' && (
								<Text
									style={{
										color: colors.accentText,
										fontSize: 11,
										opacity: 0.9,
										marginTop: 2,
										fontFamily: 'Inter_500Medium',
									}}
								>
									$0.00 today · Then {annualPrice}/year · Cancel anytime
								</Text>
							)}
						</View>
					)}
				</Pressable>

				{/* Emotional anchor line */}
				<Text style={{ color: colors.accent }} className='text-xs font-sans-medium text-center mt-2 mb-2'>
					{selectedPlan === 'annual'
						? '~$2.49/month — replace scrolling with Scripture'
						: selectedPlan === 'lifetime'
							? 'One investment in your spiritual walk, forever'
							: 'Less than a cup of coffee to guard your focus'}
				</Text>

				{/* Store Compliance & Legal Links */}
				<View className='flex-row items-center justify-center space-x-3 mt-2 mb-2'>
					<Pressable onPress={() => openLink('https://bibleunlock.app/terms')} hitSlop={8}>
						<Text style={{ color: colors.textSecondary }} className='text-xs font-sans-medium underline'>
							Terms of Service
						</Text>
					</Pressable>
					<Text style={{ color: colors.textMuted }}>•</Text>
					<Pressable onPress={() => openLink('https://bibleunlock.app/privacy')} hitSlop={8}>
						<Text style={{ color: colors.textSecondary }} className='text-xs font-sans-medium underline'>
							Privacy Policy
						</Text>
					</Pressable>
					<Text style={{ color: colors.textMuted }}>•</Text>
					<Pressable onPress={handleRestore} hitSlop={8}>
						<Text style={{ color: colors.textSecondary }} className='text-xs font-sans-medium underline'>
							Restore
						</Text>
					</Pressable>
				</View>

				{/* Apple & Google auto-renewal disclosure */}
				<Text style={{ color: colors.textMuted }} className='text-[10px] text-center mt-1 leading-relaxed px-2'>
					Annual plan includes a 7-day free trial, then renews at {annualPrice}/year. Subscriptions automatically renew unless cancelled in store account settings at least 24 hours before the end of the trial or current period. Payment is charged to your Apple ID or Google Play account.
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}
