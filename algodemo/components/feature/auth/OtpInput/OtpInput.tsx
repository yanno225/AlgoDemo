import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAccessibility } from '../../../../hooks/useAccessibility';
import { borderRadius, spacing, typography, motion } from '../../../../constants/theme';

export interface OtpInputProps {
  value: string;
  onChangeText: (code: string) => void;
  /** Nombre de chiffres attendus. */
  length?: number;
  /** Déclenché dès que le code est complet — évite un appui manuel superflu. */
  onComplete?: (code: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * Saisie de code à usage unique en cases séparées.
 *
 * Un champ de texte transparent couvre les cases et capte réellement la
 * frappe : les cases ne sont que l'affichage. C'est ce qui permet au collage
 * du code et à la suggestion SMS du clavier de continuer à fonctionner, ce
 * qu'une grille de six champs indépendants casse.
 */
export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChangeText,
  length = 6,
  onComplete,
  error = false,
  autoFocus = true,
}) => {
  const { colors, getFontSize } = useAccessibility();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (raw: string) => {
      const digits = raw.replace(/[^0-9]/g, '').slice(0, length);
      if (digits.length > value.length) {
        void Haptics.selectionAsync();
      }
      onChangeText(digits);
      if (digits.length === length) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete?.(digits);
      }
    },
    [length, onChangeText, onComplete, value.length]
  );

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      accessibilityRole="none"
      style={styles.container}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={`Code de validation à ${length} chiffres`}
        style={styles.hiddenInput}
        caretHidden
      />

      <View style={styles.cells} pointerEvents="none">
        {Array.from({ length }).map((_, index) => (
          <OtpCell
            key={index}
            digit={value[index] ?? ''}
            isActive={isFocused && index === Math.min(value.length, length - 1)}
            error={error}
            colors={colors}
            fontSize={getFontSize(typography.sizes.h3)}
          />
        ))}
      </View>
    </Pressable>
  );
};

// ─── Case unique ───────────────────────────────────────────────────────
interface OtpCellProps {
  digit: string;
  isActive: boolean;
  error: boolean;
  colors: ReturnType<typeof useAccessibility>['colors'];
  fontSize: number;
}

const OtpCell: React.FC<OtpCellProps> = ({ digit, isActive, error, colors, fontSize }) => {
  const filled = digit !== '';
  const state = useSharedValue(0);
  const caret = useSharedValue(0);

  React.useEffect(() => {
    state.value = withSpring(isActive || filled ? 1 : 0, motion.slide);
  }, [isActive, filled, state]);

  React.useEffect(() => {
    // Le curseur ne clignote que dans la case en attente de frappe.
    if (isActive && !filled) {
      caret.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 450 }),
          withTiming(0, { duration: 450 })
        ),
        -1,
        false
      );
    } else {
      caret.value = withTiming(0, { duration: motion.durations.micro });
    }
  }, [isActive, filled, caret]);

  const boxStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      state.value,
      [0, 1],
      [error ? colors.error : colors.border, error ? colors.error : colors.primary]
    ),
    backgroundColor: interpolateColor(
      state.value,
      [0, 1],
      [colors.surfaceElevated, colors.surface]
    ),
    transform: [{ scale: 0.94 + state.value * 0.06 }],
  }));

  const caretStyle = useAnimatedStyle(() => ({ opacity: caret.value }));

  const digitStyle = useAnimatedStyle(() => ({
    opacity: filled ? withTiming(1, { duration: motion.durations.micro }) : 0,
    transform: [{ scale: filled ? withSpring(1, motion.bounce) : 0.6 }],
  }));

  return (
    <Animated.View style={[styles.cell, boxStyle]}>
      <Animated.Text
        style={[
          styles.digit,
          { color: colors.textPrimary, fontSize, fontFamily: typography.families.bodyBold },
          digitStyle,
        ]}
      >
        {digit}
      </Animated.Text>
      <Animated.View style={[styles.caret, { backgroundColor: colors.primary }, caretStyle]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    zIndex: 1,
  },
  cells: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 64,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digit: {
    textAlign: 'center',
  },
  caret: {
    position: 'absolute',
    width: 2,
    height: '38%',
    borderRadius: 1,
  },
});

export default OtpInput;
