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
  isGrid,
  onPressRecipe,
}: RecipeCardProps) {
  return (
    <View style={[styles.card, isGrid ? styles.gridCard : styles.listCard]}>
      <Pressable
        onPress={() => onPressRecipe(recipeId)}
        style={({ pressed }) => [
          styles.cardPressable,
          isGrid ? styles.gridPressable : styles.listPressable,
          pressed && styles.pressed,
        ]}
      >
        <Text numberOfLines={2} style={[styles.title, isGrid ? styles.gridTitle : styles.listTitle]}>
          {name}
        </Text>
      </Pressable>
    </View>
  );
}

export const RecipeCard = memo(RecipeCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
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
    flex: 1,
  },
  gridCard: {
    aspectRatio: 1,
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: '48%',
    minHeight: 150,
  },
  gridPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    textAlign: 'center',
  },
  listCard: {
    minHeight: 84,
  },
  listPressable: {
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 18,
  },
  pressed: {
    opacity: 0.85,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
});
