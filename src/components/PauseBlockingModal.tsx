import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pause, Play, Clock } from 'lucide-react-native';
import { useTheme } from '../lib/themeContext';

interface PauseBlockingModalProps {
  visible: boolean;
  isCurrentlyPaused: boolean;
  pauseUntilMs: number | null;
  onClose: () => void;
  onPause: (minutes: number) => void;
  onResume: () => void;
}

export const PauseBlockingModal: React.FC<PauseBlockingModalProps> = ({
  visible,
  isCurrentlyPaused,
  pauseUntilMs,
  onClose,
  onPause,
  onResume,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [selectedMins, setSelectedMins] = useState<number>(30);

  const remainingMinutes = pauseUntilMs
    ? Math.max(0, Math.ceil((pauseUntilMs - Date.now()) / 60000))
    : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        className="flex-1 justify-center items-center px-6"
        style={{
          backgroundColor: isDark ? 'rgba(0,0,0,0.82)' : 'rgba(0,0,0,0.5)',
          paddingTop: Math.max(20, insets.top + 10),
          paddingBottom: Math.max(20, insets.bottom + 10),
        }}
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
          <View className="items-center mb-4">
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: colors.surfaceSubtle,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Pause size={28} color={colors.accent} />
            </View>
            <Text
              style={{
                fontSize: 22,
                fontFamily: 'EBGaramond_700Bold',
                color: colors.textPrimary,
                textAlign: 'center',
              }}
            >
              Pause App Blocking
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_400Regular',
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Need a temporary break for work or communication?
            </Text>
          </View>

          {isCurrentlyPaused ? (
            <View
              style={{
                alignItems: 'center',
                marginVertical: 16,
                padding: 16,
                borderRadius: 16,
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_400Regular',
                  color: colors.textSecondary,
                  marginBottom: 4,
                }}
              >
                Blocking currently paused
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                  marginBottom: 16,
                }}
              >
                {remainingMinutes} minutes left
              </Text>
              <Pressable
                onPress={onResume}
                style={{
                  width: '100%',
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.success,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                <Play size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: '#ffffff' }}>
                  Resume Blocking Now
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                  color: colors.textSecondary,
                  marginBottom: 10,
                }}
              >
                Select pause duration:
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
                {[15, 30, 60].map((mins) => {
                  const isSelected = selectedMins === mins;
                  return (
                    <Pressable
                      key={mins}
                      onPress={() => setSelectedMins(mins)}
                      style={{
                        flex: 1,
                        marginHorizontal: 4,
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isSelected ? colors.accent : colors.border,
                        backgroundColor: isSelected ? colors.accentBg : colors.surfaceSubtle,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: 'Inter_700Bold',
                          color: isSelected ? colors.accent : colors.textPrimary,
                        }}
                      >
                        {mins === 60 ? '1 Hour' : `${mins}m`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Scripture guidance */}
              <View
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                  borderWidth: 1,
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'EBGaramond_400Regular_Italic',
                    color: colors.textSecondary,
                    textAlign: 'center',
                  }}
                >
                  "Be still, and know that I am God." — Psalm 46:10
                </Text>
              </View>

              <Pressable
                onPress={() => onPause(selectedMins)}
                style={{
                  width: '100%',
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: colors.danger,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  marginBottom: 10,
                }}
              >
                <Clock size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: '#ffffff' }}>
                  Pause Blocking for {selectedMins === 60 ? '1 Hour' : `${selectedMins}m`}
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={onClose}
            style={{
              width: '100%',
              paddingVertical: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary }}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
