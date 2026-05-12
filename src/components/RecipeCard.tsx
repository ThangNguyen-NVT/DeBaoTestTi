import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type RecipeCardProps = {
  recipeId: string;
  name: string;
  instructions: string;
  createdAt: number;
  isGrid: boolean;
  showManagementActions?: boolean;
  onPressRecipe: (recipeId: string) => void;
  onDeleteRecipe: (recipeId: string) => void;
};

function RecipeCardComponent({
  recipeId,
  name,
  instructions,
  createdAt,
  isGrid,
  showManagementActions = true,
  onPressRecipe,
  onDeleteRecipe,
}: RecipeCardProps) {
  return (
    <View style={[styles.card, isGrid && styles.gridCard]}>
      <Pressable
        onPress={() => onPressRecipe(recipeId)}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
      >
        <Text numberOfLines={2} style={styles.title}>
          {name}
        </Text>
      </Pressable>
      {showManagementActions && (
        <View style={styles.footer}>
          <Pressable
            onPress={() => onDeleteRecipe(recipeId)}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export const RecipeCard = memo(RecipeCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },
  cardPressable: {
    gap: 12,
  },
  deleteButton: {
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonPressed: {
    opacity: 0.75,
  },
  deleteButtonText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'flex-end',
  },
  gridCard: {
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: '48%',
    minHeight: 220,
  },
  pressed: {
    opacity: 0.85,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
});
