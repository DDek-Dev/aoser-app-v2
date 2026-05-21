// utils/fileStorage.ts
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPresignedUrls, uploadFileToUrl, PresignedUrlResponse } from '../api/uploadUtils';
import { FileWithType } from '../types';
import { SetStateAction } from 'react';

// const TEMP_DIR = `${FileSystem.documentDirectory}temp_freelancer/`;
export const TEMP_DIR = `${FileSystem.documentDirectory}temp_freelancer/`;


interface FileMeta {
  name: string;
  type: string;
  originalUri: string;
}

interface StepDataWithFiles {
  [key: string]: any;
  // File paths and metadata
  profileImgPath?: string;
  profileImgMeta?: FileMeta;
  bannerImagePath?: string;
  bannerImageMeta?: FileMeta;
  promoVideoPath?: string;
  promoVideoMeta?: FileMeta;
  resumeImagePath?: string;
  resumeImageMeta?: FileMeta;
  cardImagePath?: string;
  cardImageMeta?: FileMeta;
  selfieWithCardPath?: string;
  selfieWithCardMeta?: FileMeta;
  certificatePaths?: string[];
  certificateMetas?: FileMeta[];
}

interface ReconstructedFile {
  uri: string;
  name: string;
  type: string;
}

interface UploadResults {
  [stepKey: string]: {
    [fileKey: string]: string | string[];
  };
}
// interface UploadResults {
//   [stepKey: string]: {
//     [fileKey: string]: string | string[];
//   } | string[]; // ✅ Add string[] as a possible type
// }

interface AllStepData {
  '@aoser_profile'?: StepDataWithFiles;
  '@freelancer_step1'?: StepDataWithFiles;
  '@freelancer_step2'?: StepDataWithFiles;
  '@freelancer_step3'?: StepDataWithFiles;
  '@freelancer_step4'?: StepDataWithFiles;
  '@freelancer_step5'?: StepDataWithFiles;
  '@freelancer_step6'?: StepDataWithFiles;
  '@freelancer_step7'?: StepDataWithFiles;
  [key: string]: StepDataWithFiles | undefined;
}


// ===================================
// TEMP DIR CONSTANT (FIXED)
// ===================================

// Make sure TEMP_DIR is defined like this:

// OR if you're getting the directory at runtime:
export const getTempDir = () => {
  const docDir = FileSystem.documentDirectory;
  console.log("📂 Document Directory:", docDir);
  console.log("📂 Document Directory Type:", typeof docDir);
  return `${docDir}temp_freelancer/`;
};



// ===================================
// ENSURE TEMP DIR FUNCTION (FIXED)
// ===================================

export const ensureTempDir = async (): Promise<void> => {
  try {
    // Get the temp directory path
    const tempDirPath = typeof TEMP_DIR === 'string' ? TEMP_DIR : getTempDir();

    console.log("📂 Checking temp directory:", tempDirPath);
    console.log("📂 Temp directory type:", typeof tempDirPath);

    // Make sure it's a valid string
    if (typeof tempDirPath !== 'string' || !tempDirPath) {
      throw new Error(`Invalid TEMP_DIR: ${tempDirPath}`);
    }

    const dirInfo = await FileSystem.getInfoAsync(tempDirPath);
    if (!dirInfo.exists) {
      console.log("📁 Creating temp directory:", tempDirPath);
      await FileSystem.makeDirectoryAsync(tempDirPath, { intermediates: true });
      console.log("✅ Temp directory created successfully");
    } else {
      console.log("✅ Temp directory already exists:", tempDirPath);
    }
  } catch (error) {
    console.log("❌ Error ensuring temp directory:", error);
    throw error;
  }
};

export const saveFileToTemp = async (fileUri: string, fileName: string): Promise<string> => {
  try {
    // Ensure temp directory exists
    console.log("test 1");
    await ensureTempDir();
    console.log("test 2");

    const tempPath = `${TEMP_DIR}${fileName}`;

    console.log("📋 Copy operation:");
    console.log("   FROM:", fileUri);
    console.log("   TO:", tempPath);

    // Check if source file exists (for file:// URIs)
    if (fileUri.startsWith("file://")) {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log("📄 Source file info:", fileInfo);

      if (!fileInfo.exists) {
        throw new Error(`Source file does not exist: ${fileUri}`);
      }
    }

    // Perform the copy
    await FileSystem.copyAsync({
      from: fileUri,
      to: tempPath
    });

    // Verify the copied file exists
    const copiedFileInfo = await FileSystem.getInfoAsync(tempPath);
    console.log("📄 Copied file info:", copiedFileInfo);

    if (!copiedFileInfo.exists) {
      throw new Error(`Failed to copy file to: ${tempPath}`);
    }

    console.log(`✅ File saved to temp: ${tempPath}`);
    return tempPath;

  } catch (error) {
    console.log("❌ Error in saveFileToTemp:", error);
    throw error; // Re-throw to be caught by the caller
  }
};


