// utils/mediaPicker.ts
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * On Android 13+ (API 33+), launchImageLibraryAsync uses the system
 * photo picker — no permission needed. Only request on older Android or iOS.
 */
export async function requestMediaPermissionIfNeeded(): Promise<boolean> {
  // Android 13+ doesn't need permission for photo picker
  if (Platform.OS === 'android' && (Platform.Version as number) >= 33) {
    return true;
  }

  const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return granted;
}