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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Management</Text>
        <Text style={styles.cardSubtitle}>
          Backup, restore, and transfer your cookbook safely.
        </Text>

        <Pressable
          onPress={() => void handleExportData()}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.primaryButtonText}>Export Data</Text>
        </Pressable>

        <Pressable
          onPress={() => void handleImportData()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.secondaryButtonText}>Import Data</Text>
        </Pressable>

        <Pressable
          onPress={handleResetApp}
          style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.dangerButtonText}>Reset App</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.85,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 4,
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
  },
  container: {
    gap: 12,
    padding: 16,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dangerButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});
