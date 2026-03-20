import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SetStateAction } from "react";
import { District, FileWithType, PresignedUrl, Province } from "types";
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from "./useAuth";

const CDN_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL || '';

const remoteFile = (filename: string | undefined, kind: 'image' | 'video' = 'image'): FileWithType | null => {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  const type =
    kind === 'video'
      ? 'video/mp4'
      : lower.endsWith('.png')
        ? 'image/png'
        : lower.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg';

  return {
    uri: `${CDN_BASE_URL}${filename}`,
    name: filename,
    type,
  };
};


export const useKycUserId = (): string => {
  const { user } = useAuth();
  return user?._id || '';
};

type AoserProfile = {
  _id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  profileImg: FileWithType | null;
  gender: string;
  phone: string;
  address?: {
    country?: string;
    province?: string;
    district?: string;
    village?: string;
    latitude?: number;
    longitude?: number;
  };
};


export const useAoserProfile = (userId: string) => {
  return useQuery<AoserProfile | null>({
    queryKey: ['aoserProfile', userId],
    queryFn: async () => {
      const data = await AsyncStorage.getItem(`${userId}:@aoser_profile`);
      if (!data) return null;
      
      const parsedData = JSON.parse(data);
      
      // RECONSTRUCT THE PROFILE IMAGE FROM SAVED PATH/META
      if (parsedData.profileImgPath && parsedData.profileImgMeta) {
        parsedData.profileImg = {
          uri: parsedData.profileImgPath,
          name: parsedData.profileImgMeta.name,
          type: parsedData.profileImgMeta.type,
        };
        
        // Optional: Verify the file still exists
        try {
          const fileExists = await FileSystem.getInfoAsync(parsedData.profileImgPath);
          if (!fileExists.exists) {
            console.warn('Profile image file not found at stored path');
            parsedData.profileImg = null;
          }
        } catch (error) {
          console.log('Error checking file existence:', error);
          parsedData.profileImg = null;
        }
      }

      // If we saved a remote filename (rejected KYC flow), reconstruct it back to a FileWithType
      if (!parsedData.profileImg && parsedData.existingProfileImg) {
        parsedData.profileImg = remoteFile(parsedData.existingProfileImg, 'image');
      }
      return {
        ...parsedData,
        _id: parsedData._id || parsedData.userId || '',
        userId: parsedData.userId || parsedData._id || '',
      };
    },
    enabled: !!userId,
  });
};

type UpgradeToFreelancerStep1 = {
  jobTitle: string;
  promoVideoFile?: FileWithType | null;
  promoVideoTouched?: boolean;
  freelancerType: string;
  category: string;
  subcategories: string[];
  bannerImageFile: FileWithType | null;
  presignedUrls: PresignedUrl[]
};

export const useUpgradeToFreelancerStep1 = () => {
  const userId = useKycUserId();
  return useQuery<UpgradeToFreelancerStep1 | null>({
    queryKey: ['freelancerStep1' , userId],
    queryFn: async () => {
      const data = await AsyncStorage.getItem(`${userId}:@freelancer_step1`);
      if (!data) return null;

      const parsedData = JSON.parse(data);
      
      // RECONSTRUCT BANNER IMAGE
      if (parsedData.bannerImagePath && parsedData.bannerImageMeta) {
        parsedData.bannerImageFile = {
          uri: parsedData.bannerImagePath,
          name: parsedData.bannerImageMeta.name,
          type: parsedData.bannerImageMeta.type,
        };

        // Verify the file still exists
        try {
          const fileExists = await FileSystem.getInfoAsync(parsedData.bannerImagePath);
          if (!fileExists.exists) {
            console.warn('Banner image file not found at stored path');
            parsedData.bannerImageFile = null;
          }
        } catch (error) {
          console.log('Error checking banner file existence:', error);
          parsedData.bannerImageFile = null;
        }
      }

      if (!parsedData.bannerImageFile && parsedData.existingBannerImage) {
        parsedData.bannerImageFile = remoteFile(parsedData.existingBannerImage, 'image');
      }

      // RECONSTRUCT PROMO VIDEO
      if (parsedData.promoVideoPath && parsedData.promoVideoMeta) {
        parsedData.promoVideoFile = {
          uri: parsedData.promoVideoPath,
          name: parsedData.promoVideoMeta.name,
          type: parsedData.promoVideoMeta.type,
        };

        // Verify the file still exists
        try {
          const fileExists = await FileSystem.getInfoAsync(parsedData.promoVideoPath);
          if (!fileExists.exists) {
            console.warn('Promo video file not found at stored path');
            parsedData.promoVideoFile = null;
          }
        } catch (error) {
          console.log('Error checking promo video existence:', error);
          parsedData.promoVideoFile = null;
        }
      }

      if (!parsedData.promoVideoFile && parsedData.existingPromoVideo) {
        parsedData.promoVideoFile = remoteFile(parsedData.existingPromoVideo, 'video');
      }

      const touchedFlag = parsedData.promoVideoTouched === true;
      const hasPromoValue =
        (typeof parsedData.existingPromoVideo === 'string' && parsedData.existingPromoVideo.length > 0) ||
        (typeof parsedData.promoVideoPath === 'string' && !!parsedData.promoVideoMeta);

      const shouldOverride = touchedFlag || hasPromoValue;
      parsedData.promoVideoTouched = touchedFlag;

      if (shouldOverride) {
        if (!hasPromoValue && parsedData.promoVideoFile === undefined) {
          // Explicitly cleared by the user in a previous session.
          parsedData.promoVideoFile = null;
        }
      } else {
        // Do not overwrite server-prefilled state when the draft has no promo info.
        delete parsedData.promoVideoFile;
      }

      return parsedData;
    },
    enabled: !!userId,
  });
}


