import { StatusBar } from 'expo-status-bar';
import './global.css';

import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <StatusBar style="dark" />
      <View className="flex-1 px-5 py-6">
        <View className="mb-5 flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-[3px] text-rain">
              MomentMarkt
            </Text>
            <Text className="mt-1 text-2xl font-bold text-ink">
              Hi Mia, the city is quiet.
            </Text>
          </View>
          <View className="rounded-full bg-spark px-3 py-2">
            <Text className="text-xs font-bold text-white">LIVE</Text>
          </View>
        </View>

        <View className="rounded-[32px] bg-white p-5 shadow-sm">
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-rain">
            Berlin Mitte · 13:30
          </Text>
          <Text className="mt-3 text-3xl font-black leading-9 text-ink">
            Silence until the moment is right.
          </Text>
          <Text className="mt-4 text-base leading-6 text-neutral-600">
            This Expo baseline is ready for the Phase 1 fallback: weather trigger,
            one generated-looking widget, and a simulated checkout path.
          </Text>

          <View className="mt-6 gap-3">
            <Signal label="Weather" value="Rain incoming" />
            <Signal label="Demand" value="Cafe Bondi 54% below baseline" />
            <Signal label="Privacy" value="{intent_token, h3_cell_r8}" />
          </View>
        </View>

        <View className="mt-auto rounded-3xl bg-ink p-5">
          <Text className="text-sm font-semibold uppercase tracking-[2px] text-cream/70">
            Next issue
          </Text>
          <Text className="mt-2 text-xl font-bold text-cream">
            Render the hand-authored Mia offer and fake girocard redeem loop.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-2xl border border-neutral-200 bg-cream px-4 py-3">
      <Text className="text-xs font-semibold uppercase tracking-[2px] text-rain">
        {label}
      </Text>
      <Text className="mt-1 text-base font-semibold text-ink">{value}</Text>
    </View>
  );
}
