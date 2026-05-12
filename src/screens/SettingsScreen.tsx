import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { useRecipeStore } from '../store/recipeStore';
import type { ImportMode } from '../utils/importExport';
import { validateCookbookImport } from '../utils/importExport';
import { colors } from '../theme/colors';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const exportData = useRecipeStore((state) => state.exportData);
  const importData = useRecipeStore((state) => state.importData);
  const resetApp = useRecipeStore((state) => state.resetApp);

  const handleExportData = useCallback(async () => {
    try {
      const payload = exportData();
      const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

      if (!baseDirectory) {
        Alert.alert('Export Failed', 'No writable directory is available on this device.');
        return;
      }

      const fileUri = `${baseDirectory}cookbook-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Export Complete', `Backup saved at:\n${fileUri}`);
        return;
      }

      await Sharing.shareAsync(fileUri, {
        dialogTitle: 'Export Cookbook Data',
        mimeType: 'application/json',
        UTI: 'public.json',
      });
    } catch {
      Alert.alert('Export Failed', 'Unable to export your cookbook data.');
    }
  }, [exportData]);

  const runImport = useCallback(
    (mode: ImportMode, rawContent: string) => {
      const validation = validateCookbookImport(rawContent);

      if (!validation.valid) {
        Alert.alert('Import Failed', validation.error);
        return;
      }

      const title = mode === 'replace' ? 'Replace Data?' : 'Import Data?';
      const message =
        mode === 'replace'
          ? 'This will overwrite all current recipes and tags. This action cannot be undone.'
          : 'This will merge imported recipes and tags into your existing cookbook.';

      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: mode === 'replace' ? 'Replace' : 'Import',
          style: mode === 'replace' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await importData(validation.data, mode);
              Alert.alert('Import Complete', 'Cookbook data imported successfully.');
            } catch {
              Alert.alert('Import Failed', 'Unable to import this backup file.');
            }
          },
        },
      ]);
    },
    [importData]
  );

  const handleImportData = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const selectedFile = result.assets[0];
      const content = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert('Choose Import Mode', 'How would you like to import this file?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          onPress: () => {
            runImport('merge', content);
          },
        },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            runImport('replace', content);
          },
        },
      ]);
    } catch {
      Alert.alert('Import Failed', 'Unable to read the selected file.');
    }
  }, [runImport]);

  const handleResetApp = useCallback(() => {
    Alert.alert(
      'Reset App',
      'This will remove all recipes, tags, and return app settings to default.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetApp();
              navigation.popToTop();
            } catch {
              Alert.alert('Reset Failed', 'Unable to reset app data.');
            }
          },
        },
      ]
    );
  }, [navigation, resetApp]);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('TagsManagement')}
          style={({ pressed }) => [styles.rowButton, pressed && styles.pressed]}
        >
          <View>
            <Text style={styles.rowTitle}>Manage tags</Text>
            <Text style={styles.rowSubtitle}>Create, rename, and delete labels</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Data</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleExportData()}
          style={({ pressed }) => [styles.rowButton, pressed && styles.pressed]}
        >
          <Text style={styles.rowTitle}>Export cookbook</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleImportData()}
          style={({ pressed }) => [styles.rowButton, pressed && styles.pressed]}
        >
          <Text style={styles.rowTitle}>Import cookbook</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.dangerCard}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleResetApp}
          style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
        >
          <Text style={styles.dangerText}>Reset app</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chevron: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  container: {
    gap: spacing.s4,
    padding: spacing.s4,
    paddingBottom: spacing.s7,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerBackground,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
  },
  dangerCard: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.s3,
    padding: spacing.s4,
  },
  dangerText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  pressed: {
    opacity: 0.8,
  },
  rowButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
  },
  rowSubtitle: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.s3,
    padding: spacing.s4,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
