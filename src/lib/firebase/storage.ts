import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './config';

// Initialize Firebase Storage
const storage = getStorage(app);

/**
 * Interface for upload progress
 */
export interface UploadProgress {
  progress: number;
  downloadUrl: string | null;
  error: Error | null;
}

/**
 * Upload a file to Firebase Storage with progress tracking
 * @param file File to upload
 * @param path Storage path
 * @param metadata Optional metadata
 * @param progressCallback Callback function for tracking upload progress
 */
export async function uploadFile(
  file: File,
  path: string,
  metadata?: Record<string, unknown>,
  progressCallback?: (progress: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create the file reference
    const storageRef = ref(storage, path);
    
    // Start the upload
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    
    // Listen for state changes
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Calculate upload progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        
        // Call the progress callback if provided
        if (progressCallback) {
          progressCallback({
            progress,
            downloadUrl: null,
            error: null
          });
        }
      },
      (error) => {
        // Handle unsuccessful uploads
        if (progressCallback) {
          progressCallback({
            progress: 0,
            downloadUrl: null,
            error
          });
        }
        reject(error);
      },
      async () => {
        // Handle successful uploads
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        
        if (progressCallback) {
          progressCallback({
            progress: 100,
            downloadUrl,
            error: null
          });
        }
        
        resolve(downloadUrl);
      }
    );
  });
}

/**
 * Upload a flyer image to Firebase Storage
 * @param file File to upload
 * @param userId User ID
 * @param progressCallback Callback function for tracking upload progress
 */
export async function uploadEventImage(
  file: File,
  userId: string,
  progressCallback?: (progress: UploadProgress) => void
): Promise<string> {
  // Create a unique file name
  const timestamp = new Date().getTime();
  const fileExtension = file.name.split('.').pop();
  const fileName = `event_${timestamp}.${fileExtension}`;
  
  // Define the storage path
  const path = `events/${userId}/${fileName}`;
  
  // Set metadata
  const metadata = {
    contentType: file.type,
    customMetadata: {
      uploadedBy: userId,
      originalName: file.name
    }
  };
  
  // Upload the file
  return uploadFile(file, path, metadata, progressCallback);
}

/**
 * Upload multiple event images to Firebase Storage
 * @param files Files to upload
 * @param userId User ID
 * @param progressCallback Callback function for tracking upload progress
 */
export async function uploadEventImages(
  files: File[],
  userId: string,
  progressCallback?: (index: number, progress: UploadProgress) => void
): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    return uploadEventImage(
      file,
      userId,
      (progress) => {
        if (progressCallback) {
          progressCallback(index, progress);
        }
      }
    );
  });
  
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Firebase Storage using its download URL
 * @param downloadUrl The download URL of the file to delete
 */
export async function deleteFileByUrl(downloadUrl: string): Promise<void> {
  try {
    // Extract the file path from the download URL
    const url = new URL(downloadUrl);
    const pathname = decodeURIComponent(url.pathname);
    
    // Extract the path after '/o/' and before '?'
    const pathMatch = pathname.match(/\/o\/(.+)$/);
    if (!pathMatch) {
      throw new Error('Invalid download URL format');
    }
    
    const filePath = pathMatch[1];
    const fileRef = ref(storage, filePath);
    
    await deleteObject(fileRef);
  } catch (error) {
    // Log error but don't throw to avoid breaking event deletion if file doesn't exist
    console.warn('Failed to delete file from storage:', downloadUrl, error);
  }
}

/**
 * Delete multiple files from Firebase Storage using their download URLs
 * @param downloadUrls Array of download URLs to delete
 */
export async function deleteFilesByUrls(downloadUrls: string[]): Promise<void> {
  const deletePromises = downloadUrls.map(url => deleteFileByUrl(url));
  await Promise.allSettled(deletePromises);
}

/**
 * Delete event images from Firebase Storage
 * @param imageUrls Array of image URLs to delete
 */
export async function deleteEventImages(imageUrls: string[]): Promise<void> {
  return deleteFilesByUrls(imageUrls);
}

export { storage };