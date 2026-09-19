import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePurchases } from '../lib/purchases';
import { useTheme } from '../lib/themeContext';
import { getStreak, getUserName } from '../lib/mmkv';
import { Card } from '../components/Card';
import { X, Check, ShieldCheck, Flame, Clock, Zap, BookOpen, BarChart3, Bookmark } from 'lucide-react-native';

const FEATURES = [
	{
		icon: ShieldCheck,
		title: 'Block Any App on Device',
		free: '5 Presets only',
		pro: 'Unlimited custom apps',
	},
	{
		icon: BookOpen,
		title: 'Modern Translations',
		free: 'KJV + WEB',
		pro: 'ESV, NIV, NLT access',
	},
	{
		icon: Flame,
		title: 'Streak Protection',
		free: '—',
		pro: '1 grace day / month',
	},
	{
		icon: Clock,
		title: 'Lent & Advent Modes',
		free: '—',
		pro: 'Dedicated spiritual seasons',
	},
	{
		icon: BarChart3,
		title: 'Full Reading Analytics',
		free: 'Today & this week',
		pro: 'Monthly & lifetime history',
	},
	{
		icon: Bookmark,
		title: 'Unlimited Bookmarks',
		free: 'Max 3 bookmarks',
		pro: 'Unlimited + collections',
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
			if (typeof __DEV__ !== 'undefined' && __DEV__) {
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
			Alert.alert('Restore', 'No active subscription found for this Apple/Google account.');
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
				<View className='mb-4'>
					{/* Annual Card (Best Value) */}
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
							<View className='flex-row items-center'>
								<Text style={{ color: colors.textPrimary }} className='text-base font-sans-bold'>
									Annual Sanctuary
								</Text>
								<View
									style={{ backgroundColor: colors.accent }}
									className='ml-2.5 px-2 py-0.5 rounded-full'
								>
									<Text
										style={{ color: colors.accentText }}
										className='text-[10px] font-sans-bold uppercase'
									>
										Save 50%
									</Text>
								</View>
							</View>
							<Text style={{ color: colors.textSecondary }} className='text-xs mt-1'>
								$2.49/mo · {annualPrice} billed yearly
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

				{/* Primary CTA Button */}
				<Pressable
					onPress={handleSubscribe}
					disabled={isProcessing}
					style={{
						backgroundColor: colors.accent,
						width: '100%',
						paddingVertical: 16,
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
						<Text
							style={{
								color: colors.accentText,
								fontSize: 16,
								fontWeight: '700',
								fontFamily: 'Inter_700Bold',
							}}
						>
							{selectedPlan === 'annual'
								? 'Unlock Sanctuary'
								: selectedPlan === 'lifetime'
									? `Unlock Forever — ${lifetimePrice}`
									: `Start for ${monthlyPrice}/mo`}
						</Text>
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

				{/* Restore Purchases */}
				<Pressable onPress={handleRestore} className='py-2 items-center'>
					<Text style={{ color: colors.textSecondary }} className='text-xs font-sans-medium'>
						Restore Purchases
					</Text>
				</Pressable>

				<Text style={{ color: colors.textMuted }} className='text-[11px] text-center mt-2 leading-relaxed px-2'>
					Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end
					of the current period.
				</Text>
			</ScrollView>
		</SafeAreaView>
	);
}
