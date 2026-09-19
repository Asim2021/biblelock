import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Plus, Trash2, Timer, Check } from 'lucide-react-native';
import { TimePickerModal } from '../TimePickerModal';

interface PlanStepProps {
	userName: string;
	readingTimes: string[];
	setReadingTimes: (times: string[]) => void;
	durationMinutes: number;
	setDurationMinutes: (min: number) => void;
	onBack: () => void;
	onNext: () => void;
}

export const PlanStep: React.FC<PlanStepProps> = ({
	userName,
	readingTimes,
	setReadingTimes,
	durationMinutes,
	setDurationMinutes,
	onBack,
	onNext,
}) => {
	const insets = useSafeAreaInsets();
	const [stage, setStage] = useState<'time' | 'duration'>('time');
	const [showPicker, setShowPicker] = useState(false);

	const handleAddTime = (formatted: string) => {
		if (!readingTimes.includes(formatted)) {
			setReadingTimes([...readingTimes, formatted]);
		}
	};

	const removeTime = (index: number) => {
		setReadingTimes(readingTimes.filter((_, idx) => idx !== index));
	};

	const handleTimeNext = () => {
		if (readingTimes.length === 0) {
			setReadingTimes(['7:00 AM']);
		}
		setStage('duration');
	};

	const cleanName = userName.trim();

	return (
		<View
			className='flex-1 justify-between px-6 py-4 bg-[#0d2e24]'
			style={{ paddingBottom: Math.max(16, insets.bottom + 8) }}
		>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
			>
				{/* Top 5-segment Progress Bar */}
				<View className='flex-row space-x-1.5 pt-4 mb-4'>
					{[1, 2, 3, 4, 5].map((idx) => (
						<View
							key={idx}
							className={`flex-1 h-1 rounded-full mr-1.5 ${
								(stage === 'time' && idx === 1) || (stage === 'duration' && idx <= 2)
									? 'bg-[#f5b800]'
									: 'bg-[#1b4a3c]'
							}`}
						/>
					))}
				</View>

				{/* Stage 1: Reading Times */}
				{stage === 'time' && (
					<View>
						<Text className='text-xs font-sans-bold text-[#f5b800] mb-3'>1 of 5</Text>

						<Text
							className='text-[32px] font-serif-bold text-[#faf9f5] mb-2 tracking-tight leading-[40px]'
							style={{ fontFamily: 'EBGaramond_700Bold' }}
						>
							When would you like your time with Jesus{cleanName ? `, ${cleanName}` : ''}?
						</Text>

						<Text className='text-base font-sans text-[#78a898] mb-6 leading-relaxed'>
							Choose the moment in your day you want to set apart for Jesus. We'll hold the noise of the
							world at bay so you can be still in His presence.
						</Text>

						{/* Tip box */}
						<View className='p-4 rounded-2xl bg-[#143e32] border border-[#205243] mb-6 flex-row items-start'>
							<Clock size={16} color='#f5b800' style={{ marginTop: 2, marginRight: 8 }} />
							<Text className='text-[13px] font-sans text-[#c8ded6] leading-[19px] flex-1'>
								<Text className='font-sans-bold text-[#f5b800]'>Tip:</Text> Many disciples begin their
								day as Jesus did, in quiet prayer, or end their day resting in His peace. You can change
								this at any time in Settings.
							</Text>
						</View>

						{/* Empty or Times List Card */}
						{readingTimes.length === 0 ? (
							<View className='p-8 rounded-2xl bg-[#12382d] border border-[#1e4d3f] items-center mb-6'>
								<Clock size={48} color='#f5b800' strokeWidth={1.5} style={{ marginBottom: 16 }} />
								<Text className='text-lg font-sans-bold text-[#faf9f5] mb-2'>No times added yet</Text>
								<Text className='text-xs font-sans text-[#78a898] text-center'>
									Tap below to choose when you want to meet with your Lord.
								</Text>
							</View>
						) : (
							<View className='space-y-3 mb-6'>
								{readingTimes.map((timeStr, idx) => (
									<View
										key={timeStr}
										className='flex-row items-center justify-between p-4 rounded-2xl bg-[#174637] border border-[#265e4d] mb-3'
									>
										<View className='flex-row items-center'>
											<View className='w-8 h-8 rounded-full bg-[#1e5241] items-center justify-center mr-3'>
												<Text className='text-xs font-sans-bold text-[#f5b800]'>{idx + 1}</Text>
											</View>
											<View>
												<Text className='text-xs font-sans text-[#78a898]'>
													Reading Time {idx + 1}
												</Text>
												<Text className='text-xl font-sans-bold text-[#faf9f5]'>{timeStr}</Text>
											</View>
										</View>

										<Pressable
											onPress={() => removeTime(idx)}
											className='w-9 h-9 rounded-full bg-[#332222] items-center justify-center active:opacity-70'
										>
											<Trash2 size={16} color='#f26666' />
										</Pressable>
									</View>
								))}

								<View className='items-center my-2'>
									<View className='px-4 py-1.5 rounded-full bg-[#174637] border border-[#2b6b55]'>
										<Text className='text-xs font-sans-medium text-[#78a898]'>
											{readingTimes.length} reading {readingTimes.length === 1 ? 'time' : 'times'}{' '}
											set
										</Text>
									</View>
								</View>
							</View>
						)}

						{/* Add time button */}
						<Pressable
							onPress={() => setShowPicker(true)}
							className='w-full py-4.5 rounded-2xl border-2 border-dashed border-[#f5b800]/50 items-center justify-center flex-row active:bg-[#1a4a3c] mb-6'
						>
							<Plus size={18} color='#f5b800' style={{ marginRight: 6 }} />
							<Text className='text-base font-sans-bold text-[#f5b800]'>
								{readingTimes.length === 0 ? 'Add a Reading Time' : 'Add Another Time'}
							</Text>
						</Pressable>
					</View>
				)}

				{/* Stage 2: Duration */}
				{stage === 'duration' && (
					<View>
						<Text className='text-xs font-sans-bold text-[#f5b800] mb-3'>2 of 5</Text>

						<Text
							className='text-[32px] font-serif-bold text-[#faf9f5] mb-2 tracking-tight leading-[40px]'
							style={{ fontFamily: 'EBGaramond_700Bold' }}
						>
							How much time can you give each day{cleanName ? `, ${cleanName}` : ''}?
						</Text>

						<Text className='text-base font-sans text-[#78a898] mb-6 leading-relaxed'>
							Even 5 to 10 quiet minutes in Bible can transform your heart. Start small, may Jesus honors
							every step you take toward Him.
						</Text>

						{/* Duration cards */}
						<View className='flex-row justify-between mb-6'>
							{[5, 10, 15, 30].map((mins) => {
								const isSelected = durationMinutes === mins;
								return (
									<Pressable
										key={mins}
										onPress={() => setDurationMinutes(mins)}
										className={`flex-1 mx-1 p-3 rounded-2xl items-center justify-center border relative ${
											isSelected
												? 'border-[#f5b800] bg-[#1a4a3b]'
												: 'border-[#205243] bg-[#12382d]'
										}`}
									>
										{mins === 30 && (
											<View className='absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-[#f5b800]/20 border border-[#f5b800]/40'>
												<Text className='text-[8px] font-sans-bold text-[#f5b800]'>PRO</Text>
											</View>
										)}
										<Text className='text-2xl font-sans-bold text-[#faf9f5] mb-1'>{mins}</Text>
										<Text
											className={`text-xs font-sans ${isSelected ? 'text-[#f5b800]' : 'text-[#78a898]'}`}
										>
											minutes
										</Text>
									</Pressable>
								);
							})}
						</View>

						{/* Plan Summary Card */}
						<View className='p-5 rounded-2xl bg-[#143e32] border border-[#265e4d] mb-6'>
							<Text className='text-base font-sans-bold text-[#f5b800] mb-4'>
								Your time with Jesus is protected every day at:
							</Text>

							{readingTimes.map((t) => (
								<View key={t} className='flex-row items-center mb-3'>
									<Clock size={18} color='#f5b800' style={{ marginRight: 10 }} />
									<Text className='text-lg font-sans-bold text-[#faf9f5]'>{t}</Text>
								</View>
							))}

							<View className='h-[1px] bg-[#225746] my-3' />

							<View className='flex-row items-center'>
								<Timer size={18} color='#78a898' style={{ marginRight: 10 }} />
								<Text className='text-sm font-sans text-[#c8ded6]'>
									{durationMinutes} minutes per session
								</Text>
							</View>
						</View>
					</View>
				)}
			</ScrollView>

			{/* Bottom Nav Buttons */}
			<View className='flex-row space-x-3 pt-2'>
				<Pressable
					onPress={stage === 'time' ? onBack : () => setStage('time')}
					className='flex-1 py-4.5 mr-2 rounded-2xl bg-[#163f33] border border-[#2b6955] items-center justify-center active:opacity-80'
				>
					<Text className='text-lg font-sans-bold text-[#78a898]'>Back</Text>
				</Pressable>

				<Pressable
					onPress={stage === 'time' ? handleTimeNext : onNext}
					className='flex-1 py-4.5 ml-2 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg'
				>
					<Text className='text-lg font-sans-bold text-[#141413]'>Next</Text>
				</Pressable>
			</View>

			{/* Reusable Time Picker Modal */}
			<TimePickerModal visible={showPicker} onClose={() => setShowPicker(false)} onSave={handleAddTime} />
		</View>
	);
};
