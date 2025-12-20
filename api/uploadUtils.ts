import axios from 'axios';


const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


export type PresignedUrlResponse = {
  filename: string;
  key: string;
  url: string;
  contentType: string;
};

export const getPresignedUrls = async (files: { name: string; type: string, size?: number }[]) => {
  const fileMeta = files.map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size
  }));
  console.log("FILE : ", fileMeta);


  const res = await axios.post(`${API_BASE_URL}/worker/presigned-urls`, {
    files: fileMeta
  });
  console.log("RES : ", res.data.data);


  return res.data.data as PresignedUrlResponse[];
};



export const uploadFileToUrl = async (url: string, fileUri: string, contentType: string) => {
  try {
    console.log('Starting upload:', { url: url.split('?')[0], contentType });
    
    // Read the file as a blob
    const fileBlob = await fetch(fileUri).then(r => {
      if (!r.ok) {
        throw new Error(`Failed to read file: ${r.status}`);
      }
      return r.blob();
    });

    console.log('File blob size:', fileBlob.size, 'bytes');

    const isVideo = contentType.startsWith('video/');
    const timeoutMs = isVideo ? 300000 : 60000; // 5 minutes for video, 1 minute for images

    // Create upload promise (don't await it yet!)
    const uploadPromise = fetch(url, {
      method: 'PUT',
      body: fileBlob,
      headers: {
        'Content-Type': contentType,
      },
    });

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout')), timeoutMs);
    });

    // Race them properly
    const response = await Promise.race([uploadPromise, timeoutPromise]) as Response;

    console.log("UPLOAD RESPONSE STATUS:", response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }

    console.log('Upload completed successfully');
    return response;
    
  } catch (error) {
    console.log('Upload error:', error);
    
    // Better error messages
    // if (error.message?.includes('timeout')) {
    //   throw new Error('Upload timeout - file may be too large or connection too slow');
    // } else if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
    //   throw new Error('Network error - check your internet connection');
    // } else if (error.message?.includes('413')) {
    //   throw new Error('File too large');
    // }
    
    throw error;
  }
};