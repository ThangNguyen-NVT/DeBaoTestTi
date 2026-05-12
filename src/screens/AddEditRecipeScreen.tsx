import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TagChip } from '../components/TagChip';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';
import type { Recipe } from '../types/recipe';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';

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
  const addRecipe = useRecipeStore((state) => state.addRecipe);
  const updateRecipe = useRecipeStore((state) => state.updateRecipe);

  const isEditing = Boolean(recipeId);
  const initialName = recipe?.name ?? '';
  const initialInstructions = recipe?.instructions ?? '';
  const initialTagIds = recipe?.tagIds ?? [];

  const [name, setName] = useState(initialName);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(initialName);
    setInstructions(initialInstructions);
    setSelectedTagIds(initialTagIds);
  }, [initialInstructions, initialName, initialTagIds]);

  const isSaveDisabled = useMemo(
    () => isSaving || !name.trim() || !instructions.trim(),
    [instructions, isSaving, name]
  );

  const isDirty = useMemo(() => {
    const initialTagSet = [...initialTagIds].sort().join('|');
    const currentTagSet = [...selectedTagIds].sort().join('|');

    return (
      name !== initialName ||
      instructions !== initialInstructions ||
      currentTagSet !== initialTagSet
    );
  }, [initialInstructions, initialName, initialTagIds, instructions, name, selectedTagIds]);

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

    if (isSaving || !trimmedName || !trimmedInstructions) {
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
    name,
    navigation,
    recipeId,
    selectedTagIds,
    updateRecipe,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Recipe' : 'New Recipe',
      headerRight: () => (
        <Pressable
          accessibilityLabel="Save recipe"
          accessibilityRole="button"
          disabled={isSaveDisabled}
          onPress={() => void handleSave()}
          style={({ pressed }) => [
            styles.headerSaveButton,
            isSaveDisabled && styles.headerSaveButtonDisabled,
            pressed && !isSaveDisabled && styles.pressed,
          ]}
        >
          <Text style={[styles.headerSaveText, isSaveDisabled && styles.headerSaveTextDisabled]}>
            Save
          </Text>
        </Pressable>
      ),
    });
  }, [handleSave, isEditing, isSaveDisabled, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!isDirty || isSaving) {
        return;
      }

      event.preventDefault();

      Alert.alert('Discard changes?', 'You have unsaved changes.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [isDirty, isSaving, navigation]);

  if (isEditing && !recipe) {
    return (
      <View style={styles.missingContainer}>
        <Text style={styles.missingTitle}>Recipe not found</Text>
        <Text style={styles.missingSubtitle}>The recipe you are trying to edit is no longer available.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            onChangeText={setName}
            placeholder="Recipe name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={name}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            multiline
            onChangeText={setInstructions}
            placeholder="Write each step clearly for easy offline cooking."
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.instructionsInput]}
            textAlignVertical="top"
            value={instructions}
          />
        </View>

        {tags.length > 0 ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagRow}>
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <TagChip
                    key={tag.id}
                    label={tag.name}
                    onPress={() => toggleTag(tag.id)}
                    selected={isSelected}
                  />
                );
              })}
            </View>
          </View>
        ) : (
          <Text style={styles.emptyTagHint}>No tags yet. Create tags from Settings.</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.s4,
    padding: spacing.s4,
    paddingBottom: spacing.s7,
  },
  emptyTagHint: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  },
  fieldGroup: {
    gap: spacing.s2,
  },
  flex: {
    backgroundColor: colors.background,
    flex: 1,
  },
  headerSaveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.s2,
  },
  headerSaveButtonDisabled: {
    opacity: 0.5,
  },
  headerSaveText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  headerSaveTextDisabled: {
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    minHeight: 48,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
  },
  instructionsInput: {
    minHeight: 220,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  missingContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.s2,
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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s2,
  },
});
