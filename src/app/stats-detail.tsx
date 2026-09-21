import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, RotateCw, Flame, Zap, Clock, Award, MoreHorizontal, Share2, BookOpen, Lock } from 'lucide-react-native';
import { useReadingTimer } from '../lib/readingTimer';
import { useFeatureGate } from '../lib/useFeatureGate';
import { getUserName, getImpactStats, getBlockedApps, getReadingHistory30Days, getReadingHistoryYear } from '../lib/mmkv';
import { BadgesGrid } from '../components/BadgesGrid';
import { BadgeShareModal } from '../components/BadgeShareModal';
import { DailyDevotionalCard } from '../components/DailyDevotionalCard';
import { BadgeItem, ImpactStats, HabitDay, YearMonthData } from '../types/onboarding';
import { useTheme } from '../lib/themeContext';

export default function StatsScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { colors, isDark } = useTheme();
	const { isPremium, requirePremium } = useFeatureGate();

	const [refreshing, setRefreshing] = useState(false);
	const [name, setName] = useState('Disciple');
	const [impact, setImpact] = useState<ImpactStats>({ minutesRead: 0, hoursSaved: 0, sessions: 0 });
	const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
	const [history, setHistory] = useState<HabitDay[]>([]);
	const [yearHistory, setYearHistory] = useState<YearMonthData[]>([]);
	const [historyPeriod, setHistoryPeriod] = useState<'week' | 'month' | 'year'>('week');
	const [selectedDay, setSelectedDay] = useState<HabitDay | null>(null);
	const [selectedMonth, setSelectedMonth] = useState<YearMonthData | null>(null);

	const timer = useReadingTimer(false);

	const handleSelectPeriod = (period: 'week' | 'month' | 'year') => {
		if (period !== 'week' && !requirePremium('Full reading history')) {
			return;
		}
		setHistoryPeriod(period);
		setSelectedDay(null);
		setSelectedMonth(null);
	};

	const loadData = useCallback(() => {
		const storedName = getUserName();
		setName(storedName);

		setImpact(getImpactStats());
		setHistory(getReadingHistory30Days());
		setYearHistory(getReadingHistoryYear());
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData]),
	);

	const onRefresh = async () => {
		setRefreshing(true);
		loadData();
		setTimeout(() => setRefreshing(false), 300);
	};

	const getInitials = (fullName: string) => {
		if (!fullName || fullName === 'Disciple') return 'BU';
		const parts = fullName.trim().split(/\s+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return parts[0].slice(0, 2).toUpperCase();
	};

	// Badges calculation
	const blockedApps = useMemo(() => getBlockedApps(), []);
	const badges: BadgeItem[] = useMemo(
		() => [
			{
				id: 'genesis',
				title: 'Genesis',
				subtitle: 'First Step',
				icon: '🌱',
				unlocked: impact.sessions >= 1 || timer.streak >= 1,
				requirement: 'Complete your first Scripture reading session',
			},
			{
				id: 'david_courage',
				title: "David's Courage",
				subtitle: '3-Day Habit',
				icon: '⚔️',
				unlocked: timer.streak >= 3,
				requirement: 'Maintain your reading streak for 3 consecutive days',
			},
			{
				id: 'solomon_wisdom',
				title: "Solomon's Wisdom",
				subtitle: '7-Day Streak',
				icon: '👑',
				unlocked: timer.streak >= 7,
				requirement: "Complete 7 consecutive days in God's Word",
			},
			{
				id: 'armor_of_god',
				title: 'Armor of God',
				subtitle: 'Apps Guarded',
				icon: '🛡️',
				unlocked: blockedApps.length >= 3,
				requirement: 'Shield at least 3 distracting apps from temptation',
			},
			{
				id: 'living_water',
				title: 'Living Water',
				subtitle: '30m in Word',
				icon: '🌊',
				unlocked: impact.minutesRead >= 30,
				requirement: 'Read Scripture for over 30 cumulative minutes',
			},
			{
				id: 'morning_light',
				title: 'Morning Light',
				subtitle: 'Devotion',
				icon: '🕊️',
				unlocked: impact.sessions >= 3,
				requirement: 'Complete 3 Bible reading sessions with consistency',
			},
		],
		[impact.sessions, impact.minutesRead, timer.streak, blockedApps.length]
	);

	// Milestone calculation
	const getNextMilestone = (current: number) => {
		if (current < 3) return 3;
		if (current < 7) return 7;
		if (current < 14) return 14;
		if (current < 30) return 30;
		if (current < 50) return 50;
		return 100;
	};

	const nextMilestone = getNextMilestone(timer.streak);
	const milestoneProgress = Math.min(1, Math.max(0.05, timer.streak / nextMilestone));

	const minutesToday = Math.floor(timer.secondsRead / 60);

	// 7-day week schedule
	const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
	const weekDays = useMemo(
		() => [
			{ label: 'S', dayIndex: 0 },
			{ label: 'M', dayIndex: 1 },
			{ label: 'Tu', dayIndex: 2 },
			{ label: 'W', dayIndex: 3 },
			{ label: 'Th', dayIndex: 4 },
			{ label: 'F', dayIndex: 5 },
			{ label: 'S', dayIndex: 6 },
		],
		[]
	);

	const handleShareApp = async () => {
		try {
			await Share.share({
				message:
					'Join me in replacing mindless screen scrolling with God’s Word on Bible Unlock: https://bibleunlock.app',
			});
		} catch {
			// dismissed
		}
	};

	const totalVersesRead = impact.sessions > 0 ? impact.sessions * 14 + Math.floor(impact.minutesRead * 3) : 0;

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
			<ScrollView
				style={{ flex: 1 }}
				className='px-5'
				contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
				}
			>
				{/* Top Header Bar */}
				<View className='flex-row items-center justify-between pt-4 pb-3'>
					<Text
						style={{
							fontSize: 24,
							fontFamily: 'EBGaramond_700Bold',
							color: colors.textPrimary,
						}}
					>
						Stats
					</Text>

					<Pressable
						onPress={onRefresh}
						style={{
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: colors.surfaceSubtle,
							borderWidth: 1,
							borderColor: colors.border,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<RotateCw size={17} color={colors.textSecondary} />
					</Pressable>
				</View>

				{/* User Profile Row */}
				<View className='flex-row items-center my-3'>
					<View
						style={{
							width: 56,
							height: 56,
							borderRadius: 28,
							backgroundColor: colors.surfaceSubtle,
							borderWidth: 1,
							borderColor: colors.border,
							alignItems: 'center',
							justifyContent: 'center',
							marginRight: 14,
						}}
					>
						<Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.accent }}>
							{getInitials(name)}
						</Text>
					</View>
					<View className='flex-1'>
						<Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
							{name}
						</Text>
						<Text style={{ fontSize: 12, color: colors.textSecondary }}>Spiritual Walk Tracker</Text>
					</View>
				</View>

				{/* Section Header: Bible Reading */}
				<View className='flex-row items-center justify-between mt-4 mb-2'>
					<Text
						style={{
							fontSize: 12,
							fontFamily: 'Inter_700Bold',
							color: colors.textSecondary,
							textTransform: 'uppercase',
							letterSpacing: 1,
						}}
					>
						Bible Reading
					</Text>
					<MoreHorizontal size={16} color={colors.textMuted} />
				</View>

				{/* Card 1: Read Today & Streak with Circular Gauge */}
				<View
					style={{
						padding: 20,
						borderRadius: 24,
						backgroundColor: colors.surface,
						borderWidth: 1,
						borderColor: colors.border,
						marginBottom: 12,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
					}}
				>
					<View className='flex-1 pr-3'>
						<Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Read Today</Text>
						<View className='flex-row items-baseline mb-3'>
							<Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
								{minutesToday} min{' '}
							</Text>
							<Text style={{ fontSize: 14, color: colors.textMuted }}>/{timer.goalMinutes} min</Text>
						</View>

						<Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
							Current Streak
						</Text>
						<Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
							{timer.streak} {timer.streak === 1 ? 'day' : 'days'}
						</Text>
					</View>

					{/* Circular Gauge */}
					<View
						style={{
							width: 96,
							height: 96,
							borderRadius: 48,
							backgroundColor: colors.surfaceSubtle,
							borderWidth: 4,
							borderColor: colors.border,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<View
							style={{
								width: 64,
								height: 64,
								borderRadius: 32,
								alignItems: 'center',
								justifyContent: 'center',
								borderWidth: 2,
								backgroundColor: timer.isGoalMet
									? isDark
										? '#293d25'
										: '#edf8f0'
									: colors.surfaceSubtle,
								borderColor: timer.isGoalMet ? colors.success : colors.accent,
							}}
						>
							<Zap
								size={24}
								color={timer.isGoalMet ? colors.success : colors.accent}
								fill={timer.isGoalMet ? colors.success : colors.accent}
							/>
						</View>
					</View>
				</View>

				{/* Card 2: This Week 7-Day Tracker */}
				<View
					style={{
						padding: 20,
						borderRadius: 24,
						backgroundColor: colors.surface,
						borderWidth: 1,
						borderColor: colors.border,
						marginBottom: 12,
					}}
				>
					<View className='flex-row items-center justify-between mb-4'>
						<View className='flex-row items-center'>
							{(['week', 'month', 'year'] as const).map((p, i) => {
								const isSelected = historyPeriod === p;
								const isLocked = !isPremium && p !== 'week';
								const label = p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Year';
								return (
									<Pressable
										key={`${p}-${i}`}
										onPress={() => handleSelectPeriod(p)}
										style={{
											paddingHorizontal: 10,
											paddingVertical: 4,
											borderRadius: 12,
											marginRight: 6,
											backgroundColor: isSelected ? colors.accentBg : 'transparent',
											borderWidth: 1,
											borderColor: isSelected ? colors.accent : 'transparent',
											flexDirection: 'row',
											alignItems: 'center',
										}}
									>
										<Text
											style={{
												fontSize: 12,
												fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_500Medium',
												color: isSelected ? colors.accent : colors.textSecondary,
											}}
										>
											{label}
										</Text>
										{isLocked && (
											<Lock size={10} color={colors.textMuted} style={{ marginLeft: 3 }} />
										)}
									</Pressable>
								);
							})}
						</View>
						<Flame size={16} color='#ff7b42' />
					</View>

					{/* VIEW 1: WEEK */}
					{historyPeriod === 'week' && (
						<View className='flex-row items-center justify-between'>
							{weekDays.map((wd, i) => {
								const isToday = wd.dayIndex === todayDayOfWeek;
								const isPastOrToday = wd.dayIndex <= todayDayOfWeek;
								const hasRead = isToday ? minutesToday > 0 : isPastOrToday;
								const dayMins = isToday ? minutesToday : isPastOrToday ? (timer.streak > 0 ? 1 : 0) : 0;

								return (
									<View key={`${wd.label}-${i}`} className='items-center'>
										<View
											style={{
												width: 36,
												height: 36,
												borderRadius: 18,
												alignItems: 'center',
												justifyContent: 'center',
												borderWidth: 1,
												marginBottom: 6,
												backgroundColor: isToday
													? colors.accentBg
													: isPastOrToday
														? colors.surfaceSubtle
														: colors.surface,
												borderColor: isToday
													? colors.accent
													: isPastOrToday
														? colors.border
														: colors.borderSubtle,
											}}
										>
											<Text
												style={{
													fontSize: 12,
													fontFamily: 'Inter_700Bold',
													color: isToday
														? colors.accent
														: isPastOrToday
															? colors.textPrimary
															: colors.textMuted,
												}}
											>
												{wd.label}
											</Text>
										</View>

										<Text
											style={{
												fontSize: 10,
												fontFamily: isToday ? 'Inter_700Bold' : 'Inter_400Regular',
												color: isToday ? colors.accent : colors.textSecondary,
											}}
										>
											{dayMins}m
										</Text>

										{/* Active day underline marker */}
										{isToday ? (
											<View
												style={{
													width: 20,
													height: 2,
													backgroundColor: colors.accent,
													borderRadius: 1,
													marginTop: 6,
												}}
											/>
										) : (
											<View
												style={{
													width: 20,
													height: 2,
													backgroundColor: 'transparent',
													marginTop: 6,
												}}
											/>
										)}
									</View>
								);
							})}
						</View>
					)}

					{/* VIEW 2: MONTH (30-Day Calendar Heatmap Grid) */}
					{historyPeriod === 'month' && (() => {
						const monthTotalMinutes = history.reduce((acc, d) => acc + (d.minutesRead || 0), 0);
						const monthCompletedCount = history.filter((d) => d.completed).length;
						const monthDailyAvg = Math.round(monthTotalMinutes / (history.length || 30));
						const dayNamesOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
						const startDayIndex = history.length > 0 ? dayNamesOrder.indexOf(history[0].dayLabel) : 0;
						const leadingSpacers = Math.max(0, startDayIndex);

						return (
							<View>
								{/* Telemetry Summary Strip */}
								<View
									style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
										paddingVertical: 8,
										paddingHorizontal: 12,
										borderRadius: 12,
										backgroundColor: colors.surfaceSubtle,
										borderWidth: 1,
										borderColor: colors.border,
										marginBottom: 10,
									}}
								>
									<View>
										<Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: colors.textMuted, textTransform: 'uppercase' }}>
											Total Time
										</Text>
										<Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent }}>
											{monthTotalMinutes}m
										</Text>
									</View>
									<View style={{ alignItems: 'center' }}>
										<Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: colors.textMuted, textTransform: 'uppercase' }}>
											Goal Met
										</Text>
										<Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
											{monthCompletedCount}/30d
										</Text>
									</View>
									<View style={{ alignItems: 'flex-end' }}>
										<Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: colors.textMuted, textTransform: 'uppercase' }}>
											Daily Avg
										</Text>
										<Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
											{monthDailyAvg}m/d
										</Text>
									</View>
								</View>

								{/* Interactive Day Inspection Banner */}
								<View
									style={{
										paddingVertical: 6,
										paddingHorizontal: 10,
										borderRadius: 8,
										backgroundColor: colors.surfaceSubtle,
										borderWidth: 1,
										borderColor: colors.borderSubtle,
										marginBottom: 12,
									}}
								>
									<Text
										style={{
											fontSize: 11,
											fontFamily: 'Inter_500Medium',
											color: selectedDay ? colors.accent : colors.textSecondary,
											textAlign: 'center',
										}}
									>
										{selectedDay
											? `${selectedDay.date} (${selectedDay.dayLabel}) • ${selectedDay.minutesRead || 0}m read • ${selectedDay.completed ? 'Goal Met ✓' : (selectedDay.minutesRead || 0) > 0 ? 'Partial Reading' : 'No Reading'}`
											: 'Tap any day to view reading details'}
									</Text>
								</View>

								{/* Day of Week Headers */}
								<View style={{ flexDirection: 'row', marginBottom: 6 }}>
									{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dl, idx) => (
										<View key={`dow-${idx}`} style={{ flex: 1, alignItems: 'center' }}>
											<Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.textMuted }}>
												{dl}
											</Text>
										</View>
									))}
								</View>

								{/* 30-Day Grid */}
								<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
									{Array.from({ length: leadingSpacers }).map((_, idx) => (
										<View key={`spacer-${idx}`} style={{ width: '14.28%', height: 38 }} />
									))}
									{history.map((day) => {
										const isCompleted = day.completed;
										const isToday = day.isToday;
										const isSelected = selectedDay?.date === day.date;
										const hasMinutes = (day.minutesRead || 0) > 0;

										return (
											<Pressable
												key={day.date}
												onPress={() => setSelectedDay(day)}
												style={{ width: '14.28%', height: 38, alignItems: 'center', justifyContent: 'center' }}
											>
												<View
													style={{
														width: 32,
														height: 32,
														borderRadius: 8,
														alignItems: 'center',
														justifyContent: 'center',
														borderWidth: isSelected ? 2 : 1,
														borderColor: isSelected
															? colors.accent
															: isCompleted
															? colors.success
															: isToday
															? colors.accent
															: colors.borderSubtle,
														backgroundColor: isCompleted
															? (colors.successBg || '#1a4a35')
															: isToday
															? colors.accentBg
															: hasMinutes
															? colors.surfaceSubtle
															: colors.surface,
													}}
												>
													<Text
														style={{
															fontSize: 11,
															fontFamily: isToday || isCompleted || isSelected ? 'Inter_700Bold' : 'Inter_400Regular',
															color: isCompleted
																? colors.success
																: isToday || isSelected
																? colors.accent
																: hasMinutes
																? colors.textPrimary
																: colors.textMuted,
														}}
													>
														{day.dayNumber}
													</Text>
												</View>
											</Pressable>
										);
									})}
								</View>
							</View>
						);
					})()}

					{/* VIEW 3: YEAR (12-Month Activity Telemetry & Quarterly Seasons) */}
					{historyPeriod === 'year' && (() => {
						const yearTotalMinutes = yearHistory.reduce((acc, m) => acc + m.minutesRead, 0);
						const yearTotalHours = (yearTotalMinutes / 60).toFixed(1);
						const yearActiveDays = yearHistory.reduce((acc, m) => acc + m.daysCompleted, 0);
						const bestMonth = yearHistory.reduce<YearMonthData | null>((best, m) => {
							if (!best) return m;
							return m.minutesRead > best.minutesRead ? m : best;
						}, null);
						const maxMonthMinutes = Math.max(...yearHistory.map((m) => m.minutesRead), 60);

						// Active month defaults to current month if unselected
						const activeMonth =
							selectedMonth ||
							yearHistory.find((m) => m.isCurrentMonth) ||
							(yearHistory.length > 0 ? yearHistory[yearHistory.length - 1] : null);

						// Quarterly progress for current year
						const curYear = new Date().getFullYear();
						const curMonthIdx = new Date().getMonth();
						const curQuarterIdx = Math.floor(curMonthIdx / 3);

						const curYearMonths = yearHistory.filter((m) => m.year === curYear);
						const q1Months = curYearMonths.filter((m) => m.monthIndex >= 0 && m.monthIndex <= 2);
						const q2Months = curYearMonths.filter((m) => m.monthIndex >= 3 && m.monthIndex <= 5);
						const q3Months = curYearMonths.filter((m) => m.monthIndex >= 6 && m.monthIndex <= 8);
						const q4Months = curYearMonths.filter((m) => m.monthIndex >= 9 && m.monthIndex <= 11);

						const quarters = [
							{
								label: 'Q1',
								period: 'Jan–Mar',
								minutes: q1Months.reduce((a, m) => a + m.minutesRead, 0),
								days: q1Months.reduce((a, m) => a + m.daysCompleted, 0),
								isCurrent: curQuarterIdx === 0,
							},
							{
								label: 'Q2',
								period: 'Apr–Jun',
								minutes: q2Months.reduce((a, m) => a + m.minutesRead, 0),
								days: q2Months.reduce((a, m) => a + m.daysCompleted, 0),
								isCurrent: curQuarterIdx === 1,
							},
							{
								label: 'Q3',
								period: 'Jul–Sep',
								minutes: q3Months.reduce((a, m) => a + m.minutesRead, 0),
								days: q3Months.reduce((a, m) => a + m.daysCompleted, 0),
								isCurrent: curQuarterIdx === 2,
							},
							{
								label: 'Q4',
								period: 'Oct–Dec',
								minutes: q4Months.reduce((a, m) => a + m.minutesRead, 0),
								days: q4Months.reduce((a, m) => a + m.daysCompleted, 0),
								isCurrent: curQuarterIdx === 3,
							},
						];

						return (
							<View>
								{/* Telemetry Summary Strip */}
								<View
									style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
										paddingVertical: 10,
										paddingHorizontal: 14,
										borderRadius: 12,
										backgroundColor: colors.surfaceSubtle,
										borderWidth: 1,
										borderColor: colors.border,
										marginBottom: 12,
									}}
								>
									<View>
										<Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
											Annual Time
										</Text>
										<Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.accent, marginTop: 2 }}>
											{yearTotalHours} hrs
										</Text>
									</View>
									<View style={{ alignItems: 'center' }}>
										<Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
											Days in Word
										</Text>
										<Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginTop: 2 }}>
											{yearActiveDays} / 365
										</Text>
									</View>
									<View style={{ alignItems: 'flex-end' }}>
										<Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
											Best Month
										</Text>
										<Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginTop: 2 }}>
											{bestMonth && bestMonth.minutesRead > 0 ? `${bestMonth.monthLabel} (${bestMonth.minutesRead}m)` : '—'}
										</Text>
									</View>
								</View>

								{/* Active Month Inspection Card */}
								{activeMonth && (
									<View
										style={{
											padding: 12,
											borderRadius: 14,
											backgroundColor: colors.surfaceSubtle,
											borderWidth: 1,
											borderColor: activeMonth.isCurrentMonth ? colors.accent : colors.border,
											marginBottom: 14,
										}}
									>
										<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
											<View style={{ flexDirection: 'row', alignItems: 'center' }}>
												<Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginRight: 8 }}>
													{activeMonth.monthLabel} {activeMonth.year}
												</Text>
												{activeMonth.isCurrentMonth && (
													<View
														style={{
															paddingHorizontal: 6,
															paddingVertical: 2,
															borderRadius: 6,
															backgroundColor: colors.accentBg,
															borderWidth: 1,
															borderColor: colors.accent,
														}}
													>
														<Text style={{ fontSize: 8, fontFamily: 'Inter_700Bold', color: colors.accent, letterSpacing: 0.5 }}>
															CURRENT
														</Text>
													</View>
												)}
											</View>
											<Text
												style={{
													fontSize: 13,
													fontFamily: 'Inter_700Bold',
													color: activeMonth.minutesRead > 0 ? colors.accent : colors.textMuted,
												}}
											>
												{activeMonth.minutesRead} min read
											</Text>
										</View>

										<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
											<Text style={{ fontSize: 11, color: colors.textSecondary }}>
												Days Met: <Text style={{ fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>{activeMonth.daysCompleted}/{activeMonth.totalDays}</Text>
											</Text>
											<Text style={{ fontSize: 11, color: colors.textSecondary }}>
												Fidelity: <Text style={{ fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>{Math.round((activeMonth.daysCompleted / activeMonth.totalDays) * 100)}%</Text>
											</Text>
										</View>
									</View>
								)}

								{/* 12-Month Telemetry Pillar Chart */}
								<View
									style={{
										paddingVertical: 14,
										paddingHorizontal: 6,
										borderRadius: 16,
										backgroundColor: colors.surface,
										borderWidth: 1,
										borderColor: colors.border,
										position: 'relative',
									}}
								>
									{/* Benchmark Baseline Target Line */}
									<View
										style={{
											position: 'absolute',
											top: 35,
											left: 12,
											right: 12,
											height: 1,
											borderTopWidth: 1,
											borderStyle: 'dashed',
											borderColor: colors.borderSubtle,
										}}
									/>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 6 }}>
										<Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
											Monthly Activity Telemetry
										</Text>
										<Text style={{ fontSize: 9, fontFamily: 'Inter_500Medium', color: colors.textMuted }}>
											Target: 5h/mo
										</Text>
									</View>

									<View
										style={{
											height: 105,
											flexDirection: 'row',
											alignItems: 'flex-end',
											justifyContent: 'space-between',
										}}
									>
										{yearHistory.map((m) => {
											const isSelected = activeMonth?.monthIndex === m.monthIndex && activeMonth?.year === m.year;
											const hasRead = m.minutesRead > 0;
											const fillPercent = Math.min(100, Math.max(hasRead ? 14 : 0, Math.round((m.minutesRead / maxMonthMinutes) * 100)));

											return (
												<Pressable
													key={`${m.year}-${m.monthIndex}`}
													onPress={() => setSelectedMonth(m)}
													style={{ flex: 1, alignItems: 'center' }}
												>
													{/* Pillar Column Track */}
													<View
														style={{
															width: 16,
															height: 80,
															borderRadius: 5,
															backgroundColor: colors.surfaceSubtle,
															borderWidth: 1,
															borderColor: isSelected
																? colors.accent
																: m.isCurrentMonth
																? colors.accent
																: colors.borderSubtle,
															justifyContent: 'flex-end',
															overflow: 'hidden',
														}}
													>
														{/* Filled Progress Bar */}
														<View
															style={{
																width: '100%',
																height: `${fillPercent}%`,
																backgroundColor: isSelected
																	? colors.accent
																	: m.isCurrentMonth
																	? colors.accent
																	: hasRead
																	? colors.success
																	: 'transparent',
																borderRadius: 3,
															}}
														/>
													</View>

													{/* Month Abbreviation Label */}
													<Text
														style={{
															fontSize: 9,
															fontFamily: m.isCurrentMonth || isSelected ? 'Inter_700Bold' : 'Inter_500Medium',
															color: isSelected
																? colors.accent
																: m.isCurrentMonth
																? colors.accent
																: colors.textSecondary,
															marginTop: 6,
														}}
													>
														{m.monthLabel}
													</Text>

													{/* Current Month Active Dot */}
													{m.isCurrentMonth ? (
														<View
															style={{
																width: 4,
																height: 4,
																borderRadius: 2,
																backgroundColor: colors.accent,
																marginTop: 2,
															}}
														/>
													) : (
														<View style={{ width: 4, height: 4, marginTop: 2 }} />
													)}
												</Pressable>
											);
										})}
									</View>
								</View>

								{/* 4-Quarter Annual Rhythm Section */}
								<View style={{ marginTop: 14 }}>
									<Text
										style={{
											fontSize: 10,
											fontFamily: 'Inter_700Bold',
											color: colors.textMuted,
											textTransform: 'uppercase',
											letterSpacing: 0.5,
											marginBottom: 8,
										}}
									>
										{curYear} Seasonal Quarters
									</Text>
									<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
										{quarters.map((q) => (
											<View
												key={q.label}
												style={{
													flex: 1,
													marginHorizontal: 3,
													paddingVertical: 8,
													paddingHorizontal: 6,
													borderRadius: 10,
													backgroundColor: colors.surfaceSubtle,
													borderWidth: 1,
													borderColor: q.isCurrent ? colors.accent : colors.borderSubtle,
													alignItems: 'center',
												}}
											>
												<View style={{ flexDirection: 'row', alignItems: 'center' }}>
													<Text
														style={{
															fontSize: 11,
															fontFamily: 'Inter_700Bold',
															color: q.isCurrent ? colors.accent : colors.textPrimary,
														}}
													>
														{q.label}
													</Text>
													{q.isCurrent && (
														<View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginLeft: 3 }} />
													)}
												</View>
												<Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>
													{q.period}
												</Text>
												<Text
													style={{
														fontSize: 10,
														fontFamily: 'Inter_700Bold',
														color: q.minutes > 0 ? colors.accent : colors.textMuted,
														marginTop: 4,
													}}
												>
													{q.minutes > 0 ? `${q.minutes}m` : '—'}
												</Text>
											</View>
										))}
									</View>
								</View>
							</View>
						);
					})()}
				</View>

				{/* Card 3: Milestone Progress Bar */}
				<View
					style={{
						padding: 16,
						borderRadius: 16,
						backgroundColor: colors.surface,
						borderWidth: 1,
						borderColor: colors.border,
						marginBottom: 16,
					}}
				>
					<View className='flex-row items-center justify-between mb-2'>
						<View>
							<Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
								{timer.streak}d
							</Text>
							<Text style={{ fontSize: 10, color: colors.textSecondary }}>Current Streak</Text>
						</View>

						<View className='items-end'>
							<Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.accent }}>
								{nextMilestone}d
							</Text>
							<Text style={{ fontSize: 10, color: colors.textSecondary }}>Next Milestone</Text>
						</View>
					</View>

					{/* Progress Bar */}
					<View
						style={{
							width: '100%',
							height: 8,
							backgroundColor: colors.surfaceSubtle,
							borderRadius: 4,
							overflow: 'hidden',
						}}
					>
						<View
							style={{
								height: '100%',
								backgroundColor: colors.accent,
								borderRadius: 4,
								width: `${Math.round(milestoneProgress * 100)}%`,
							}}
						/>
					</View>
				</View>

				{/* Badges Section */}
				<View className='my-2'>
					<BadgesGrid badges={badges} onSelectBadge={(b) => setSelectedBadge(b)} />
				</View>

				{/* Daily Devotional Card */}
				<View className='my-3'>
					<DailyDevotionalCard />
				</View>

				{/* Section: Lifetime Activity */}
				<View className='mt-4 mb-2'>
					<Text
						style={{
							fontSize: 12,
							fontFamily: 'Inter_700Bold',
							color: colors.textSecondary,
							textTransform: 'uppercase',
							letterSpacing: 1,
							marginBottom: 12,
							paddingHorizontal: 4,
						}}
					>
						Lifetime Activity
					</Text>

					<View className='flex-row justify-between'>
						{/* Verses Read */}
						<View
							style={{
								flex: 1,
								marginRight: 6,
								padding: 16,
								borderRadius: 16,
								backgroundColor: colors.surface,
								borderWidth: 1,
								borderColor: colors.border,
								alignItems: 'center',
							}}
						>
							<View
								style={{
									width: 36,
									height: 36,
									borderRadius: 10,
									backgroundColor: colors.surfaceSubtle,
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: 8,
								}}
							>
								<Zap size={18} color={colors.accent} />
							</View>
							<Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
								{totalVersesRead}
							</Text>
							<Text
								style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}
							>
								Verses Read
							</Text>
						</View>

						{/* Time Spent */}
						<View
							style={{
								flex: 1,
								marginHorizontal: 4,
								padding: 16,
								borderRadius: 16,
								backgroundColor: colors.surface,
								borderWidth: 1,
								borderColor: colors.border,
								alignItems: 'center',
							}}
						>
							<View
								style={{
									width: 36,
									height: 36,
									borderRadius: 10,
									backgroundColor: colors.surfaceSubtle,
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: 8,
								}}
							>
								<Clock size={18} color={colors.accent} />
							</View>
							<Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
								{impact.minutesRead}m
							</Text>
							<Text
								style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}
							>
								Time Spent
							</Text>
						</View>

						{/* Best Streak */}
						<View
							style={{
								flex: 1,
								marginLeft: 6,
								padding: 16,
								borderRadius: 16,
								backgroundColor: colors.surface,
								borderWidth: 1,
								borderColor: colors.border,
								alignItems: 'center',
							}}
						>
							<View
								style={{
									width: 36,
									height: 36,
									borderRadius: 10,
									backgroundColor: colors.surfaceSubtle,
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: 8,
								}}
							>
								<Award size={18} color={colors.accent} />
							</View>
							<Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary }}>
								{Math.max(timer.streak, 1)}d
							</Text>
							<Text
								style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}
							>
								Best Streak
							</Text>
						</View>
					</View>
				</View>

				{/* Section: Our Week in Review / Community Impact */}
				<View
					style={{
						marginTop: 20,
						padding: 20,
						borderRadius: 24,
						backgroundColor: colors.surface,
						borderWidth: 1,
						borderColor: colors.border,
					}}
				>
					<Text
						style={{
							fontSize: 12,
							fontFamily: 'Inter_500Medium',
							color: colors.textSecondary,
							textAlign: 'center',
							textTransform: 'uppercase',
							letterSpacing: 1.5,
							marginBottom: 16,
						}}
					>
						Our Week in Review
					</Text>

					<View
						style={{
							padding: 16,
							borderRadius: 16,
							backgroundColor: colors.surfaceSubtle,
							borderWidth: 1,
							borderColor: colors.border,
							marginBottom: 12,
							alignItems: 'center',
						}}
					>
						<Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.success }}>145.9M</Text>
						<Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
							Total Verses Read
						</Text>
					</View>

					<View
						style={{
							padding: 16,
							borderRadius: 16,
							backgroundColor: colors.surfaceSubtle,
							borderWidth: 1,
							borderColor: colors.border,
							marginBottom: 16,
							alignItems: 'center',
						}}
					>
						<Text style={{ fontSize: 24, fontFamily: 'Inter_700Bold', color: '#4fa6e8' }}>
							434.1M minutes
						</Text>
						<Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
							Time Spent in Scripture
						</Text>
					</View>

					<Text
						style={{
							fontSize: 12,
							color: colors.textSecondary,
							textAlign: 'center',
							lineHeight: 18,
							marginBottom: 16,
							paddingHorizontal: 8,
						}}
					>
						See the impact from disciples worldwide! Keep the momentum alive — share Bible Unlock today.
					</Text>

					<Pressable
						onPress={handleShareApp}
						style={{
							width: '100%',
							paddingVertical: 14,
							borderRadius: 16,
							backgroundColor: colors.accent,
							alignItems: 'center',
							justifyContent: 'center',
							flexDirection: 'row',
						}}
					>
						<Share2 size={16} color='#141413' style={{ marginRight: 8 }} />
						<Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: '#141413' }}>
							Share Bible Unlock
						</Text>
					</Pressable>
				</View>
			</ScrollView>

			{/* Badge Detail Modal */}
			<BadgeShareModal
				badge={selectedBadge}
				userName={name}
				streak={timer.streak}
				onClose={() => setSelectedBadge(null)}
			/>
		</SafeAreaView>
	);
}
