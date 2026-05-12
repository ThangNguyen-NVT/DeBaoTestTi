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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 1,
  },
  cardPressable: {
    flex: 1,
  },
  listCard: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gridCard: {
    aspectRatio: 1,
    flex: 1,
    minHeight: 140,
    padding: 10,
  },
  listPressable: {
    justifyContent: 'center',
  },
  gridPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  listTitle: {
    fontSize: 16,
  },
  gridTitle: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
});
