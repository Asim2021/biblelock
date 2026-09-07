import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';

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
  const [stage, setStage] = useState<'time' | 'duration'>('time');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerHour, setPickerHour] = useState('07');
  const [pickerMin, setPickerMin] = useState('00');
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>('AM');

  const handleAddTime = () => {
    const formatted = `${pickerHour}:${pickerMin} ${pickerPeriod}`;
    if (!readingTimes.includes(formatted)) {
      setReadingTimes([...readingTimes, formatted]);
    }
    setShowPicker(false);
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

  return (
    <View className="flex-1 justify-between px-6 py-6 bg-[#0d2e24]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}>
        {/* Top 5-segment Progress Bar */}
        <View className="flex-row space-x-1.5 pt-4 mb-4">
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
            <Text className="text-xs font-sans-bold text-[#f5b800] mb-3">
              1 of 5
            </Text>

            <Text
              className="text-3xl font-serif-bold text-[#faf9f5] mb-2 tracking-tight"
              style={{ fontFamily: 'EBGaramond_700Bold' }}
            >
              When do you want to read Scripture, {userName}?
            </Text>

            <Text className="text-sm font-sans text-[#78a898] mb-6 leading-relaxed">
              Your apps will be blocked at the times you select, until you read the Bible.
            </Text>

            {/* Tip box */}
            <View className="p-4 rounded-2xl bg-[#143e32] border border-[#205243] mb-6">
              <Text className="text-xs font-sans text-[#c8ded6] leading-relaxed">
                💡 <Text className="font-sans-bold text-[#f5b800]">Tip:</Text> You can add multiple times — most people read in the morning, afternoon, or before bed.
              </Text>
            </View>

            {/* Empty or Times List Card */}
            {readingTimes.length === 0 ? (
              <View className="p-8 rounded-2xl bg-[#12382d] border border-[#1e4d3f] items-center mb-6">
                <Text className="text-6xl mb-4">⏰</Text>
                <Text className="text-lg font-sans-bold text-[#faf9f5] mb-2">
                  No times added yet
                </Text>
                <Text className="text-xs font-sans text-[#78a898] text-center">
                  Tap the button below to choose when you'd like to read
                </Text>
              </View>
            ) : (
              <View className="space-y-3 mb-6">
                {readingTimes.map((timeStr, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between p-4 rounded-2xl bg-[#174637] border border-[#265e4d] mb-3"
                  >
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-full bg-[#1e5241] items-center justify-center mr-3">
                        <Text className="text-xs font-sans-bold text-[#f5b800]">
                          {idx + 1}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-xs font-sans text-[#78a898]">
                          Reading Time {idx + 1}
                        </Text>
                        <Text className="text-xl font-sans-bold text-[#faf9f5]">
                          {timeStr}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => removeTime(idx)}
                      className="w-8 h-8 rounded-full bg-[#332222] items-center justify-center active:opacity-70"
                    >
                      <Text className="text-sm font-bold text-[#f26666]">✕</Text>
                    </Pressable>
                  </View>
                ))}

                <View className="items-center my-2">
                  <View className="px-4 py-1.5 rounded-full bg-[#174637] border border-[#2b6b55]">
                    <Text className="text-xs font-sans-medium text-[#78a898]">
                      {readingTimes.length} reading {readingTimes.length === 1 ? 'time' : 'times'} set
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Add time button */}
            <Pressable
              onPress={() => setShowPicker(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-[#f5b800]/50 items-center justify-center active:bg-[#1a4a3c] mb-6"
            >
              <Text className="text-sm font-sans-bold text-[#f5b800]">
                + {readingTimes.length === 0 ? 'Add a Reading Time' : 'Add Another Time'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Stage 2: Duration */}
        {stage === 'duration' && (
          <View>
            <Text className="text-xs font-sans-bold text-[#f5b800] mb-3">
              2 of 5
            </Text>

            <Text
              className="text-3xl font-serif-bold text-[#faf9f5] mb-2 tracking-tight"
              style={{ fontFamily: 'EBGaramond_700Bold' }}
            >
              {userName}'s reading plan is ready
            </Text>

            <Text className="text-sm font-sans text-[#78a898] mb-6">
              Choose your reading duration
            </Text>

            {/* Duration cards */}
            <View className="flex-row justify-between mb-6">
              {[5, 10, 15, 30].map((mins) => {
                const isSelected = durationMinutes === mins;
                return (
                  <Pressable
                    key={mins}
                    onPress={() => setDurationMinutes(mins)}
                    className={`flex-1 mx-1 p-3 rounded-2xl items-center justify-center border ${
                      isSelected
                        ? 'border-[#f5b800] bg-[#1a4a3b]'
                        : 'border-[#205243] bg-[#12382d]'
                    }`}
                  >
                    <Text className="text-2xl font-sans-bold text-[#faf9f5] mb-1">
                      {mins}
                    </Text>
                    <Text className={`text-[11px] font-sans ${isSelected ? 'text-[#f5b800]' : 'text-[#78a898]'}`}>
                      minutes
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Plan Summary Card */}
            <View className="p-5 rounded-2xl bg-[#143e32] border border-[#265e4d] mb-6">
              <Text className="text-base font-sans-bold text-[#f5b800] mb-4">
                Your apps will be blocked every day at:
              </Text>

              {readingTimes.map((t, i) => (
                <View key={i} className="flex-row items-center mb-3">
                  <Text className="text-xl mr-3">🕒</Text>
                  <Text className="text-lg font-sans-bold text-[#faf9f5]">{t}</Text>
                </View>
              ))}

              <View className="h-[1px] bg-[#225746] my-2" />

              <View className="flex-row items-center mt-2">
                <Text className="text-lg mr-3">⏱️</Text>
                <Text className="text-sm font-sans text-[#c8ded6]">
                  {durationMinutes} minutes per session
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav Buttons */}
      <View className="flex-row space-x-3 pt-2">
        <Pressable
          onPress={stage === 'time' ? onBack : () => setStage('time')}
          className="flex-1 py-4 mr-2 rounded-2xl bg-[#163f33] border border-[#2b6955] items-center justify-center active:opacity-80"
        >
          <Text className="text-base font-sans-bold text-[#78a898]">Back</Text>
        </Pressable>

        <Pressable
          onPress={stage === 'time' ? handleTimeNext : onNext}
          className="flex-1 py-4 ml-2 rounded-2xl bg-[#f5b800] items-center justify-center active:opacity-90 shadow-lg"
        >
          <Text className="text-base font-sans-bold text-[#141413]">Next</Text>
        </Pressable>
      </View>

      {/* Time Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="w-full bg-[#182e25] border border-[#2d5c4b] rounded-3xl p-6 shadow-2xl">
            <Text className="text-xl font-sans-bold text-[#faf9f5] text-center mb-6">
              Select Reading Time
            </Text>

            {/* Digital selector row */}
            <View className="flex-row justify-center items-center space-x-4 mb-8">
              {/* Hours */}
              <View className="items-center">
                <Text className="text-xs text-[#78a898] mb-1">Hour</Text>
                <View className="flex-row flex-wrap w-24 justify-center">
                  {['06', '07', '08', '09', '12', '05', '08', '10'].map((h) => (
                    <Pressable
                      key={h}
                      onPress={() => setPickerHour(h)}
                      className={`px-2 py-1 m-1 rounded-lg ${pickerHour === h ? 'bg-[#f5b800]' : 'bg-[#12382d]'}`}
                    >
                      <Text className={`text-sm font-sans-bold ${pickerHour === h ? 'text-black' : 'text-white'}`}>
                        {h}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Text className="text-2xl font-bold text-[#f5b800] mb-4">:</Text>

              {/* Minutes */}
              <View className="items-center">
                <Text className="text-xs text-[#78a898] mb-1">Minute</Text>
                <View className="flex-row flex-wrap w-24 justify-center">
                  {['00', '15', '30', '45'].map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setPickerMin(m)}
                      className={`px-2 py-1 m-1 rounded-lg ${pickerMin === m ? 'bg-[#f5b800]' : 'bg-[#12382d]'}`}
                    >
                      <Text className={`text-sm font-sans-bold ${pickerMin === m ? 'text-black' : 'text-white'}`}>
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Period */}
              <View className="items-center">
                <Text className="text-xs text-[#78a898] mb-1">Period</Text>
                <View className="space-y-2">
                  <Pressable
                    onPress={() => setPickerPeriod('AM')}
                    className={`px-3 py-1.5 rounded-lg mb-2 ${pickerPeriod === 'AM' ? 'bg-[#f5b800]' : 'bg-[#12382d]'}`}
                  >
                    <Text className={`text-sm font-sans-bold ${pickerPeriod === 'AM' ? 'text-black' : 'text-white'}`}>
                      AM
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPickerPeriod('PM')}
                    className={`px-3 py-1.5 rounded-lg ${pickerPeriod === 'PM' ? 'bg-[#f5b800]' : 'bg-[#12382d]'}`}
                  >
                    <Text className={`text-sm font-sans-bold ${pickerPeriod === 'PM' ? 'text-black' : 'text-white'}`}>
                      PM
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between space-x-3">
              <Pressable
                onPress={() => setShowPicker(false)}
                className="flex-1 py-3 mr-2 rounded-xl bg-[#163f33] items-center"
              >
                <Text className="text-sm font-sans-bold text-[#78a898]">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddTime}
                className="flex-1 py-3 ml-2 rounded-xl bg-[#f5b800] items-center"
              >
                <Text className="text-sm font-sans-bold text-black">OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
