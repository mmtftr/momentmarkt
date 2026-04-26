/**
 * WalletView — saved-passes surface (issue #154).
 *
 * The Wallet tab in the 5-tab navbar (Discover / Wallet / Browse /
 * History / Settings). Pre-#154 the swipe-right gesture in Discover
 * fired the redeem flow immediately; post-#154 it adds a SavedPass to
 * the in-memory list this view renders. The user picks WHEN to redeem
 * by tapping a pass here.
 *
 * State ownership: App.tsx owns `savedPasses` + the mutators (add /
 * remove). This component is presentational — it renders the list,
 * fires `onPassTap` to commit a redemption, and `onRemovePass` for the
 * long-press destructive action.
 *
 * No persistence: per CLAUDE.md / DESIGN_PRINCIPLES.md the demo is
 * session-local. Issue #148 tracks AsyncStorage persistence as v2 —
 * paired with the on-device SLM swap so the storage layer can carry
 * inferred preferences alongside the literal pass list.
 *
 * Empty state: sparkles SF Symbol + a "Discover more" CTA back to the
 * Discover tab. The CTA is a hint, not the only path — the user can
 * always tap the Discover tab in the navbar directly.
 */

import { SymbolView } from "expo-symbols";
import { type ReactElement, useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { lightTap, mediumTap } from "../lib/haptics";
import { s } from "../styles";
import type { SavedPass } from "../types/savedPass";

type Props = {
  passes: SavedPass[];
  /** Tap a pass → commit to the redeem flow with that variant. */
  onPassTap: (pass: SavedPass) => void;
  /** Long-press a pass → confirm + remove from the list. */
  onRemovePass: (id: string) => void;
  /** "Discover more" link → switches the active tab back to Discover. */
  onGoToDiscover: () => void;
};

export function WalletView({
  passes,
  onPassTap,
  onRemovePass,
  onGoToDiscover,
}: Props): ReactElement {
  const insets = useSafeAreaInsets();
  return (
    <View style={[...s("flex-1 bg-cream"), { paddingTop: insets.top + 10 }]}>
      {/* Sticky header (issue #171) — pinned at the top of the wrapper,
          OUTSIDE the ScrollView, so it stays put while saved-pass rows
          scroll beneath. Mirrors the SettingsScreen pattern so all four
          tab surfaces share the same upper-header rhythm.

          Composition: bold "Wallet" title (matches Settings/History/
          Discover), subtitle line ("{N} saved offers"), and the
          Discover-more shortcut link to keep the existing affordance.
          The title row uses Settings' text-3xl font-black + -0.5
          letter-spacing so the four titles read as one type system. */}
      <View
        style={[
          ...s("px-5"),
          { paddingTop: 8, paddingBottom: 12 },
        ]}
      >
        <View style={s("flex-row items-end justify-between")}>
          <Text
            style={[
              ...s("text-3xl font-black text-ink"),
              { letterSpacing: -0.5 },
            ]}
          >
            Wallet
          </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Discover more offers"
            onPress={() => {
              lightTap();
              onGoToDiscover();
            }}
            hitSlop={8}
            style={({ pressed }) => ({
              opacity: pressed ? 0.55 : 1,
              paddingBottom: 6,
            })}
          >
            <Text
              style={[
                ...s("text-xs font-bold uppercase tracking-[2px]"),
                { color: "#f2542d" },
              ]}
            >
              Discover more →
            </Text>
          </Pressable>
        </View>
        <Text
          style={[
            ...s("text-sm text-neutral-600"),
            { marginTop: 4 },
          ]}
        >
          {passes.length === 0
            ? "Nothing saved yet"
            : `${passes.length} saved offer${passes.length === 1 ? "" : "s"}`}
        </Text>
      </View>

      {passes.length === 0 ? (
        <WalletEmptyState onGoToDiscover={onGoToDiscover} />
      ) : (
        <ScrollView
          style={s("flex-1")}
          contentContainerStyle={[
            ...s("px-5"),
            { paddingTop: 4, paddingBottom: 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {passes.map((pass, idx) => (
            <View
              key={pass.id}
              style={{ marginBottom: idx === passes.length - 1 ? 0 : 12 }}
            >
              <SwipeToDeleteRow
                onDelete={() => onRemovePass(pass.id)}
                onLongPressFallback={() => {
                  mediumTap();
                  Alert.alert(
                    "Remove this saved offer?",
                    `${pass.variant.merchant_display_name} · ${pass.variant.discount_label}`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Remove",
                        style: "destructive",
                        onPress: () => onRemovePass(pass.id),
                      },
                    ],
                  );
                }}
                onTap={() => onPassTap(pass)}
                pass={pass}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function WalletEmptyState({
  onGoToDiscover,
}: {
  onGoToDiscover: () => void;
}): ReactElement {
  return (
    <View
      style={[
        ...s("flex-1 items-center justify-center"),
        { paddingHorizontal: 32 },
      ]}
    >
      <SymbolView
        name="sparkles"
        tintColor="#6f3f2c"
        size={40}
        weight="medium"
        style={{ width: 40, height: 40 }}
      />
      <Text
        style={[
          ...s("mt-4 text-base font-black text-ink text-center"),
          { letterSpacing: -0.2 },
        ]}
      >
        No saved offers yet
      </Text>
      <Text
        style={[
          ...s("mt-2 text-sm text-neutral-600 text-center"),
          { lineHeight: 20 },
        ]}
      >
        Swipe right in Discover to add an offer to your wallet. Tap a saved
        pass to redeem it.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to Discover"
        onPress={() => {
          lightTap();
          onGoToDiscover();
        }}
        style={({ pressed }) => [
          ...s("rounded-full bg-spark px-5"),
          {
            marginTop: 20,
            paddingVertical: 12,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Text
          style={[
            ...s("text-sm font-black uppercase tracking-[2px] text-white"),
          ]}
        >
          Open Discover
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Reveal threshold in points beyond which a release commits to the
 * fully-revealed state (showing the Delete button). Anything less
 * springs back to 0.
 */
const REVEAL_THRESHOLD_X = -40;
/** Velocity threshold (px/s) for a confident left-flick to also commit
 *  the reveal even if the user didn't drag past REVEAL_THRESHOLD_X. */
const REVEAL_THRESHOLD_VX = -800;
/** Width of the Delete button slot (also the max leftward travel). */
const DELETE_REVEAL_WIDTH = 80;
/** Height the Delete button + row should match. ~120pt matches the
 *  SavedPassCard layout (96 photo + 12 padding top + 12 bottom).
 *  Hard-coded so the absolute-positioned Delete button doesn't have to
 *  measure the row at runtime. */
const ROW_HEIGHT = 120;
/** iOS-Mail-style spring tuning — confident snap, no overshoot. */
const REVEAL_SPRING = { stiffness: 140, damping: 18 } as const;

/**
 * iOS-Mail-style swipe-LEFT-to-reveal-Delete container (#170 fix 3).
 *
 * Wraps each SavedPassCard with a Reanimated translateX SV. A Pan
 * gesture (left-only via activeOffsetX) drags the row left, clamped to
 * [-DELETE_REVEAL_WIDTH, 0]. On release:
 *   • translationX < REVEAL_THRESHOLD_X || velocityX < REVEAL_THRESHOLD_VX
 *     → spring to fully-revealed (-DELETE_REVEAL_WIDTH)
 *   • else → spring back to 0 (closed)
 *
 * Tapping anywhere on the row resets translateX to 0 first, then fires
 * the row's normal onPress (so a partially-revealed row dismisses the
 * Delete button on tap rather than firing the redeem flow with a
 * confusing offset). This matches iOS Mail's "tap-elsewhere-dismisses"
 * behavior.
 *
 * The long-press-to-confirm path is preserved as a backup deletion
 * affordance so the discoverability of the gesture isn't a hard
 * blocker for power users who don't try the swipe yet.
 *
 * activeOffsetX([-12, 9999]) only activates on leftward pans ≥12pt;
 * failOffsetY([-15, 15]) cancels the pan if the user moves vertically
 * by more than 15pt — that yields the gesture back to the ScrollView so
 * vertical scroll still works. tap-on-revealed slides closed.
 */
function SwipeToDeleteRow({
  pass,
  onTap,
  onDelete,
  onLongPressFallback,
}: {
  pass: SavedPass;
  onTap: () => void;
  onDelete: () => void;
  onLongPressFallback: () => void;
}): ReactElement {
  const translateX = useSharedValue(0);

  const close = useCallback(() => {
    translateX.value = withSpring(0, REVEAL_SPRING);
  }, [translateX]);

  const handleDeletePress = useCallback(() => {
    mediumTap();
    onDelete();
    // After the parent removes the pass the row will unmount; resetting
    // translateX defends against a remount-with-the-same-key edge case.
    translateX.value = 0;
  }, [onDelete, translateX]);

  // Tap-anywhere-on-row dismisses the reveal first, then defers to the
  // regular tap. We branch in JS via a small handler that reads the
  // current SV value (cheap on the JS thread because it's a single
  // .value access — no worklet round-trip).
  const handleRowTap = useCallback(() => {
    if (translateX.value < -1) {
      close();
      return;
    }
    onTap();
  }, [close, onTap, translateX]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 9999])
        .failOffsetY([-15, 15])
        .onChange((e) => {
          // Clamp to [-DELETE_REVEAL_WIDTH, 0] so the row can't drift
          // off-screen and can't drag rightward (the Delete UI lives
          // on the right).
          translateX.value = Math.max(-DELETE_REVEAL_WIDTH, Math.min(0, e.translationX));
        })
        .onEnd((e) => {
          const reveal =
            e.translationX < REVEAL_THRESHOLD_X ||
            e.velocityX < REVEAL_THRESHOLD_VX;
          if (reveal) {
            translateX.value = withSpring(-DELETE_REVEAL_WIDTH, {
              ...REVEAL_SPRING,
              velocity: e.velocityX,
            });
            runOnJS(lightTap)();
          } else {
            translateX.value = withSpring(0, REVEAL_SPRING);
          }
        }),
    [translateX],
  );

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ position: "relative", height: ROW_HEIGHT }}>
      {/* Delete button — sits BENEATH the row, revealed as the row
          slides left. Tapping it removes the pass via onDelete. The
          button is rendered first so the row above it covers it at
          rest (translateX = 0) and uncovers it as the row slides. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${pass.variant.merchant_display_name}`}
        onPress={handleDeletePress}
        style={({ pressed }) => ({
          position: "absolute",
          right: 0,
          top: 0,
          width: DELETE_REVEAL_WIDTH,
          height: ROW_HEIGHT,
          backgroundColor: "#dc2626",
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <SymbolView
          name="trash.fill"
          tintColor="#ffffff"
          size={22}
          weight="medium"
          style={{ width: 22, height: 22, marginBottom: 4 }}
        />
        <Text
          style={{
            color: "#ffffff",
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 0.5,
          }}
        >
          Delete
        </Text>
      </Pressable>

      <GestureDetector gesture={pan}>
        <Animated.View style={[{ height: ROW_HEIGHT }, rowStyle]}>
          <SavedPassCard
            pass={pass}
            onTap={handleRowTap}
            onLongPress={onLongPressFallback}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/**
 * Single saved-pass row.
 *
 * Layout (~120pt tall):
 *   • 96×96 photo on the left (square, rounded). Falls back to a flat
 *     cocoa block when the LLM-emitted widget_spec didn't ship an image
 *     (defensive — the spec shape is `unknown` on the wire).
 *   • Right column:
 *       merchant name (bold ink) + small subhead (cocoa)
 *       spark-tinted discount badge
 *       "Tap to redeem →" affordance at bottom
 *
 * Tap → onTap (commits to redeem flow). Long-press → onLongPress
 * (shows the Alert confirm in WalletView).
 */
function SavedPassCard({
  pass,
  onTap,
  onLongPress,
}: {
  pass: SavedPass;
  onTap: () => void;
  onLongPress: () => void;
}): ReactElement {
  const [imgFailed, setImgFailed] = useState(false);
  const photoUrl = extractPhotoUrl(pass.variant.widget_spec);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pass.variant.merchant_display_name} — ${pass.variant.discount_label}. Tap to redeem.`}
      onPress={() => {
        lightTap();
        onTap();
      }}
      onLongPress={onLongPress}
      delayLongPress={450}
      style={({ pressed }) => [
        ...s("flex-row rounded-2xl bg-white"),
        {
          height: ROW_HEIGHT,
          padding: 12,
          borderWidth: 1,
          borderColor: "rgba(23, 18, 15, 0.08)",
          opacity: pressed ? 0.85 : 1,
          shadowColor: "#17120f",
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        },
      ]}
    >
      {photoUrl && !imgFailed ? (
        <Image
          source={{ uri: photoUrl }}
          onError={() => setImgFailed(true)}
          resizeMode="cover"
          style={{
            width: 96,
            height: 96,
            borderRadius: 14,
            backgroundColor: "rgba(23, 18, 15, 0.06)",
          }}
        />
      ) : (
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 14,
            backgroundColor: "#6f3f2c",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SymbolView
            name="wallet.pass.fill"
            tintColor="rgba(255, 248, 238, 0.7)"
            size={28}
            weight="regular"
            style={{ width: 28, height: 28 }}
          />
        </View>
      )}

      <View
        style={{
          flex: 1,
          paddingLeft: 12,
          justifyContent: "space-between",
        }}
      >
        {/* Top row — merchant name + discount badge inline */}
        <View>
          <View
            style={[
              ...s("flex-row items-start justify-between"),
              { gap: 8 },
            ]}
          >
            <Text
              style={[
                ...s("text-base font-black text-ink"),
                { flex: 1, letterSpacing: -0.2, lineHeight: 20 },
              ]}
              numberOfLines={2}
            >
              {pass.variant.merchant_display_name}
            </Text>
            <View
              style={[
                ...s("rounded-full bg-spark px-2"),
                { paddingVertical: 3 },
              ]}
            >
              <Text
                style={[
                  ...s("text-white"),
                  {
                    fontSize: 10,
                    fontWeight: "900",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  },
                ]}
              >
                {pass.variant.discount_label}
              </Text>
            </View>
          </View>
          <Text
            style={[
              ...s("mt-1 text-xs text-neutral-600"),
              { lineHeight: 16 },
            ]}
            numberOfLines={2}
          >
            {pass.variant.headline}
          </Text>
        </View>

        {/* Bottom row — "Tap to redeem →" affordance */}
        <Text
          style={[
            ...s("text-cocoa"),
            {
              fontSize: 11,
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              marginTop: 8,
            },
          ]}
        >
          Tap to redeem →
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Pull the photo URL out of the LLM-emitted widget_spec. Mirrors the
 * SimplifiedCardSurface helper in SwipeOfferStack so the saved-pass
 * card shows the same photo the user swiped on. Defensive — returns
 * null on any shape mismatch and the card falls through to the cocoa
 * placeholder block.
 */
function extractPhotoUrl(spec: unknown): string | null {
  if (!spec || typeof spec !== "object") return null;
  const root = spec as Record<string, unknown>;
  if (!Array.isArray(root.children)) return null;
  const first = (root.children as unknown[])[0] as
    | Record<string, unknown>
    | undefined;
  if (first && first.type === "Image" && typeof first.source === "string") {
    return first.source;
  }
  return null;
}