// Save form data (without files) to AsyncStorage
export const saveStepData = async (stepKey: string, data: StepDataWithFiles): Promise<void> => {
  try {
    await AsyncStorage.setItem(stepKey, JSON.stringify(data));
    console.log(`✅  data saved:123 ${stepKey}`);
  } catch (error) {
    console.log(`❌ Failed to save ${stepKey}:`, error);
    throw error;
  }
};

// Get all saved form data
export const getAllStepData = async (): Promise<AllStepData> => {
  try {
    const keys = [
      '@freelancer_step1',
      '@freelancer_step2',
      '@freelancer_step3',
      '@freelancer_step4',
      '@freelancer_step5',
      '@freelancer_step6',
      '@freelancer_step7',
      '@aoser_profile'
    ];

    const results = await AsyncStorage.multiGet(keys);
    const data: AllStepData = {};
    console.log("all data", data);

    results.forEach(([key, value]) => {
      if (value) {
        data[key as keyof AllStepData] = JSON.parse(value);
      }
    });

    return data;
  } catch (error) {
    console.log('❌ Failed to get step data:', error);
    throw error;
  }
};

// Clean up temp files and storage
export const cleanup = async (): Promise<void> => {
  try {
    // Remove temp directory
    const dirInfo = await FileSystem.getInfoAsync(TEMP_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(TEMP_DIR);
    }

    // Clear AsyncStorage
    const keys = [
      '@freelancer_step1',
      '@freelancer_step2',
      '@freelancer_step3',
      '@freelancer_step4',
      '@freelancer_step5',
      '@freelancer_step6',
      '@freelancer_step7',
      '@aoser_profile'
    ];

    await AsyncStorage.multiRemove(keys);
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('❌ Cleanup failed:', error);
  }
};

interface FileToUpload {
  key: string;
  file: ReconstructedFile;
  isArray: boolean;
  arrayKey?: string;
  arrayIndex?: number;
}

interface UploadResult {
  key: string;
  url?: string;
  error?: string;
  isArray: boolean;
  arrayKey?: string;
  arrayIndex?: number;
  success: boolean;
}

// Batch upload all files
export const uploadAllFiles = async (stepData: AllStepData): Promise<UploadResults> => {
  const filesToUpload: FileToUpload[] = [];
  const uploadResults: UploadResults = {};

  // Collect all files that need uploading
  const collectFiles = (data: StepDataWithFiles, prefix = ''): void => {
    Object.keys(data).forEach(key => {
      const value = data[key];

      if (value && typeof value === 'object') {
        // Handle file objects
        if ('uri' in value && 'name' in value && 'type' in value) {
          filesToUpload.push({
            key: `${prefix}${key}`,
            file: value as ReconstructedFile,
            isArray: false
          });
        }
        // Handle arrays of files
        else if (Array.isArray(value)) {
          value.forEach((item: any, index: number) => {
            if (item && typeof item === 'object' && 'uri' in item && 'name' in item && 'type' in item) {
              filesToUpload.push({
                key: `${prefix}${key}[${index}]`,
                file: item as ReconstructedFile,
                isArray: true,
                arrayKey: key,
                arrayIndex: index
              });
            }
          });
        }
        // Handle nested objects (but not arrays or files)
        else if (!Array.isArray(value) && !('uri' in value)) {
          collectFiles(value as StepDataWithFiles, `${prefix}${key}.`);
        }
      }
    });
  };

  // Collect files from all steps
  Object.keys(stepData).forEach(stepKey => {
    if (stepData[stepKey]) {
      collectFiles(stepData[stepKey]!, `${stepKey}.`);
    }
  });

  if (filesToUpload.length === 0) {
    console.log('No files to upload');
    return {};
  }

  console.log(`📤 Uploading ${filesToUpload.length} files...`);

  try {
    // Get presigned URLs for all files
    const filesMeta = filesToUpload.map(({ file }) => ({
      name: file.name,
      type: file.type
    }));

    const presignedUrls: PresignedUrlResponse[] = await getPresignedUrls(filesMeta);

    // Upload all files in parallel
    const uploadPromises = filesToUpload.map(async ({ key, file, isArray, arrayKey, arrayIndex }, index): Promise<UploadResult> => {
      try {
        await uploadFileToUrl(
          presignedUrls[index].url,
          file.uri,
          presignedUrls[index].contentType
        );
        let uploadedUrl = presignedUrls[index].key;
        // Strip "uploads/" prefix if it exists
        if (uploadedUrl.startsWith('uploads/')) {
          uploadedUrl = uploadedUrl.replace('uploads/', '');
        }

        return {
          key,
          url: uploadedUrl,
          isArray,
          arrayKey,
          arrayIndex,
          success: true
        };
      } catch (error: any) {
        console.log(`❌ Failed to upload ${key}:`, error);
        return {
          key,
          error: error.message,
          isArray,
          arrayKey,
          arrayIndex,
          success: false
        };
      }
    });

    const results = await Promise.all(uploadPromises);


    // Process results into a structured format
    results.forEach(result => {
      if (result.success && result.url) {
        if (result.isArray && result.arrayKey) {
          // ✅ FIX: Initialize array if it doesn't exist
          if (!uploadResults[result.arrayKey]) {
            uploadResults[result.arrayKey] = {};
          }
          uploadResults[result.arrayKey][result.arrayIndex!] = result.url;
        } else {
          // Handle nested keys like "step1.profileImg"
          const keyParts = result.key.split('.');
          let current: any = uploadResults;

          for (let i = 0; i < keyParts.length - 1; i++) {
            if (!current[keyParts[i]]) {
              current[keyParts[i]] = {};
            }
            current = current[keyParts[i]];
          }

          current[keyParts[keyParts.length - 1]] = result.url;
        }
      }
    });

    const failedUploads = results.filter(r => !r.success);
    if (failedUploads.length > 0) {
      console.warn(`⚠️ ${failedUploads.length} files failed to upload:`, failedUploads);
      throw new Error(`${failedUploads.length} files failed to upload`);
    }

    console.log('✅ All files uploaded successfully: ', uploadResults);
    return uploadResults;

  } catch (error) {
    console.log('❌ Batch upload failed:', error);
    throw error;
  }
};

