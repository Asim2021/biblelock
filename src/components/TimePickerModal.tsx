import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Clock, X, Check } from 'lucide-react-native';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (time: string) => void;
  initialTime?: string;
  title?: string;
}

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '15', '30', '45'];

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onSave,
  initialTime = '7:00 AM',
  title = 'Select Reading Time',
}) => {
  const [pickerHour, setPickerHour] = useState('07');
  const [pickerMin, setPickerMin] = useState('00');
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (visible && initialTime) {
      try {
        const parts = initialTime.split(' ');
        const period = parts[1] === 'PM' ? 'PM' : 'AM';
        const [h, m] = parts[0].split(':');
        const formattedH = h.padStart(2, '0');
        if (HOURS.includes(formattedH)) {
          setPickerHour(formattedH);
        }
        if (MINUTES.includes(m)) {
          setPickerMin(m);
        }
        setPickerPeriod(period);
      } catch {
        // Fall back to default 7:00 AM
        setPickerHour('07');
        setPickerMin('00');
        setPickerPeriod('AM');
      }
    }
  }, [visible, initialTime]);

  const handleSave = () => {
    const formatted = `${parseInt(pickerHour, 10)}:${pickerMin} ${pickerPeriod}`;
    onSave(formatted);
    onClose();
  };

  const previewTime = `${parseInt(pickerHour, 10)}:${pickerMin} ${pickerPeriod}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-center items-center px-5">
        <View className="w-full max-w-sm bg-[#182e25] border border-[#2d5c4b] rounded-3xl p-6 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-[#12382d] items-center justify-center mr-2.5">
                <Clock size={16} color="#f5b800" />
              </View>
              <Text className="text-lg font-sans-bold text-[#faf9f5]">
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close time picker"
              className="w-8 h-8 rounded-full bg-[#12382d] items-center justify-center active:opacity-70"
            >
              <X size={16} color="#78a898" />
            </Pressable>
          </View>

          {/* Time Preview Badge */}
          <View className="items-center py-3 px-4 rounded-2xl bg-[#0f241d] border border-[#1e483a] mb-5">
            <Text className="text-xs font-sans-medium text-[#78a898] mb-0.5">
              Scheduled Reminder
            </Text>
            <Text className="text-3xl font-sans-bold text-[#f5b800] tracking-wide">
              {previewTime}
            </Text>
          </View>

          {/* Hours Grid */}
          <View className="mb-4">
            <Text className="text-xs font-sans-bold text-[#78a898] mb-2 text-center">
              Select Hour
            </Text>
            <View className="flex-row flex-wrap justify-center">
              {HOURS.map((h) => {
                const isSelected = pickerHour === h;
                const hourNum = parseInt(h, 10);
                return (
                  <Pressable
                    key={h}
                    onPress={() => setPickerHour(h)}
                    accessibilityRole="button"
                    accessibilityLabel={`Hour ${hourNum}`}
                    accessibilityState={{ selected: isSelected }}
                    className={`w-11 h-11 m-1 rounded-xl items-center justify-center ${
                      isSelected ? 'bg-[#f5b800]' : 'bg-[#12382d] border border-[#205243]'
                    }`}
                  >
                    <Text
                      className={`text-sm font-sans-bold ${
                        isSelected ? 'text-[#141413]' : 'text-[#faf9f5]'
                      }`}
                    >
                      {hourNum}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Minutes and Period Row */}
          <View className="flex-row justify-between items-center mb-6 px-1">
            {/* Minute Chips */}
            <View className="flex-1 mr-3">
              <Text className="text-xs font-sans-bold text-[#78a898] mb-2 text-center">
                Minute
              </Text>
              <View className="flex-row justify-around">
                {MINUTES.map((m) => {
                  const isSelected = pickerMin === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setPickerMin(m)}
                      accessibilityRole="button"
                      accessibilityLabel={`Minute ${m}`}
                      accessibilityState={{ selected: isSelected }}
                      className={`px-3 py-2.5 min-h-[44px] min-w-[40px] rounded-xl items-center justify-center ${
                        isSelected ? 'bg-[#f5b800]' : 'bg-[#12382d] border border-[#205243]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-sans-bold ${
                          isSelected ? 'text-[#141413]' : 'text-[#faf9f5]'
                        }`}
                      >
                        :{m}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Period Toggle */}
            <View className="w-22">
              <Text className="text-xs font-sans-bold text-[#78a898] mb-2 text-center">
                Period
              </Text>
              <View className="flex-row rounded-xl bg-[#12382d] border border-[#205243] p-1 min-h-[44px] items-center">
                {(['AM', 'PM'] as const).map((period) => {
                  const isSelected = pickerPeriod === period;
                  return (
                    <Pressable
                      key={period}
                      onPress={() => setPickerPeriod(period)}
                      accessibilityRole="button"
                      accessibilityLabel={`${period} period`}
                      accessibilityState={{ selected: isSelected }}
                      className={`flex-1 py-2 rounded-lg items-center justify-center ${
                        isSelected ? 'bg-[#f5b800]' : 'bg-transparent'
                      }`}
                    >
                      <Text
                        className={`text-xs font-sans-bold ${
                          isSelected ? 'text-[#141413]' : 'text-[#78a898]'
                        }`}
                      >
                        {period}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Modal Bottom Actions */}
          <View className="flex-row justify-between space-x-3">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              className="flex-1 py-3.5 mr-2 rounded-xl bg-[#163f33] items-center min-h-[44px] justify-center active:opacity-80"
            >
              <Text className="text-sm font-sans-bold text-[#78a898]">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Confirm reading time"
              className="flex-1 py-3.5 ml-2 rounded-xl bg-[#f5b800] items-center min-h-[44px] justify-center shadow-md active:opacity-90 flex-row"
            >
              <Check size={16} color="#141413" style={{ marginRight: 6 }} />
              <Text className="text-sm font-sans-bold text-[#141413]">Set Time</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
