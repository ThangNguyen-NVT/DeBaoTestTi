import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type RecipeCardProps = {
  recipeId: string;
  name: string;
  isGrid: boolean;
  onPressRecipe: (recipeId: string) => void;
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
  },
  cardPressable: {
    flex: 1,
  },
  gridCard: {
    aspectRatio: 1.02,
    flex: 1,
    padding: 12,
  },
  gridPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    textAlign: 'center',
  },
  listTitle: {
    fontSize: 17,
  },
  pressed: {
    opacity: 0.88,
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  listCard: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  listPressable: {
    justifyContent: 'center',
  },
});
