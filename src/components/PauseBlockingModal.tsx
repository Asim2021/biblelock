import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';

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
  const [selectedMins, setSelectedMins] = useState<number>(30);

  const remainingMinutes = pauseUntilMs
    ? Math.max(0, Math.ceil((pauseUntilMs - Date.now()) / 60000))
    : 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 justify-center items-center px-6">
        <View className="w-full bg-[#131c17] border border-[#273a2e] rounded-3xl p-6 shadow-2xl">
          <View className="items-center mb-4">
            <Text className="text-4xl mb-2">⏸️</Text>
            <Text
              className="text-2xl font-serif-bold text-[#faf9f5] text-center tracking-tight"
              style={{ fontFamily: 'EBGaramond_700Bold' }}
            >
              Pause App Blocking
            </Text>
            <Text className="text-xs font-sans text-[#78a898] text-center mt-1">
              Need a temporary break for work or communication?
            </Text>
          </View>

          {isCurrentlyPaused ? (
            <View className="items-center my-4 p-4 rounded-2xl bg-[#1c2921] border border-[#2d4737]">
              <Text className="text-xs font-sans text-[#78a898] mb-1">
                Blocking currently paused
              </Text>
              <Text className="text-2xl font-sans-bold text-[#f5b800] mb-4">
                {remainingMinutes} minutes left
              </Text>
              <Pressable
                onPress={onResume}
                className="w-full py-3 rounded-xl bg-[#5db872] items-center active:opacity-90"
              >
                <Text className="text-sm font-sans-bold text-white">
                  Resume Blocking Now
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text className="text-xs font-sans-semibold text-[#a09d96] mb-3">
                Select pause duration:
              </Text>
              <View className="flex-row justify-between mb-5">
                {[15, 30, 60].map((mins) => {
                  const isSelected = selectedMins === mins;
                  return (
                    <Pressable
                      key={mins}
                      onPress={() => setSelectedMins(mins)}
                      className={`flex-1 mx-1 py-3 rounded-xl items-center border ${
                        isSelected
                          ? 'border-[#f5b800] bg-[#2a291b]'
                          : 'border-[#273a2e] bg-[#16221c]'
                      }`}
                    >
                      <Text
                        className={`text-sm font-sans-bold ${
                          isSelected ? 'text-[#f5b800]' : 'text-[#faf9f5]'
                        }`}
                      >
                        {mins === 60 ? '1 Hour' : `${mins}m`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Scripture guidance */}
              <View className="p-3.5 rounded-xl bg-[#17221c] border border-[#24372c] mb-6">
                <Text
                  className="text-xs font-serif-italic text-[#c8ded6] text-center"
                  style={{ fontFamily: 'EBGaramond_400Regular_Italic' }}
                >
                  "Be still, and know that I am God." — Psalm 46:10
                </Text>
              </View>

              <Pressable
                onPress={() => onPause(selectedMins)}
                className="w-full py-3.5 rounded-xl bg-[#ff5c5c] items-center active:opacity-90 shadow-md mb-2"
              >
                <Text className="text-sm font-sans-bold text-white">
                  Pause Blocking for {selectedMins === 60 ? '1 Hour' : `${selectedMins}m`}
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            onPress={onClose}
            className="w-full py-3 rounded-xl bg-transparent items-center"
          >
            <Text className="text-xs font-sans-medium text-[#78a898]">Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
