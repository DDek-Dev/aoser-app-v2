// import axios from 'axios';
// import * as FileSystem from 'expo-file-system';

// type FileWithType = {
//   uri: string;
//   name: string;
//   type: string;
//   size?: number;
// };

// type PresignedUrlResponse = {
//   filename: string;
//   key: string;
//   url: string;
//   contentType: string;
// };

// type UploadOptions = {
//   onProgress?: (progress: number) => void;
//   additionalData?: Record<string, any>;
// };

// /**
//  * Generic file uploader function
//  * 
//  * @param files Array of files to upload
//  * @param presignedUrlEndpoint Your backend endpoint to get presigned URLs
//  * @param options Upload options including progress callback
//  * @returns Promise with the upload results
//  */
// export const uploadFiles = async (
//   files: FileWithType[],
//   presignedUrlEndpoint: string,
//   options?: UploadOptions
// ): Promise<PresignedUrlResponse[]> => {
//   if (!files || files.length === 0) {
//     throw new Error('No files provided for upload');
//   }

//   // Step 1: Get presigned URLs from your backend
//   const fileMeta = files.map((file) => ({
//     name: file.name,
//     type: file.type,
//     size: file.size,
//     ...(options?.additionalData || {}),
//   }));

//   const presignedUrlsResponse = await axios.post(presignedUrlEndpoint, {
//     files: fileMeta,
//   });

//   const presignedUrls = presignedUrlsResponse.data.data as PresignedUrlResponse[];

//   // Step 2: Upload each file to its presigned URL
//   const uploadPromises = presignedUrls.map(async (presignedUrl, index) => {
//     const file = files[index];
    
//     // Read the file
//     const fileInfo = await FileSystem.getInfoAsync(file.uri);
//     if (!fileInfo.exists) {
//       throw new Error(`File not found: ${file.uri}`);
//     }

//     // For progress tracking
//     const uploadProgressCallback = options?.onProgress 
//       ? (progress: FileSystem.DownloadProgressData) => {
//           const percent = (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100;
//           options.onProgress!(percent);
//         }
//       : undefined;

//     // Upload using Expo's FileSystem for better performance and progress tracking
//     const uploadResponse = await FileSystem.uploadAsync(
//       presignedUrl.url,
//       file.uri,
//       {
//         httpMethod: 'PUT',
//         uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
//         headers: {
//           'Content-Type': presignedUrl.contentType,
//         },
//         onUploadProgress: uploadProgressCallback,
//       }
//     );

//     if (uploadResponse.status !== 200) {
//       throw new Error(`Upload failed with status ${uploadResponse.status}`);
//     }

//     return presignedUrl;
//   });

//   return await Promise.all(uploadPromises);
// };

// /**
//  * Helper function to prepare files from Expo's ImagePicker/FilePicker
//  */
// export const prepareFiles = async (assets: any[]): Promise<FileWithType[]> => {
//   return Promise.all(assets.map(async (asset) => {
//     const uriParts = asset.uri.split('.');
//     const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
    
//     // Determine MIME type based on file extension
//     let mimeType = 'application/octet-stream';
//     if (['jpg', 'jpeg'].includes(fileExtension)) mimeType = 'image/jpeg';
//     else if (fileExtension === 'png') mimeType = 'image/png';
//     else if (fileExtension === 'gif') mimeType = 'image/gif';
//     else if (fileExtension === 'mp4') mimeType = 'video/mp4';
//     else if (fileExtension === 'mov') mimeType = 'video/quicktime';
//     else if (fileExtension === 'pdf') mimeType = 'application/pdf';
//     else if (fileExtension === 'doc' || fileExtension === 'docx') mimeType = 'application/msword';
    
//     // Get file size
//     const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    
//     return {
//       uri: asset.uri,
//       name: asset.fileName || `file_${Date.now()}.${fileExtension}`,
//       type: mimeType,
//       size: fileInfo.size,
//     };
//   }));
// };