import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HeaderIconButton } from '../components/HeaderIconButton';
import { TagChip } from '../components/TagChip';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen({ navigation, route }: Props) {
  const { recipeId } = route.params;
  const tags = useRecipeStore((state) => state.tags);
  const recipe = useRecipeStore(
    useCallback(
      (state) => state.recipes.find((item) => item.id === recipeId),
      [recipeId]
    )
  );
  const deleteRecipe = useRecipeStore((state) => state.deleteRecipe);

  const recipeTags = useMemo(() => {
    if (!recipe) {
      return [] as string[];
    }

    const tagMap = new Map(tags.map((tag) => [tag.id, tag.name]));
    return recipe.tagIds
      .map((tagId) => tagMap.get(tagId))
      .filter((value): value is string => Boolean(value));
  }, [recipe, tags]);

  const handleEdit = useCallback(() => {
    navigation.navigate('AddEditRecipe', { recipeId });
  }, [navigation, recipeId]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Recipe', 'Are you sure you want to delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecipe(recipeId);
          navigation.popToTop();
        },
      },
    ]);
  }, [deleteRecipe, navigation, recipeId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe?.name ?? 'Recipe',
      headerRight: () => (
        <View style={styles.headerActions}>
          <HeaderIconButton accessibilityLabel="Edit recipe" icon="✎" onPress={handleEdit} />
          <HeaderIconButton accessibilityLabel="Delete recipe" icon="🗑" onPress={handleDelete} />
        </View>
      ),
    });
  }, [handleDelete, handleEdit, navigation, recipe?.name]);

  if (!recipe) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingTitle}>Recipe not found</Text>
        <Text style={styles.missingSubtitle}>This recipe may have been deleted.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.popToTop()}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.heroCard}>
        <Text style={styles.title}>{recipe.name}</Text>
        <Text style={styles.meta}>Created {new Date(recipe.createdAt).toLocaleDateString()}</Text>
        {recipeTags.length > 0 ? (
          <View style={styles.tagRow}>
            {recipeTags.map((tagName) => (
              <TagChip key={tagName} label={tagName} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.instructionsCard}>
        <Text style={styles.sectionLabel}>Instructions</Text>
        <Text style={styles.instructions}>{recipe.instructions}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.s4,
    padding: spacing.s4,
    paddingBottom: spacing.s7,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.s1,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.s2,
    padding: spacing.s4,
  },
  instructions: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: 24,
  },
  instructionsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.s3,
    padding: spacing.s4,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },
  missingContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.s3,
    justifyContent: 'center',
    padding: spacing.s6,
  },
  missingSubtitle: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    textAlign: 'center',
  },
  missingTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 120,
    paddingHorizontal: spacing.s4,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s2,
    paddingTop: spacing.s1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
});
