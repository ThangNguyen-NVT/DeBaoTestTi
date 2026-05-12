import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { EmptyState } from '../components/EmptyState';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'TagsManagement'>;

export function TagsManagementScreen({}: Props) {
  const tags = useRecipeStore((state) => state.tags);
  const addTag = useRecipeStore((state) => state.addTag);
  const renameTag = useRecipeStore((state) => state.renameTag);
  const deleteTag = useRecipeStore((state) => state.deleteTag);

  const [newTagName, setNewTagName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');

  const sortedTags = useMemo(
    () => [...tags].sort((left, right) => left.name.localeCompare(right.name, 'vi')),
    [tags]
  );

  const handleCreateTag = useCallback(async () => {
    const value = newTagName.trim();
    if (!value) {
      return;
    }

    await addTag(value);
    setNewTagName('');
  }, [addTag, newTagName]);

  const handleStartRename = useCallback((tagId: string, currentName: string) => {
    setEditingTagId(tagId);
    setEditingTagName(currentName);
  }, []);

  const handleCancelRename = useCallback(() => {
    setEditingTagId(null);
    setEditingTagName('');
  }, []);

  const handleSaveRename = useCallback(async () => {
    if (!editingTagId) {
      return;
    }

    await renameTag(editingTagId, editingTagName);
    setEditingTagId(null);
    setEditingTagName('');
  }, [editingTagId, editingTagName, renameTag]);

  const handleDeleteTag = useCallback(
    (tagId: string, tagName: string) => {
      Alert.alert('Delete Tag', `Delete "${tagName}" from your cookbook?`, [
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
      <View style={styles.createRow}>
        <TextInput
          onChangeText={setNewTagName}
          placeholder="Create a new tag"
          placeholderTextColor={colors.textMuted}
          style={styles.createInput}
          value={newTagName}
        />
        <Pressable
          accessibilityLabel="Add tag"
          accessibilityRole="button"
          onPress={() => void handleCreateTag()}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={sortedTags}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState subtitle="Create your first tag to organize recipes." title="No tags yet" />
        }
        renderItem={({ item }) => {
          const isEditing = item.id === editingTagId;

          return (
            <Swipeable
              overshootRight={false}
              renderRightActions={() => (
                <Pressable
                  accessibilityLabel={`Delete tag ${item.name}`}
                  accessibilityRole="button"
                  onPress={() => handleDeleteTag(item.id, item.name)}
                  style={({ pressed }) => [
                    styles.swipeDelete,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.swipeDeleteLabel}>Delete</Text>
                </Pressable>
              )}
            >
              <View style={styles.row}>
                {isEditing ? (
                  <TextInput
                    autoFocus
                    onChangeText={setEditingTagName}
                    placeholder="Tag name"
                    placeholderTextColor={colors.textMuted}
                    style={styles.renameInput}
                    value={editingTagName}
                  />
                ) : (
                  <Text style={styles.rowTitle}>{item.name}</Text>
                )}

                <View style={styles.rowActions}>
                  {isEditing ? (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => void handleSaveRename()}
                        style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.inlineButtonText}>Save</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleCancelRename}
                        style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}
                      >
                        <Text style={styles.inlineButtonText}>Cancel</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleStartRename(item.id, item.name)}
                      style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.inlineButtonText}>Rename</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </Swipeable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: spacing.s3,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.s3,
    padding: spacing.s4,
  },
  createInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    minHeight: 48,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
  },
  createRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.s2,
  },
  inlineButton: {
    alignItems: 'center',
    backgroundColor: colors.chip,
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.s2,
  },
  inlineButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  listContent: {
    gap: spacing.s2,
    paddingBottom: spacing.s7,
  },
  pressed: {
    opacity: 0.8,
  },
  renameInput: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    minHeight: 44,
    paddingHorizontal: spacing.s2,
    paddingVertical: spacing.s2,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.s2,
    padding: spacing.s2,
  },
  rowActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.s2,
  },
  rowTitle: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  swipeDelete: {
    alignItems: 'center',
    backgroundColor: colors.dangerBackground,
    borderRadius: radius.md,
    justifyContent: 'center',
    marginBottom: spacing.s2,
    marginLeft: spacing.s2,
    minHeight: 60,
    minWidth: 80,
    paddingHorizontal: spacing.s3,
  },
  swipeDeleteLabel: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
