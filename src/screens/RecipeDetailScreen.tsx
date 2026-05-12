import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>;

export function RecipeDetailScreen({ navigation, route }: Props) {
  const { recipeId } = route.params;
  const [managementMode, setManagementMode] = useState(false);
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
      headerRight: () => (
        <Pressable
          onPress={() => setManagementMode((previous) => !previous)}
          style={({ pressed }) => [styles.headerToggle, pressed && styles.buttonPressed]}
        >
          <Text style={styles.headerToggleLabel}>
            {managementMode ? 'Done' : 'Manage'}
          </Text>
        </Pressable>
      ),
    });
  }, [managementMode, navigation, recipe?.name]);

  const handleEdit = useCallback(() => {
    Alert.alert('Edit Recipe', 'Do you want to edit this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Edit',
        onPress: () => {
          navigation.navigate('AddEditRecipe', { recipeId });
        },
      },
    ]);
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

      {managementMode && (
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
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Delete Recipe</Text>
          </Pressable>
        </View>
      )}
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
  headerToggle: {
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerToggleLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
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