type UpgradeToFreelancerStep2 = {
  skills: string[];
  experience: string[];
  aboutMe: string;
  resumeImageFile: FileWithType | null;
  certificateImages?: FileWithType[];
  certificatesTouched?: boolean;
};

export const useUpgradeToFreelancerStep2 = () => {
  const userId = useKycUserId();
  return useQuery<UpgradeToFreelancerStep2 | null>({
    queryKey: ['freelancerStep2',userId],
    queryFn: async () => {
      const data = await AsyncStorage.getItem(`${userId}:@freelancer_step2`);
      if (!data) return null;

      const parsedData = JSON.parse(data);
      
      // RECONSTRUCT RESUME IMAGE (not banner!)
      if (parsedData.resumeImagePath && parsedData.resumeImageMeta) {
        try {
          const fileExists = await FileSystem.getInfoAsync(parsedData.resumeImagePath);
          if (fileExists.exists) {
            parsedData.resumeImageFile = {
              uri: parsedData.resumeImagePath,
              name: parsedData.resumeImageMeta.name,
              type: parsedData.resumeImageMeta.type,
            };
          } else {
            console.warn('Resume image file not found at stored path');
            parsedData.resumeImageFile = null;
          }
        } catch (error) {
          console.log('Error checking resume file existence:', error);
          parsedData.resumeImageFile = null;
        }
        
        // Clean up the temporary keys (optional)
        delete parsedData.resumeImagePath;
        delete parsedData.resumeImageMeta;
      } else {
        parsedData.resumeImageFile = null;
      }

      const hasCertInfo =
        parsedData.certificatesTouched === true ||
        ('existingCertificates' in parsedData) ||
        ('certificatePaths' in parsedData);

      // RECONSTRUCT CERTIFICATE IMAGES ARRAY
      let localCertFiles: FileWithType[] = [];
      if (parsedData.certificatePaths && parsedData.certificateMetas) {
        
        for (let i = 0; i < parsedData.certificatePaths.length; i++) {
          try {
            const filePath = parsedData.certificatePaths[i];
            const fileMeta = parsedData.certificateMetas[i];
            
            const fileExists = await FileSystem.getInfoAsync(filePath);
            if (fileExists.exists && fileMeta) {
              localCertFiles.push({
                uri: filePath,
                name: fileMeta.name,
                type: fileMeta.type,
              });
            } else {
              console.warn(`Certificate file not found: ${filePath}`);
            }
          } catch (error) {
            console.log('Error checking certificate file existence:', error);
          }
        }
        
        // Clean up the temporary keys (optional)
        delete parsedData.certificatePaths;
        delete parsedData.certificateMetas;
      }

      // Remote certificate filenames saved during rejected re-submit flow
      const remoteCertFiles =
        Array.isArray(parsedData.existingCertificates)
          ? (parsedData.existingCertificates
              .map((name: string) => remoteFile(name, 'image'))
              .filter(Boolean) as FileWithType[])
          : [];

      const mergedCerts = [...remoteCertFiles, ...localCertFiles];

      // Ensure the return type matches exactly
      return {
        skills: parsedData.skills || [],
        experience: parsedData.experience || [],
        aboutMe: parsedData.aboutMe || '',
        resumeImageFile: parsedData.resumeImageFile || null,
        certificatesTouched: parsedData.certificatesTouched === true,
        certificateImages: hasCertInfo ? mergedCerts : undefined,
      };
    },
    enabled: !!userId,
  });
};


type UpgradeToFreelancerStep3 = {
  serviceDesc: string;
  hourlyRate: number;
  budgetCurrency: 'USD' | 'LAK';
  rateType?: 'PER_HOUR' | 'PER_JOB' | 'PER_DAY';
};

