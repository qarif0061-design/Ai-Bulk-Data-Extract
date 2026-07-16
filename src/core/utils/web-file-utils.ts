import { Platform } from 'react-native';
import { readAsStringAsync } from 'expo-file-system/legacy';

export async function readFileAsBase64(fileUri: string): Promise<string> {
  console.log(`[readFileAsBase64] Platform: ${Platform.OS}`);
  console.log(`[readFileAsBase64] URI: ${fileUri.substring(0, 80)}`);

  if (Platform.OS === 'web') {
    return readFileAsBase64Web(fileUri);
  }

  console.log(`[readFileAsBase64] Native: using readAsStringAsync from expo-file-system/legacy`);
  try {
    const result = await readAsStringAsync(fileUri, {
      encoding: 'base64',
    });
    console.log(`[readFileAsBase64] Native read success, length: ${result?.length || 0}`);
    return result;
  } catch (e: any) {
    console.error(`[readFileAsBase64] Native read failed:`, e?.message);
    console.error(`[readFileAsBase64] URI was: ${fileUri}`);
    throw e;
  }
}

async function readFileAsBase64Web(fileUri: string): Promise<string> {
  console.log(`[readFileAsBase64Web] Fetching URI: ${fileUri.substring(0, 80)}`);
  try {
    const response = await fetch(fileUri);
    console.log(`[readFileAsBase64Web] Fetch response status: ${response.status}, ok: ${response.ok}`);
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const blob = await response.blob();
    console.log(`[readFileAsBase64Web] Blob size: ${blob.size}, type: ${blob.type}`);
    const base64 = await blobToBase64(blob);
    console.log(`[readFileAsBase64Web] Base64 conversion success, length: ${base64.length}`);
    return base64;
  } catch (e: any) {
    console.error(`[readFileAsBase64Web] Failed:`, e?.message);
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
