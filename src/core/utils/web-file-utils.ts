import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Reads a file URI as base64 string, working on both web and native.
 * On web, uses fetch + FileReader to handle blob:/file: URIs from document picker.
 * On native, uses expo-file-system.
 */
export async function readFileAsBase64(fileUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return readFileAsBase64Web(fileUri);
  }
  return FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  });
}

async function readFileAsBase64Web(fileUri: string): Promise<string> {
  try {
    const response = await fetch(fileUri);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const blob = await response.blob();
    return await blobToBase64(blob);
  } catch (e: any) {
    throw new Error(`Failed to read file as base64 on web: ${e.message}`);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error('Failed to extract base64 from data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}