export const useUpgradeToFreelancerStep3 = () => {
  const userId = useKycUserId();
  return useQuery<UpgradeToFreelancerStep3 | null>({
    queryKey: ['freelancerStep3', userId],
    queryFn: async () => {
      const data = await AsyncStorage.getItem(`${userId}:@freelancer_step3`);
      if (!data) return null;
      return JSON.parse(data);
    },
    enabled: !!userId,
  });
}

export type UpgradeToFreelancerStep4 = {
  cardType: SetStateAction<"ID_CARD" | "PASSPORT" | "VISA">;
  cardID: string;
  fromDate: string;
  address?: {
    province?: Province;
    district?: District;
    village?: string;
    longitude?: number;
    latitude?: number;
  };
};

export const useUpgradeToFreelancerStep4 = () => {
  const userId = useKycUserId();
  return useQuery<UpgradeToFreelancerStep4 | null>({
    queryKey: ['freelancerStep4', userId],
    queryFn: async () => {
      const data = await AsyncStorage.getItem(`${userId}:@freelancer_step4`);
      // console.log(data);
      if (!data) return null;
      return JSON.parse(data);
    },
    enabled: !!userId,
  });
}




type UpgradeToFreelancerStep5 = {
  selfieWithCard: FileWithType | null;
  cardImage: FileWithType | null;
};

export const useUpgradeToFreelancerStep5 = () => {
  const userId = useKycUserId();
  return useQuery<UpgradeToFreelancerStep5 | null>({
    queryKey: ['freelancerStep5', userId],
    queryFn: async () => {
      const data = await AsyncStorage.getItem(`${userId}:@freelancer_step5`);
      if (!data) return null;

      const parsedData = JSON.parse(data);
      
      // RECONSTRUCT SELFIE WITH CARD
      if (parsedData.selfieWithCardPath && parsedData.selfieWithCardMeta) {
        try {
          const fileExists = await FileSystem.getInfoAsync(parsedData.selfieWithCardPath);
          if (fileExists.exists) {
            parsedData.selfieWithCard = {
              uri: parsedData.selfieWithCardPath,
              name: parsedData.selfieWithCardMeta.name,
              type: parsedData.selfieWithCardMeta.type,
            };
          } else {
            console.warn('Selfie with card file not found at stored path');
            parsedData.selfieWithCard = null;
          }
        } catch (error) {
          console.log('Error checking selfie with card file existence:', error);
          parsedData.selfieWithCard = null;
        }
        
        // Clean up the temporary keys
        delete parsedData.selfieWithCardPath;
        delete parsedData.selfieWithCardMeta;
      } else {
        parsedData.selfieWithCard = null;
      }

      // RECONSTRUCT CARD IMAGE
      if (parsedData.cardImagePath && parsedData.cardImageMeta) {
        try {
          const fileExists = await FileSystem.getInfoAsync(parsedData.cardImagePath);
          if (fileExists.exists) {
            parsedData.cardImage = {
              uri: parsedData.cardImagePath,
              name: parsedData.cardImageMeta.name,
              type: parsedData.cardImageMeta.type,
            };
          } else {
            console.warn('Card image file not found at stored path');
            parsedData.cardImage = null;
          }
        } catch (error) {
          console.log('Error checking card image file existence:', error);
          parsedData.cardImage = null;
        }
        
        // Clean up the temporary keys
        delete parsedData.cardImagePath;
        delete parsedData.cardImageMeta;
      } else {
        parsedData.cardImage = null;
      }

      if (!parsedData.selfieWithCard && parsedData.existingSelfieWithCard) {
        parsedData.selfieWithCard = remoteFile(parsedData.existingSelfieWithCard, 'image');
      }

      if (!parsedData.cardImage && parsedData.existingCardImage) {
        parsedData.cardImage = remoteFile(parsedData.existingCardImage, 'image');
      }

      // Ensure the return type matches exactly
      return {
        selfieWithCard: parsedData.selfieWithCard || null,
        cardImage: parsedData.cardImage || null,
      };
    },
    enabled: !!userId,
  });
};

type UpgradeToFreelancerStep6 = {
  paymentMethod: 'LAOS_BANK' | 'PAYPAL';
  bankName: string;
  accountName: string;
  bankNumber?: string;
  paypalInfo?: string;
};

export const useUpgradeToFreelancerStep6 = () => {
  const userId = useKycUserId();
  return useQuery<UpgradeToFreelancerStep6 | null>({
    queryKey: ['freelancerStep6', userId],
    queryFn: async () => {
      const data = await AsyncStorage.getItem(`${userId}:@freelancer_step6`);
      if (!data) return null;
      return JSON.parse(data);
    },
    enabled: !!userId,
  });
}


type UpgradeToFreelancerStep7 = {
  agreed: boolean;
}

