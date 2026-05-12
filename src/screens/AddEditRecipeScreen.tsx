import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';
import type { Recipe } from '../types/recipe';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEditRecipe'>;

function createRecipeId(recipes: Recipe[]) {
  const timestamp = Date.now();
  const prefix = `recipe-${timestamp}-`;
  const nextSequence =
    recipes.reduce((highestSequence, recipe) => {
      if (!recipe.id.startsWith(prefix)) {
        return highestSequence;
      }

      const sequence = Number(recipe.id.slice(prefix.length));
      return Number.isNaN(sequence)
        ? highestSequence
        : Math.max(highestSequence, sequence);
    }, 0) + 1;

  return `${prefix}${nextSequence}`;
}

export function AddEditRecipeScreen({ navigation, route }: Props) {
  const recipeId = route.params?.recipeId;
  const recipe = useRecipeStore(
    useCallback(
      (state) => state.recipes.find((item) => item.id === recipeId),
      [recipeId]
    )
  );
  const tags = useRecipeStore((state) => state.tags);
  const managementMode = useRecipeStore((state) => state.managementMode);
  const addRecipe = useRecipeStore((state) => state.addRecipe);
  const updateRecipe = useRecipeStore((state) => state.updateRecipe);

  const isEditing = Boolean(recipeId);
  const [name, setName] = useState(recipe?.name ?? '');
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(recipe?.tagIds ?? []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(recipe?.name ?? '');
    setInstructions(recipe?.instructions ?? '');
    setSelectedTagIds(recipe?.tagIds ?? []);
  }, [recipe?.instructions, recipe?.name, recipe?.tagIds]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Recipe' : 'Add Recipe',
    });
  }, [isEditing, navigation]);

  const isSaveDisabled = useMemo(
    () => isSaving || !name.trim() || !instructions.trim(),
    [instructions, isSaving, name]
  );

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((previous) =>
      previous.includes(tagId)
        ? previous.filter((currentTagId) => currentTagId !== tagId)
        : [...previous, tagId]
    );
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedInstructions = instructions.trim();

    if (isSaving || !trimmedName || !trimmedInstructions || !managementMode) {
      return;
    }

    setIsSaving(true);

    try {
      if (recipeId) {
        await updateRecipe(recipeId, {
          name: trimmedName,
          instructions: trimmedInstructions,
          tagIds: selectedTagIds,
        });
        navigation.goBack();
        return;
      }

      const nextRecipeId = createRecipeId(useRecipeStore.getState().recipes);

      await addRecipe({
        id: nextRecipeId,
        name: trimmedName,
        instructions: trimmedInstructions,
        tagIds: selectedTagIds,
        createdAt: Date.now(),
      });

      navigation.replace('RecipeDetail', { recipeId: nextRecipeId });
    } finally {
      setIsSaving(false);
    }
  }, [
    addRecipe,
    instructions,
    isSaving,
    managementMode,
    name,
    navigation,
    recipeId,
    selectedTagIds,
    updateRecipe,
  ]);

  if (!managementMode) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingTitle}>Management mode is off</Text>
        <Text style={styles.missingSubtitle}>
          Enable management mode from Home to create or edit recipes.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (isEditing && !recipe) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingTitle}>Recipe not found</Text>
        <Text style={styles.missingSubtitle}>
          The recipe you are trying to edit is no longer available.
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Recipe Name</Text>
          <TextInput
            onChangeText={setName}
            placeholder="e.g. Trứng chiên hành"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={name}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            multiline
            onChangeText={setInstructions}
            placeholder="Write each step clearly so it is easy to follow offline."
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.instructionsInput]}
            textAlignVertical="top"
            value={instructions}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Tags (optional)</Text>
          <View style={styles.tagRow}>
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);

              return (
                <Pressable
                  key={tag.id}
                  onPress={() => toggleTag(tag.id)}
                  style={({ pressed }) => [
                    styles.tagChip,
                    isSelected && styles.tagChipSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagChipLabel,
                      isSelected && styles.tagChipLabelSelected,
                    ]}
                  >
                    {tag.name}
                  </Text>
                </Pressable>
              );
            })}
            {tags.length === 0 && (
              <Text style={styles.emptyTagHint}>
                No tags yet. You can create tags from Home in management mode.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            disabled={isSaveDisabled}
            onPress={() => void handleSave()}
            style={({ pressed }) => [
              styles.primaryButton,
              isSaveDisabled && styles.primaryButtonDisabled,
              pressed && !isSaveDisabled && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isEditing ? 'Save Changes' : 'Create Recipe'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    gap: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  container: {
    gap: 16,
    padding: 16,
  },
  emptyTagHint: {
    color: '#64748B',
    fontSize: 13,
  },
  fieldGroup: {
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  instructionsInput: {
    minHeight: 180,
  },
  label: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
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
  primaryButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  tagChip: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  tagChipLabelSelected: {
    color: '#FFFFFF',
  },
  tagChipSelected: {
    backgroundColor: '#2563EB',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
