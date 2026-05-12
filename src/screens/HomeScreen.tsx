import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { RecipeCard } from '../components/RecipeCard';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';
import type { Recipe, Tag } from '../types/recipe';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type RecipeGroup = {
  id: string;
  name: string;
  recipes: Recipe[];
};

const ALL_TAG_ID = 'all';

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>No recipes yet</Text>
    <Text style={styles.emptySubtitle}>
      Start building your offline cookbook with your first recipe.
    </Text>
  </View>
);

function toRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function HomeScreen({ navigation }: Props) {
  const recipes = useRecipeStore((state) => state.recipes);
  const tags = useRecipeStore((state) => state.tags);
  const viewMode = useRecipeStore((state) => state.viewMode);
  const managementMode = useRecipeStore((state) => state.managementMode);
  const setViewMode = useRecipeStore((state) => state.setViewMode);
  const setManagementMode = useRecipeStore((state) => state.setManagementMode);
  const addTag = useRecipeStore((state) => state.addTag);
  const renameTag = useRecipeStore((state) => state.renameTag);
  const deleteTag = useRecipeStore((state) => state.deleteTag);

  const [selectedTagId, setSelectedTagId] = useState(ALL_TAG_ID);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedRecipes = useMemo(
    () => [...recipes].sort((left, right) => right.createdAt - left.createdAt),
    [recipes]
  );
  const sortedTags = useMemo(
    () => [...tags].sort((left, right) => left.name.localeCompare(right.name, 'vi')),
    [tags]
  );
  const isGrid = viewMode === 'grid';
  const normalizedSearchQuery = useMemo(() => normalizeSearch(searchQuery), [searchQuery]);

  useEffect(() => {
    if (selectedTagId === ALL_TAG_ID) {
      return;
    }

    const tagStillExists = tags.some((tag) => tag.id === selectedTagId);
    if (!tagStillExists) {
      setSelectedTagId(ALL_TAG_ID);
    }
  }, [selectedTagId, tags]);

  const filteredBySearchRecipes = useMemo(() => {
    if (!normalizedSearchQuery) {
      return sortedRecipes;
    }

    return sortedRecipes.filter((recipe) =>
      normalizeSearch(recipe.name).includes(normalizedSearchQuery)
    );
  }, [normalizedSearchQuery, sortedRecipes]);

  const filteredRecipes = useMemo(() => {
    if (selectedTagId === ALL_TAG_ID) {
      return filteredBySearchRecipes;
    }

    return filteredBySearchRecipes.filter((recipe) => recipe.tagIds.includes(selectedTagId));
  }, [filteredBySearchRecipes, selectedTagId]);

  const groups = useMemo<RecipeGroup[]>(() => {
    if (selectedTagId !== ALL_TAG_ID) {
      const selectedTag = sortedTags.find((tag) => tag.id === selectedTagId);
      if (!selectedTag) {
        return [];
      }

      return [
        {
          id: selectedTag.id,
          name: selectedTag.name,
          recipes: filteredRecipes,
        },
      ];
    }

    const tagGroups = sortedTags
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        recipes: filteredRecipes.filter((recipe) => recipe.tagIds.includes(tag.id)),
      }))
      .filter((group) => group.recipes.length > 0);

    const untaggedRecipes = filteredRecipes.filter((recipe) => recipe.tagIds.length === 0);

    if (untaggedRecipes.length === 0) {
      return tagGroups;
    }

    return [
      ...tagGroups,
      {
        id: 'untagged',
        name: 'Chưa gắn thẻ',
        recipes: untaggedRecipes,
      },
    ];
  }, [filteredRecipes, selectedTagId, sortedTags]);

  const handleOpenRecipe = useCallback(
    (recipeId: string) => {
      navigation.navigate('RecipeDetail', { recipeId });
    },
    [navigation]
  );

  const handleAddRecipe = useCallback(() => {
    navigation.navigate('AddEditRecipe');
  }, [navigation]);

  const handleOpenSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const handleListMode = useCallback(() => {
    void setViewMode('list');
  }, [setViewMode]);

  const handleGridMode = useCallback(() => {
    void setViewMode('grid');
  }, [setViewMode]);

  const handleToggleManagementMode = useCallback(() => {
    void setManagementMode(!managementMode);
  }, [managementMode, setManagementMode]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((previous) => ({
      ...previous,
      [groupId]: !previous[groupId],
    }));
  }, []);

  const handleCreateTag = useCallback(async () => {
    const value = newTagName.trim();
    if (!value) {
      return;
    }

    await addTag(value);
    setNewTagName('');
  }, [addTag, newTagName]);

  const handleStartRenameTag = useCallback((tag: Tag) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  }, []);

  const handleSaveRenameTag = useCallback(async () => {
    if (!editingTagId) {
      return;
    }

    await renameTag(editingTagId, editingTagName);
    setEditingTagId(null);
    setEditingTagName('');
  }, [editingTagId, editingTagName, renameTag]);

  const handleDeleteTag = useCallback(
    (tagId: string) => {
      Alert.alert('Delete Tag', 'Are you sure you want to delete this tag?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTag(tagId);
          },
        },
      ]);
    },
    [deleteTag]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Recipes</Text>
          <Text style={styles.subtitle}>Offline-first, always available.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleOpenSettings}
            style={({ pressed }) => [
              styles.settingsButton,
              pressed && styles.toggleButtonPressed,
            ]}
          >
            <Text style={styles.settingsButtonLabel}>Settings</Text>
          </Pressable>
          <Pressable
            onPress={handleToggleManagementMode}
            style={({ pressed }) => [
              styles.manageToggle,
              managementMode && styles.manageToggleActive,
              pressed && styles.toggleButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.manageToggleLabel,
                managementMode && styles.manageToggleLabelActive,
              ]}
            >
              {managementMode ? 'Done' : 'Manage'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.topControls}>
        <View style={styles.searchContainer}>
          <TextInput
            onChangeText={setSearchQuery}
            placeholder="Search recipes..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              style={({ pressed }) => [
                styles.searchClearButton,
                pressed && styles.toggleButtonPressed,
              ]}
            >
              <Text style={styles.searchClearLabel}>✕</Text>
            </Pressable>
          )}
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
              style={[styles.toggleLabel, viewMode === 'list' && styles.toggleLabelActive]}
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
              style={[styles.toggleLabel, viewMode === 'grid' && styles.toggleLabelActive]}
            >
              Grid
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.tagChipRow}
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            onPress={() => setSelectedTagId(ALL_TAG_ID)}
            style={({ pressed }) => [
              styles.tagChip,
              selectedTagId === ALL_TAG_ID && styles.tagChipActive,
              pressed && styles.toggleButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.tagChipLabel,
                selectedTagId === ALL_TAG_ID && styles.tagChipLabelActive,
              ]}
            >
              Tất cả
            </Text>
          </Pressable>
          {sortedTags.map((tag) => {
            const isSelected = selectedTagId === tag.id;

            return (
              <Pressable
                key={tag.id}
                onPress={() => setSelectedTagId(tag.id)}
                style={({ pressed }) => [
                  styles.tagChip,
                  isSelected && styles.tagChipActive,
                  pressed && styles.toggleButtonPressed,
                ]}
              >
                <Text style={[styles.tagChipLabel, isSelected && styles.tagChipLabelActive]}>
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {managementMode && (
          <View style={styles.tagManager}>
            <Text style={styles.tagManagerTitle}>Tag Management</Text>
            <View style={styles.createTagRow}>
              <TextInput
                onChangeText={setNewTagName}
                placeholder="Create a new tag"
                placeholderTextColor="#94A3B8"
                style={styles.tagInput}
                value={newTagName}
              />
              <Pressable
                onPress={() => void handleCreateTag()}
                style={({ pressed }) => [
                  styles.smallActionButton,
                  pressed && styles.toggleButtonPressed,
                ]}
              >
                <Text style={styles.smallActionButtonText}>Create</Text>
              </Pressable>
            </View>

            {sortedTags.length > 0 && (
              <View style={styles.tagList}>
                {sortedTags.map((tag) => {
                  const isEditingTag = editingTagId === tag.id;

                  return (
                    <View key={tag.id} style={styles.tagRow}>
                      {isEditingTag ? (
                        <TextInput
                          onChangeText={setEditingTagName}
                          style={[styles.tagInput, styles.renameInput]}
                          value={editingTagName}
                        />
                      ) : (
                        <Text style={styles.tagName}>{tag.name}</Text>
                      )}

                      <View style={styles.tagActions}>
                        {isEditingTag ? (
                          <>
                            <Pressable
                              onPress={() => void handleSaveRenameTag()}
                              style={({ pressed }) => [
                                styles.inlineActionButton,
                                pressed && styles.toggleButtonPressed,
                              ]}
                            >
                              <Text style={styles.inlineActionLabel}>Save</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                setEditingTagId(null);
                                setEditingTagName('');
                              }}
                              style={({ pressed }) => [
                                styles.inlineActionButton,
                                pressed && styles.toggleButtonPressed,
                              ]}
                            >
                              <Text style={styles.inlineActionLabel}>Cancel</Text>
                            </Pressable>
                          </>
                        ) : (
                          <Pressable
                            onPress={() => handleStartRenameTag(tag)}
                            style={({ pressed }) => [
                              styles.inlineActionButton,
                              pressed && styles.toggleButtonPressed,
                            ]}
                          >
                            <Text style={styles.inlineActionLabel}>Rename</Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={() => handleDeleteTag(tag.id)}
                          style={({ pressed }) => [
                            styles.inlineDeleteButton,
                            pressed && styles.toggleButtonPressed,
                          ]}
                        >
                          <Text style={styles.inlineDeleteLabel}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      {filteredRecipes.length === 0 ? (
        <View style={styles.emptyContent}>
          <EmptyState />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.groupList} showsVerticalScrollIndicator={false}>
          {groups.map((group) => {
            const isExpanded = !collapsedGroups[group.id];

            return (
              <View key={group.id} style={styles.groupSection}>
                <Pressable
                  onPress={() => handleToggleGroup(group.id)}
                  style={({ pressed }) => [
                    styles.groupHeader,
                    pressed && styles.toggleButtonPressed,
                  ]}
                >
                  <Text style={styles.groupHeaderText}>
                    {isExpanded ? '▼' : '▶'} {group.name}
                  </Text>
                  <Text style={styles.groupCount}>{group.recipes.length}</Text>
                </Pressable>

                {isExpanded && (
                  <View style={styles.groupBody}>
                    {isGrid
                      ? toRows(group.recipes, 2).map((row, rowIndex) => (
                          <View key={`${group.id}-${rowIndex}`} style={styles.gridRow}>
                            {row.map((recipe) => (
                              <RecipeCard
                                key={recipe.id}
                                isGrid
                                name={recipe.name}
                                onPressRecipe={handleOpenRecipe}
                                recipeId={recipe.id}
                              />
                            ))}
                            {row.length === 1 && <View style={styles.gridPlaceholder} />}
                          </View>
                        ))
                      : group.recipes.map((recipe) => (
                          <RecipeCard
                            key={recipe.id}
                            isGrid={false}
                            name={recipe.name}
                            onPressRecipe={handleOpenRecipe}
                            recipeId={recipe.id}
                          />
                        ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {managementMode && (
        <Pressable
          accessibilityLabel="Add recipe"
          onPress={handleAddRecipe}
          style={({ pressed }) => [styles.fab, pressed && styles.toggleButtonPressed]}
        >
          <Text style={styles.fabText}>＋</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  createTagRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emptyContent: {
    flex: 1,
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
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 28,
  },
  gridPlaceholder: {
    flex: 1,
  },
  gridRow: {
    columnGap: 10,
    flexDirection: 'row',
  },
  groupBody: {
    gap: 8,
  },
  groupCount: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  groupHeaderText: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  groupList: {
    gap: 14,
    paddingBottom: 96,
  },
  groupSection: {
    gap: 10,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  inlineActionButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineActionLabel: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineDeleteButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineDeleteLabel: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  manageToggle: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  manageToggleActive: {
    backgroundColor: '#2563EB',
  },
  manageToggleLabel: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  manageToggleLabelActive: {
    color: '#FFFFFF',
  },
  renameInput: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 8,
  },
  smallActionButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  smallActionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
  tagActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipActive: {
    backgroundColor: '#2563EB',
  },
  tagChipLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  tagChipLabelActive: {
    color: '#FFFFFF',
  },
  tagChipRow: {
    columnGap: 8,
    paddingVertical: 4,
  },
  searchClearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  searchClearLabel: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  searchInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  settingsButton: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settingsButtonLabel: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  tagInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tagList: {
    gap: 8,
  },
  tagManager: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  tagManagerTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  tagName: {
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  tagRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
  },
  toggle: {
    alignSelf: 'flex-start',
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
    opacity: 0.85,
  },
  toggleLabel: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: '#0F172A',
  },
  topControls: {
    gap: 12,
    marginBottom: 12,
  },
});
