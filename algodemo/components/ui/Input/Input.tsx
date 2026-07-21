import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  ViewStyle,
  TextStyle,
  StyleProp,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { useAccessibility } from '../../../hooks/useAccessibility';
import { borderRadius, spacing, typography, motion } from '../../../constants/theme';
import { PressableScale } from '../PressableScale';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  error?: string;
  /** Texte d'aide affiché sous le champ, remplacé par l'erreur le cas échéant. */
  hint?: string;
  /** Icône décorative à gauche du champ. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Champ multiligne (description de signalement, avis citoyen). */
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  /** Affiche un compteur `n/max` sous le champ. Nécessite `maxLength`. */
  showCounter?: boolean;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  onSubmitEditing?: () => void;
  returnKeyType?: TextInputProps['returnKeyType'];
}

/**
 * Champ de saisie de l'app.
 *
 * Au focus, la bordure et l'ombre s'animent sur le UI thread : la couleur est
 * interpolée par Reanimated, ce qui évite le `useNativeDriver: false` qui
 * faisait passer chaque frame par le pont JS.
 */
export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize,
  error,
  hint,
  icon,
  multiline = false,
  numberOfLines = 4,
  maxLength,
  showCounter = false,
  editable = true,
  style,
  inputStyle,
  labelStyle,
  accessibilityLabel,
  onSubmitEditing,
  returnKeyType,
}) => {
  const { colors, getFontSize } = useAccessibility();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const focus = useSharedValue(0);
  const shake = useSharedValue(0);

  React.useEffect(() => {
    focus.value = withTiming(isFocused ? 1 : 0, { duration: motion.durations.micro });
  }, [isFocused, focus]);

  // Une erreur qui apparaît secoue le champ : le message seul passe inaperçu
  // quand le clavier couvre le bas de l'écran.
  React.useEffect(() => {
    if (error) {
      shake.value = withSpring(1, motion.bounce, () => {
        shake.value = withSpring(0, motion.bounce);
      });
    }
  }, [error, shake]);

  const isSecure = secureTextEntry && !isPasswordVisible;
  const restingBorder = error ? colors.error : colors.border;
  const activeBorder = error ? colors.error : colors.primary;

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [restingBorder, activeBorder]),
    shadowOpacity: interpolate(focus.value, [0, 1], [0, 0.14]),
    shadowRadius: interpolate(focus.value, [0, 1], [0, 10]),
    transform: [{ translateX: interpolate(shake.value, [0, 1], [0, 6]) }],
  }));

  const describedBy = accessibilityLabel || label || placeholder;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error ? colors.error : colors.textSecondary,
              fontSize: getFontSize(typography.sizes.caption),
              fontFamily: typography.families.bodySemiBold,
            },
            labelStyle,
          ]}
        >
          {label.toUpperCase()}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          multiline && {
            height: undefined,
            minHeight: 22 * numberOfLines + spacing.xxl,
            alignItems: 'flex-start',
          },
          {
            backgroundColor: editable ? colors.surface : colors.surfaceElevated,
            shadowColor: error ? colors.error : colors.primary,
          },
          containerStyle,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textTertiary}
            style={styles.leadingIcon}
          />
        )}

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={error ? `${describedBy}. Erreur : ${error}` : describedBy}
          style={[
            styles.textInput,
            multiline && styles.textInputMultiline,
            {
              color: colors.textPrimary,
              fontSize: getFontSize(typography.sizes.body),
              fontFamily: typography.families.body,
            },
            inputStyle,
          ]}
        />

        {secureTextEntry && (
          <PressableScale
            onPress={() => setIsPasswordVisible((v) => !v)}
            scaleTo={motion.scale.chip}
            haptic="none"
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
            }
            style={styles.iconButton}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </PressableScale>
        )}
      </Animated.View>

      {(error || hint || (showCounter && maxLength)) && (
        <View style={styles.footerRow}>
          <Text
            accessibilityLiveRegion={error ? 'assertive' : 'none'}
            style={[
              styles.footerText,
              {
                color: error ? colors.error : colors.textTertiary,
                fontSize: getFontSize(typography.sizes.caption),
                fontFamily: typography.families.body,
              },
            ]}
          >
            {error || hint || ''}
          </Text>
          {showCounter && maxLength && (
            <Text
              style={[
                styles.footerText,
                {
                  color: value.length >= maxLength ? colors.warning : colors.textTertiary,
                  fontSize: getFontSize(typography.sizes.caption),
                  fontFamily: typography.families.body,
                },
              ]}
            >
              {value.length}/{maxLength}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  label: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    shadowOffset: { width: 0, height: 4 },
  },
  leadingIcon: {
    marginRight: spacing.md,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  textInputMultiline: {
    height: undefined,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    textAlignVertical: 'top',
  },
  iconButton: {
    paddingLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
    gap: spacing.sm,
  },
  footerText: {
    flexShrink: 1,
  },
});

export default Input;
