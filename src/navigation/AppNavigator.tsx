import { NavigationContainer, type RouteProp } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';

import { AddEditRecipeScreen } from '../screens/AddEditRecipeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TagsManagementScreen } from '../screens/TagsManagementScreen';
import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/typography';

export type RootStackParamList = {
  Home: undefined;
  RecipeDetail: { recipeId: string };
  AddEditRecipe: { recipeId?: string } | undefined;
  Settings: undefined;
  TagsManagement: undefined;
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
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.textPrimary,
            fontSize: fontSize.lg,
            fontWeight: fontWeight.bold,
          },
          headerTintColor: colors.textPrimary,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Cookbook' }} />
        <Stack.Screen
          name="RecipeDetail"
          component={RecipeDetailScreen}
          options={{ title: 'Recipe' }}
        />
        <Stack.Screen
          name="AddEditRecipe"
          component={AddEditRecipeScreen}
          options={{ title: 'New Recipe' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="TagsManagement"
          component={TagsManagementScreen}
          options={{ title: 'Tags' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
