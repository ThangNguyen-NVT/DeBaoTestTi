import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';
import { TagChip } from './TagChip';

type RecipeCardProps = {
  createdAt: number;
  isGrid: boolean;
  name: string;
  onPressRecipe: (recipeId: string) => void;
  recipeId: string;
  tagNames: string[];
};

function RecipeCardComponent({
  createdAt,
  isGrid,
  name,
  onPressRecipe,
  recipeId,
  tagNames,
}: RecipeCardProps) {
  const displayTags = tagNames.slice(0, isGrid ? 1 : 2);

  return (
    <View style={[styles.card, isGrid ? styles.gridCard : styles.listCard]}>
      <Pressable
        accessibilityLabel={`Open recipe ${name}`}
        accessibilityRole="button"
        onPress={() => onPressRecipe(recipeId)}
        style={({ pressed }) => [
          styles.pressable,
          isGrid ? styles.gridPressable : styles.listPressable,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={2} style={[styles.title, isGrid && styles.gridTitle]}>
          {name}
        </Text>

        {displayTags.length > 0 ? (
          <View style={styles.tagRow}>
            {displayTags.map((tagName) => (
              <TagChip key={tagName} label={tagName} />
            ))}
          </View>
        ) : null}

        <Text style={styles.meta}>{new Date(createdAt).toLocaleDateString()}</Text>
      </Pressable>
    </View>
  );
}

export const RecipeCard = memo(RecipeCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: spacing.s1 },
    shadowOpacity: 0.04,
    shadowRadius: radius.sm,
  },
  gridCard: {
    flex: 1,
    minHeight: 160,
  },
  gridPressable: {
    justifyContent: 'space-between',
    minHeight: 160,
  },
  gridTitle: {
    fontSize: fontSize.md,
  },
  listCard: {
    minHeight: 96,
  },
  listPressable: {
    gap: spacing.s2,
    minHeight: 96,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },
  pressable: {
    gap: spacing.s2,
    padding: spacing.s3,
  },
  pressed: {
    opacity: 0.85,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
