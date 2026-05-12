import { NavigationContainer, type RouteProp } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import { AddEditRecipeScreen } from '../screens/AddEditRecipeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';

export type RootStackParamList = {
  Home: undefined;
  RecipeDetail: { recipeId: string };
  AddEditRecipe: { recipeId?: string } | undefined;
};

export type RootNavigationProp<RouteName extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, RouteName>;
export type RootRouteProp<RouteName extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  RouteName
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#F8FAFC',
          },
          headerTintColor: '#0F172A',
          contentStyle: {
            backgroundColor: '#F8FAFC',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Cookbook OS' }}
        />
        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailScreen}
          options={{ title: 'Recipe Detail' }}
        />
        <Stack.Screen
          name="AddEditRecipe"
          component={AddEditRecipeScreen}
          options={{ title: 'Add Recipe' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
