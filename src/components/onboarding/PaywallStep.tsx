import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Sparkles, ShieldCheck, Flame, Clock, Bookmark, Zap, Check } from 'lucide-react-native';
import { SCROLL_BACKGROUNDS } from '../../../assets/scroll-backgrounds';
import { usePurchases, isRevenueCatConfigured } from '../../lib/purchases';

interface PaywallStepProps {
	onBack: () => void;
	onNext: () => void;
}

const PRO_FEATURES = [
	{ Icon: ShieldCheck, text: 'Unlimited App Shielding (Silence every distraction)' },
	{ Icon: Sparkles, text: 'Bible Scroll Visual Feed (336 sacred mood verses & cards)' },
	{ Icon: Flame, text: 'Streak Grace Protection (1 grace day / month for rest)' },
	{ Icon: Clock, text: 'Custom Reading Goals (Extended 30m+ & custom goals)' },
	{ Icon: Bookmark, text: 'Unlimited Bookmarks, Collections & Verse Notes' },
	{ Icon: Zap, text: 'Liturgical Reminders & up to 24 Daily Verse Alerts' },
];

export const PaywallStep: React.FC<PaywallStepProps> = ({ onBack, onNext }) => {
	const { isPremium, offerings, purchasePackage } = usePurchases();
	const [isProcessing, setIsProcessing] = useState(false);

	const handleTryPro = async () => {
		setIsProcessing(true);
		const currentPackages = offerings?.current?.availablePackages || [];
		const annualPkg =
			offerings?.current?.annual ||
			currentPackages.find(
				(p) => p.identifier.toLowerCase().includes('annual') || (p.packageType as string) === 'ANNUAL',
			) ||
			currentPackages[0];

		let success = false;
		if (annualPkg) {
			success = await purchasePackage(annualPkg);
		} else {
			if (__DEV__ || !isRevenueCatConfigured()) {
				success = await purchasePackage({ identifier: 'annual' } as any);
			} else {
				Alert.alert(
					'Product Unavailable',
					'Unable to connect to store products. Please check your internet connection or try again shortly.',
				);
			}
		}

		setIsProcessing(false);
		if (success) {
			onNext();
		}
	};

	return (
		<View className='flex-1 justify-between px-6 py-6 bg-[#0d2e24]'>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
			>
				{/* Top 5-segment Progress Bar */}
				<View className='flex-row space-x-1.5 pt-4 mb-4'>
					{[1, 2, 3, 4, 5].map((idx) => (
						<View
							key={idx}
							className={`flex-1 h-1 rounded-full mr-1.5 ${idx <= 4 ? 'bg-[#f5b800]' : 'bg-[#1b4a3c]'}`}
						/>
					))}
				</View>

				<Text className='text-xs font-sans-bold text-[#f5b800] mb-3'>4 of 5</Text>

				<View className='items-center'>
					<View
						className={`w-14 h-14 rounded-full ${
							isPremium ? 'bg-[#5db872]/20 border border-[#5db872]/40' : 'bg-[#f5b800]/15 border border-[#f5b800]/30'
						} items-center justify-center mb-2`}
					>
						{isPremium ? (
							<Check size={28} color='#5db872' strokeWidth={2.5} />
						) : (
							<Sparkles size={28} color='#f5b800' strokeWidth={2} />
						)}
					</View>
					<Text
						className='text-[32px] font-serif-bold text-[#faf9f5] text-center mb-2 tracking-tight leading-[40px]'
						style={{ fontFamily: 'EBGaramond_700Bold' }}
					>
						{isPremium ? 'Welcome to the Sanctuary' : 'Deepen your walk with Jesus'}
					</Text>
					<Text className='text-base font-sans text-[#78a898] text-center px-4 leading-relaxed'>
						{isPremium
							? 'Your 7-day free trial is active. All premium shields, Bible Scroll reels, and streak protection are enabled.'
							: 'Enter the Sanctuary with unlimited app shields, full Bible Scroll sacred feed, and grace days to protect your daily devotion to Christ.'}
					</Text>
				</View>

				{/* Mini Bible Scroll Visual Teaser */}
				<View
					style={{
						borderRadius: 18,
						overflow: 'hidden',
						borderWidth: 1.5,
						borderColor: 'rgba(245, 184, 0, 0.4)',
						marginTop: 14,
						marginBottom: 6,
						height: 115,
						backgroundColor: '#0d120f',
					}}
				>
					<Image
						source={SCROLL_BACKGROUNDS[7] || SCROLL_BACKGROUNDS[0]}
						style={StyleSheet.absoluteFill}
						resizeMode='cover'
					/>
					<Svg
						pointerEvents='none'
						style={StyleSheet.absoluteFill}
						width='100%'
						height='100%'
					>
						<Defs>
							<LinearGradient id='onboardingScrollTeaser' x1='0' y1='0' x2='0' y2='1'>
								<Stop offset='0%' stopColor='#0d120f' stopOpacity='0.45' />
								<Stop offset='100%' stopColor='#0d120f' stopOpacity='0.85' />
							</LinearGradient>
						</Defs>
						<Rect width='100%' height='100%' fill='url(#onboardingScrollTeaser)' />
					</Svg>
					<View className='flex-1 justify-between p-3.5'>
						<View className='flex-row items-center justify-between'>
							<View
								style={{
									backgroundColor: 'rgba(245, 184, 0, 0.2)',
									borderColor: 'rgba(245, 184, 0, 0.4)',
									borderWidth: 1,
								}}
								className='flex-row items-center px-2 py-0.5 rounded-full'
							>
								<Sparkles size={10} color='#f5b800' />
								<Text className='text-[10px] font-sans-bold text-[#f5b800] uppercase tracking-wider ml-1'>
									Signature • Bible Scroll
								</Text>
							</View>
							<Text className='text-[10px] font-sans-semibold text-white/70'>
								🕊️ Mood Guided
							</Text>
						</View>
						<Text
							style={{ fontFamily: 'EBGaramond_700Bold' }}
							className='text-sm text-white italic leading-tight'
							numberOfLines={2}
						>
							“Come to me, all who labor and are heavy laden, and I will give you rest.”
						</Text>
						<Text className='text-[10px] font-sans-medium text-[#f5b800]'>
							Swipe through 336 sacred mood verses & artworks
						</Text>
					</View>
				</View>

				{/* Feature List Card */}
				<View className='p-6 rounded-3xl bg-[#143e32] border border-[#265e4d] my-4 space-y-4'>
					{PRO_FEATURES.map((item, idx) => {
						const IconComp = item.Icon;
						return (
							<View key={idx} className='flex-row items-center mb-3.5'>
								<View className='w-8 h-8 rounded-lg bg-[#1a4a3c] items-center justify-center mr-3.5'>
									<IconComp size={16} color='#f5b800' strokeWidth={2} />
								</View>
								<Text className='text-sm font-sans-medium text-[#faf9f5] flex-1'>{item.text}</Text>
							</View>
						);
					})}
				</View>

				{/* CTAs */}
				<View className='space-y-3 mt-4'>
					{isPremium ? (
						<Pressable
							onPress={onNext}
							className='w-full py-4.5 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg mb-3'
						>
							<Text className='text-lg font-sans-bold text-[#141413]'>Continue to Final Step (5 of 5) →</Text>
						</Pressable>
					) : (
						<>
							<Pressable
								onPress={handleTryPro}
								disabled={isProcessing}
								className='w-full py-4.5 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg mb-3'
							>
								{isProcessing ? (
									<ActivityIndicator size='small' color='#141413' />
								) : (
									<Text className='text-lg font-sans-bold text-[#141413]'>Start Free Trial — $0 Today</Text>
								)}
							</Pressable>

							<Pressable
								onPress={onNext}
								disabled={isProcessing}
								className='w-full py-2 items-center justify-center active:opacity-70'
							>
								<Text className='text-xs font-sans-medium text-[#8eb8a8] underline'>
									Continue on the Free Covenant Plan
								</Text>
							</Pressable>
						</>
					)}
				</View>
			</ScrollView>

			{/* Back Button */}
			<View className='pt-2'>
				<Pressable
					onPress={onBack}
					className='w-full py-4 rounded-2xl bg-[#13382d] items-center justify-center active:opacity-80'
				>
					<Text className='text-base font-sans-bold text-[#78a898]'>Back</Text>
				</Pressable>
			</View>
		</View>
	);
};
