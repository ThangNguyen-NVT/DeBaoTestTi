import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen({ navigation, route }: Props) {
  const { recipeId } = route.params;
  const recipe = useRecipeStore(
    useCallback(
      (state) => state.recipes.find((item) => item.id === recipeId),
      [recipeId]
    )
  );
  const deleteRecipe = useRecipeStore((state) => state.deleteRecipe);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe?.name ?? 'Recipe Detail',
    });
  }, [navigation, recipe?.name]);

  const handleEdit = useCallback(() => {
    navigation.navigate('AddEditRecipe', { recipeId });
  }, [navigation, recipeId]);

  const handleDelete = useCallback(async () => {
    await deleteRecipe(recipeId);
    navigation.popToTop();
  }, [deleteRecipe, navigation, recipeId]);

  if (!recipe) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingTitle}>Recipe not found</Text>
        <Text style={styles.missingSubtitle}>
          This recipe may have been deleted from your offline cookbook.
        </Text>
        <Pressable
          onPress={() => navigation.popToTop()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Back to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>{recipe.name}</Text>
        <Text style={styles.meta}>
          Created {new Date(recipe.createdAt).toLocaleString()}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructions}>{recipe.instructions}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={handleEdit}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Edit Recipe</Text>
        </Pressable>
        <Pressable
          onPress={() => void handleDelete()}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Delete Recipe</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  container: {
    gap: 16,
    padding: 16,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  instructions: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 24,
  },
  meta: {
    color: '#64748B',
    fontSize: 14,
  },
  missingContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  missingSubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  missingTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
  },
});
