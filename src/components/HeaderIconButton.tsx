import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';

type HeaderIconButtonProps = {
  accessibilityLabel: string;
  icon: string;
  isActive?: boolean;
  onPress: () => void;
};

export function HeaderIconButton({ accessibilityLabel, icon, isActive, onPress }: HeaderIconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isActive && styles.buttonActive,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.icon, isActive && styles.iconActive]}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    padding: spacing.s2,
  },
  buttonActive: {
    backgroundColor: colors.chip,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  icon: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  iconActive: {
    color: colors.primary,
  },
});
