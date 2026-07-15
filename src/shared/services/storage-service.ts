import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { initFirebase } from '../../core/config/firebase';
import { getFirebaseStorage } from '../../core/config/firebase';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { StorageException } from '../../core/errors/app-exception';

export const StorageService = {
  async uploadFile(userId: string, fileUri: string, fileName: string): Promise<string> {
    try {
      const storage = getFirebaseStorage();
      const path = `users/${userId}/uploads/${Date.now()}_${fileName}`;
      const storageRef = ref(storage, path);

      const response = await fetch(fileUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);

      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error: any) {
      throw new StorageException(`Failed to upload file: ${error.message}`, 'upload-error');
    }
  },

  async uploadImageAsBase64(userId: string, fileUri: string, fileName: string): Promise<string> {
    try {
      const base64 = await readAsStringAsync(fileUri, {
        encoding: 'base64',
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error: any) {
      throw new StorageException(`Failed to read file: ${error.message}`, 'read-error');
    }
  },

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const storage = getFirebaseStorage();
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        throw new StorageException(`Failed to delete file: ${error.message}`, 'delete-error');
      }
    }
  },

  async deleteUserData(userId: string): Promise<void> {
    try {
      const storage = getFirebaseStorage();
      const userRef = ref(storage, `users/${userId}`);
      await deleteObject(userRef);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        throw new StorageException(`Failed to delete user data: ${error.message}`, 'delete-error');
      }
    }
  },
};