const stripUploadsPrefix = (key: string): string => {
  if (key.startsWith('uploads/')) return key.replace('uploads/', '');
  return key;
};

const runWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const limit = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runners = new Array(Math.min(limit, items.length)).fill(null).map(async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(runners);
  return results;
};

export const uploadFileInstant = async (file: FileWithType): Promise<string> => {
  const [key] = await uploadFilesInstant([file], { concurrency: 1 });
  return key;
};

export const uploadFilesInstant = async (
  files: FileWithType[],
  options?: { concurrency?: number }
): Promise<string[]> => {
  if (!files.length) return [];

  const presignedUrls: PresignedUrlResponse[] = await getPresignedUrls(
    files.map((f) => ({ name: f.name, type: f.type, size: (f as any).size }))
  );

  const concurrency = options?.concurrency ?? 3;
  const keys = await runWithConcurrency(files, concurrency, async (file, index) => {
    const presigned = presignedUrls[index];
    await uploadFileToUrl(presigned.url, file.uri, presigned.contentType);
    return stripUploadsPrefix(presigned.key);
  });

  return keys;
};

// File handling helper functions
export const createFileMeta = (file: FileWithType): FileMeta => ({
  name: file.name,
  type: file.type,
  originalUri: file.uri
});

export const reconstructFileFromTemp = (path: string, meta: FileMeta): ReconstructedFile => ({
  uri: path,
  name: meta.name,
  type: meta.type
});

// Type-safe step data interfaces
export interface AoserProfileData {
  userId: string;
  firstName: string;
  lastName: string;
  profileImg?: FileWithType | null;
  // gender: string;
  phone: string;
  address?: {
    country: string;
    province: string;
    district: string;
    village: string;
    latitude: number;
    longitude: number;
  };
  // profileImgPath?: string;
  // profileImgMeta?: FileMeta;
}

export interface Step1Data {
  jobTitle: string;
  category: string;
  subcategories: string[];
  freelancerType: string;
  bannerImagePath?: string;
  bannerImageMeta?: FileMeta;
  promoVideoPath?: string;
  promoVideoMeta?: FileMeta;
}

export interface Step2Data {
  skills: string[];
  experience: string[];
  aboutMe: string;
  resumeImagePath?: string;
  resumeImageMeta?: FileMeta;
  certificatePaths?: string[];
  certificateMetas?: FileMeta[];
}

export interface Step3Data {
  serviceDesc: string;
  hourlyRate: string;
  budgetCurrency: '₭' | '$';
}
// export interface Step4Data {
//   cardType: 'ID_CARD' | 'PASSPORT' | 'VISA';
//   cardID: string;
//   fromDate: Date;
//   phone: string;
//   address: {
//     province: string; // ✅ Change from Province to string (ID or name)
//     district: string; // ✅ Change from District to string (ID or name)
//     village: string;
//   };
// }
export interface Step4Data {
  cardType: SetStateAction<"ID_CARD" | "PASSPORT" | "VISA">;
  cardID: string;
  fromDate: Date;
};
export interface Step5Data {
  selfieWithCardPath?: string;
  selfieWithCardMeta?: FileMeta;
  cardImagePath?: string;
  cardImageMeta?: FileMeta;
}

export interface Step6Data {
  paymentMethod: 'LAOS_BANK' | 'PAYPAL';
  bankName: string;
  accountName: string;
  bankNumber?: string;
  paypalInfo?: string;
}

export interface Step7Data {
  agreed: boolean;
}
