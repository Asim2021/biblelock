import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Clock, X, Check } from 'lucide-react-native';
import { useTheme } from '../lib/themeContext';

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
  const { colors, isDark } = useTheme();
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
      <View
        className="flex-1 justify-center items-center px-5"
        style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 380,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.45 : 0.15,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Clock size={18} color={colors.accent} />
              </View>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Inter_700Bold',
                  color: colors.textPrimary,
                }}
              >
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close time picker"
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

          {/* Time Preview Badge */}
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.borderSubtle,
              borderWidth: 1,
              marginBottom: 18,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
                color: colors.textSecondary,
                marginBottom: 2,
              }}
            >
              Scheduled Reminder
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'Inter_700Bold',
                color: colors.accent,
                letterSpacing: 0.5,
              }}
            >
              {previewTime}
            </Text>
          </View>

          {/* Hours Grid */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_600SemiBold',
                color: colors.textSecondary,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Select Hour
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                    style={{
                      width: 44,
                      height: 44,
                      margin: 4,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: isSelected ? colors.accent : colors.border,
                      backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Inter_700Bold',
                        color: isSelected ? (colors.accentText || '#141413') : colors.textPrimary,
                      }}
                    >
                      {hourNum}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Minutes and Period Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            {/* Minute Chips */}
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  color: colors.textSecondary,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Minute
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {MINUTES.map((m) => {
                  const isSelected = pickerMin === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setPickerMin(m)}
                      accessibilityRole="button"
                      accessibilityLabel={`Minute ${m}`}
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                        minHeight: 44,
                        minWidth: 42,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isSelected ? colors.accent : colors.border,
                        backgroundColor: isSelected ? colors.accent : colors.surfaceSubtle,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Inter_700Bold',
                          color: isSelected ? (colors.accentText || '#141413') : colors.textPrimary,
                        }}
                      >
                        :{m}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Period Toggle */}
            <View style={{ width: 90 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  color: colors.textSecondary,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Period
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  borderWidth: 1,
                  padding: 4,
                  minHeight: 44,
                  alignItems: 'center',
                }}
              >
                {(['AM', 'PM'] as const).map((period) => {
                  const isSelected = pickerPeriod === period;
                  return (
                    <Pressable
                      key={period}
                      onPress={() => setPickerPeriod(period)}
                      accessibilityRole="button"
                      accessibilityLabel={`${period} period`}
                      accessibilityState={{ selected: isSelected }}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Inter_700Bold',
                          color: isSelected ? (colors.accentText || '#141413') : colors.textSecondary,
                        }}
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              style={{
                flex: 1,
                paddingVertical: 12,
                marginRight: 8,
                borderRadius: 12,
                backgroundColor: colors.surfaceSubtle,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
              }}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Confirm reading time"
              style={{
                flex: 1,
                paddingVertical: 12,
                marginLeft: 8,
                borderRadius: 12,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                flexDirection: 'row',
              }}
            >
              <Check size={16} color={colors.accentText || '#141413'} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.accentText || '#141413' }}>
                Set Time
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
