import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

import { RecipeCard } from '../components/RecipeCard';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';
import type { Recipe } from '../types/recipe';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>No recipes yet</Text>
    <Text style={styles.emptySubtitle}>
      Start building your offline cookbook with your first recipe.
    </Text>
  </View>
);

export function HomeScreen({ navigation }: Props) {
  const recipes = useRecipeStore((state) => state.recipes);
  const viewMode = useRecipeStore((state) => state.viewMode);
  const setViewMode = useRecipeStore((state) => state.setViewMode);

  const sortedRecipes = useMemo(
    () => [...recipes].sort((left, right) => right.createdAt - left.createdAt),
    [recipes]
  );
  const isGrid = viewMode === 'grid';

  const handleOpenRecipe = useCallback(
    (recipeId: string) => {
      navigation.navigate('RecipeDetail', { recipeId });
    },
    [navigation]
  );

  const handleAddRecipe = useCallback(() => {
    navigation.navigate('AddEditRecipe');
  }, [navigation]);

  const handleListMode = useCallback(() => {
    void setViewMode('list');
  }, [setViewMode]);

  const handleGridMode = useCallback(() => {
    void setViewMode('grid');
  }, [setViewMode]);

  const keyExtractor = useCallback((item: Recipe) => item.id, []);

  const renderItem = useCallback<ListRenderItem<Recipe>>(
    ({ item }) => (
      <RecipeCard
        isGrid={isGrid}
        name={item.name}
        onPressRecipe={handleOpenRecipe}
        recipeId={item.id}
      />
    ),
    [handleOpenRecipe, isGrid]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Recipes</Text>
          <Text style={styles.subtitle}>Offline-first, always available.</Text>
        </View>
        <View style={styles.toggle}>
          <Pressable
            onPress={handleListMode}
            style={({ pressed }) => [
              styles.toggleButton,
              viewMode === 'list' && styles.toggleButtonActive,
              pressed && styles.toggleButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.toggleLabel,
                viewMode === 'list' && styles.toggleLabelActive,
              ]}
            >
              List
            </Text>
          </Pressable>
          <Pressable
            onPress={handleGridMode}
            style={({ pressed }) => [
              styles.toggleButton,
              viewMode === 'grid' && styles.toggleButtonActive,
              pressed && styles.toggleButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.toggleLabel,
                viewMode === 'grid' && styles.toggleLabelActive,
              ]}
            >
              Grid
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        key={viewMode}
        columnWrapperStyle={isGrid ? styles.gridRow : undefined}
        contentContainerStyle={[
          styles.listContent,
          sortedRecipes.length === 0 && styles.emptyContent,
        ]}
        data={sortedRecipes}
        keyExtractor={keyExtractor}
        ListEmptyComponent={EmptyState}
        maxToRenderPerBatch={10}
        numColumns={isGrid ? 2 : 1}
        removeClippedSubviews
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        accessibilityLabel="Add recipe"
        onPress={handleAddRecipe}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
  },
  fab: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 28,
    bottom: 24,
    elevation: 4,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    width: 56,
  },
  fabPressed: {
    opacity: 0.9,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 28,
  },
  gridRow: {
    columnGap: 10,
    justifyContent: 'flex-start',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listContent: {
    gap: 8,
    paddingBottom: 96,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
  },
  toggle: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 4,
  },
  toggleButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleButtonPressed: {
    opacity: 0.8,
  },
  toggleLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: '#0F172A',
  },
});
