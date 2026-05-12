import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';

type SearchBarProps = {
  onChangeText: (value: string) => void;
  onClear: () => void;
  value: string;
};

export function SearchBar({ onChangeText, onClear, value }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder="Search recipes"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          onPress={onClear}
          style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
        >
          <Text style={styles.clearButtonLabel}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  clearButtonLabel: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    paddingLeft: spacing.s3,
  },
  icon: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginRight: spacing.s2,
  },
  input: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    minHeight: 48,
    paddingVertical: spacing.s2,
  },
  pressed: {
    opacity: 0.8,
  },
});