export const useUpgradeToFreelancerStep7 = () => {
  const userId = useKycUserId();
  return useQuery<UpgradeToFreelancerStep7 | null>({
    queryKey: ['freelancerStep7', userId],
    queryFn: async () => {
      const data = await AsyncStorage.getItem(`${userId}:@freelancer_step7`);
      if (!data) return null;
      return JSON.parse(data);
    },
    enabled: !!userId,
  });
}


const fetchFreelancerLocalProfile = async (userId: string): Promise<any | null> => {
  try {
    const [aoserProfile, saved1, saved2, saved3] = await Promise.all([
      AsyncStorage.getItem(`${userId}:@aoser_profile`),
      AsyncStorage.getItem(`${userId}:@freelancer_step1`),
      AsyncStorage.getItem(`${userId}:@freelancer_step2`),
      AsyncStorage.getItem(`${userId}:@freelancer_step3`),
    ]);

    const aoser_profile = aoserProfile ? JSON.parse(aoserProfile) : null;
    const step1 = saved1 ? JSON.parse(saved1) : null;
    const step2 = saved2 ? JSON.parse(saved2) : null;
    const step3 = saved3 ? JSON.parse(saved3) : null;

    console.log('Loaded 1:', aoser_profile)
    if (aoser_profile && step1 && step2 && step3) {

      const promoTouched =
        step1.promoVideoTouched === true ||
        ('promoVideoPath' in step1) ||
        ('existingPromoVideo' in step1);

      const certsTouched =
        step2.certificatesTouched === true ||
        ('certificatePaths' in step2) ||
        ('existingCertificates' in step2);

      // In review mode, components expect local URIs or absolute URLs (not filenames).
      const resolvedUserProfileImage =
        aoser_profile.profileImg?.uri ||
        (aoser_profile.existingProfileImg ? `${CDN_BASE_URL}${aoser_profile.existingProfileImg}` : '');

      const resolvedBannerImage =
        step1.bannerImagePath ||
        (step1.existingBannerImage ? `${CDN_BASE_URL}${step1.existingBannerImage}` : '');

      const resolvedPromoVideo =
        step1.promoVideoPath ||
        (step1.existingPromoVideo ? `${CDN_BASE_URL}${step1.existingPromoVideo}` : '');

      const resolvedCertificates: string[] = [
        ...(Array.isArray(step2.existingCertificates)
          ? step2.existingCertificates.map((name: string) => `${CDN_BASE_URL}${name}`)
          : []),
        ...(Array.isArray(step2.certificatePaths) ? step2.certificatePaths : []),
      ].filter(Boolean);

      const profile = {
        // User Info
        _id: aoser_profile.userId || aoser_profile._id || '',
        firstName: aoser_profile.firstName || '',
        lastName: aoser_profile.lastName || '',
        userProfileImage: resolvedUserProfileImage,


        // Basic Info
        jobTitle: step1.jobTitle || '',
        freelancerType: step1.freelancerType || 'FREELANCER',
        businessType: 'FREELANCER',
        // Media
        bannerImage: resolvedBannerImage,
        videoPromote: promoTouched ? resolvedPromoVideo : '',

        // Professional Info
        hourlyRate: Number(step3.hourlyRate || 0),
        about: step2.aboutMe || '',
        skills: step2.skills || [],
        workExperience: step2.experience || [],
        certificates: certsTouched ? resolvedCertificates : [],
        resumeImage: step2.resumeImagePath || '',
        customerExpect: step3.serviceDesc || '',
        starRating: 0,
        recommendStar: 0,
        address: aoser_profile.address || undefined,

        // Status
        workerStatus: 'ACTIVE',
        registrationStatus: 'PENDING',

        // Draft flags for merging with DB in the Review screen.
        promoVideoTouched: promoTouched,
        certificatesTouched: certsTouched,
       
      };

      console.log('Fetched freelancer profile:', JSON.stringify(profile,null,2));

      return profile;
    }

    return null;
  } catch (error) {
    console.log('❌ Error loading user profile:', error);
    throw error;
  }
};
export const useUpgradeToFreelancerReview = (

) => {
  
  const userId = useKycUserId();
  return useQuery({
    queryKey: ['freelancerReview', userId],
    queryFn: () => fetchFreelancerLocalProfile(userId),

    staleTime: Infinity,
    // cacheTime: Infinity,
    enabled: !!userId,
  });
};




export const useSubmitFreelancerProfile = () => {
  return useMutation({
    mutationFn: async (freelancerData: any) => {
      const response = await fetch('https://your-api.com/api/freelancer/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add Authorization header if needed
        },
        body: JSON.stringify(freelancerData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to submit freelancer profile');
      }

      return response.json(); // or `return true` if no response body
    },
  });
};
