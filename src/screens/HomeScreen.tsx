import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../components/EmptyState';
import { HeaderIconButton } from '../components/HeaderIconButton';
import { RecipeCard } from '../components/RecipeCard';
import { SearchBar } from '../components/SearchBar';
import { SectionHeader } from '../components/SectionHeader';
import { TagChip } from '../components/TagChip';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';
import type { Recipe } from '../types/recipe';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type RecipeSection = {
  data: Recipe[];
  id: string;
  title: string;
};

const ALL_TAG_ID = 'all';

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toGridRows(items: Recipe[]): Recipe[][] {
  const rows: Recipe[][] = [];

  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }

  return rows;
}

export function HomeScreen({ navigation }: Props) {
  const recipes = useRecipeStore((state) => state.recipes);
  const tags = useRecipeStore((state) => state.tags);
  const viewMode = useRecipeStore((state) => state.viewMode);
  const setViewMode = useRecipeStore((state) => state.setViewMode);

  const insets = useSafeAreaInsets();

  const [selectedTagId, setSelectedTagId] = useState(ALL_TAG_ID);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedRecipes = useMemo(
    () => [...recipes].sort((left, right) => right.createdAt - left.createdAt),
    [recipes]
  );
  const sortedTags = useMemo(
    () => [...tags].sort((left, right) => left.name.localeCompare(right.name, 'vi')),
    [tags]
  );
  const tagMap = useMemo(() => new Map(tags.map((tag) => [tag.id, tag.name])), [tags]);
  const normalizedQuery = useMemo(() => normalizeSearch(searchQuery), [searchQuery]);

  const filteredBySearch = useMemo(() => {
    if (!normalizedQuery) {
      return sortedRecipes;
    }

    return sortedRecipes.filter((recipe) =>
      normalizeSearch(recipe.name).includes(normalizedQuery)
    );
  }, [normalizedQuery, sortedRecipes]);

  const filteredRecipes = useMemo(() => {
    if (selectedTagId === ALL_TAG_ID) {
      return filteredBySearch;
    }

    return filteredBySearch.filter((recipe) => recipe.tagIds.includes(selectedTagId));
  }, [filteredBySearch, selectedTagId]);

  useEffect(() => {
    if (selectedTagId === ALL_TAG_ID) {
      return;
    }

    const exists = tags.some((tag) => tag.id === selectedTagId);
    if (!exists) {
      setSelectedTagId(ALL_TAG_ID);
    }
  }, [selectedTagId, tags]);

  const groupedSections = useMemo<RecipeSection[]>(() => {
    const grouped = sortedTags
      .map((tag) => ({
        id: tag.id,
        title: tag.name,
        data: filteredRecipes.filter((recipe) => recipe.tagIds.includes(tag.id)),
      }))
      .filter((section) => section.data.length > 0);

    const untagged = filteredRecipes.filter((recipe) => recipe.tagIds.length === 0);
    if (untagged.length > 0) {
      grouped.push({
        id: 'untagged',
        title: 'Untagged',
        data: untagged,
      });
    }

    return grouped;
  }, [filteredRecipes, sortedTags]);

  const showGroupHeaders = selectedTagId === ALL_TAG_ID && groupedSections.length > 1;

  const handleOpenSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const handleOpenAddRecipe = useCallback(() => {
    navigation.navigate('AddEditRecipe');
  }, [navigation]);

  const handleOpenRecipe = useCallback(
    (recipeId: string) => {
      navigation.navigate('RecipeDetail', { recipeId });
    },
    [navigation]
  );

  const handleOpenTagsManagement = useCallback(() => {
    navigation.navigate('TagsManagement');
  }, [navigation]);

  const handleSetListMode = useCallback(() => {
    void setViewMode('list');
  }, [setViewMode]);

  const handleSetGridMode = useCallback(() => {
    void setViewMode('grid');
  }, [setViewMode]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <HeaderIconButton
            accessibilityLabel="List view"
            icon="≡"
            isActive={viewMode === 'list'}
            onPress={handleSetListMode}
          />
          <HeaderIconButton
            accessibilityLabel="Grid view"
            icon="⊞"
            isActive={viewMode === 'grid'}
            onPress={handleSetGridMode}
          />
          <HeaderIconButton
            accessibilityLabel="Open settings"
            icon="⚙"
            onPress={handleOpenSettings}
          />
        </View>
      ),
    });
  }, [handleOpenSettings, handleSetGridMode, handleSetListMode, navigation, viewMode]);

  const renderRecipeItem = useCallback(
    ({ item }: { item: Recipe }) => (
      <RecipeCard
        createdAt={item.createdAt}
        isGrid={false}
        name={item.name}
        onPressRecipe={handleOpenRecipe}
        recipeId={item.id}
        tagNames={item.tagIds.map((tagId) => tagMap.get(tagId)).filter((value): value is string => Boolean(value))}
      />
    ),
    [handleOpenRecipe, tagMap]
  );

  const emptyTitle = selectedTagId === ALL_TAG_ID ? 'No recipes yet' : 'No matches found';
  const emptySubtitle =
    selectedTagId === ALL_TAG_ID
      ? 'Tap + to add your first recipe.'
      : 'Try another search or tag filter.';

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <SearchBar onChangeText={setSearchQuery} onClear={() => setSearchQuery('')} value={searchQuery} />

        <ScrollView
          contentContainerStyle={styles.tagRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <TagChip
            label="All"
            onPress={() => setSelectedTagId(ALL_TAG_ID)}
            selected={selectedTagId === ALL_TAG_ID}
          />
          {sortedTags.map((tag) => (
            <TagChip
              key={tag.id}
              label={tag.name}
              onPress={() => setSelectedTagId(tag.id)}
              selected={selectedTagId === tag.id}
            />
          ))}
          <Pressable
            accessibilityLabel="Manage tags"
            accessibilityRole="button"
            onPress={handleOpenTagsManagement}
            style={({ pressed }) => [styles.manageTagsChip, pressed && styles.pressed]}
          >
            <Text style={styles.manageTagsChipText}>+ Tags</Text>
          </Pressable>
        </ScrollView>
      </View>

      {filteredRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState subtitle={emptySubtitle} title={emptyTitle} />
        </View>
      ) : viewMode === 'grid' ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={toGridRows(filteredRecipes)}
          key="grid"
          keyExtractor={(item, index) => `grid-row-${item.map((recipe) => recipe.id).join('-')}-${index}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View style={styles.gridRow}>
              {item.map((recipe) => (
                <RecipeCard
                  createdAt={recipe.createdAt}
                  isGrid
                  key={recipe.id}
                  name={recipe.name}
                  onPressRecipe={handleOpenRecipe}
                  recipeId={recipe.id}
                  tagNames={recipe.tagIds
                    .map((tagId) => tagMap.get(tagId))
                    .filter((value): value is string => Boolean(value))}
                />
              ))}
              {item.length === 1 ? <View style={styles.gridSpacer} /> : null}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : showGroupHeaders ? (
        <SectionList
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          key="grouped-list"
          keyExtractor={(item) => item.id}
          renderItem={renderRecipeItem}
          renderSectionHeader={({ section }) => (
            <SectionHeader count={section.data.length} title={section.title} />
          )}
          sections={groupedSections}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredRecipes}
          key="flat-list"
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          renderItem={renderRecipeItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable
        accessibilityLabel="Add new recipe"
        accessibilityRole="button"
        onPress={handleOpenAddRecipe}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + spacing.s4 },
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  controls: {
    gap: spacing.s3,
    paddingHorizontal: spacing.s4,
    paddingTop: spacing.s3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    elevation: 6,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.s6,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: spacing.s1 },
    shadowOpacity: 0.2,
    shadowRadius: radius.md,
    width: 56,
  },
  fabText: {
    color: colors.surface,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: 32,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.s3,
  },
  gridSpacer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.s1,
  },
  listContent: {
    gap: spacing.s3,
    paddingBottom: 96,
    paddingHorizontal: spacing.s4,
    paddingTop: spacing.s3,
  },
  manageTagsChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
  },
  manageTagsChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  pressed: {
    opacity: 0.8,
  },
  tagRow: {
    gap: spacing.s2,
    paddingBottom: spacing.s1,
  },
});
