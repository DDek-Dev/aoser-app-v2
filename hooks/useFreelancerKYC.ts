import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SetStateAction } from "react";
import { District, FileWithType, PresignedUrl, Province } from "types";
import { Freelancer, UserProfile } from "types/profile";
import * as FileSystem from 'expo-file-system/legacy';

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


export const useAoserProfile = () => {
  return useQuery<AoserProfile | null>({
    queryKey: ['aoserProfile'],
    queryFn: async () => {
      const data = await AsyncStorage.getItem('@aoser_profile');
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
      
      return {
        ...parsedData,
        _id: parsedData._id || parsedData.userId || '',
        userId: parsedData.userId || parsedData._id || '',
      };
    },
  });
};

type UpgradeToFreelancerStep1 = {
  jobTitle: string;
  promoVideoFile: FileWithType | null;
  freelancerType: string;
  category: string;
  subcategories: string[];
  bannerImageFile: FileWithType | null;
  presignedUrls: PresignedUrl[]
};

export const useUpgradeToFreelancerStep1 = () => {
  return useQuery<UpgradeToFreelancerStep1 | null>({
    queryKey: ['freelancerStep1'],
    queryFn: async () => {
      const data = await AsyncStorage.getItem('@freelancer_step1');
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

      return parsedData;
    },
  });
}

// type UpgradeToFreelancerStep2 = {
//   skills: string[];
//   experience: string[];
//   aboutMe: string;
//   resumeImageFile: FileWithType | null;
//   certificateImages: FileWithType[] | [];
// };

// export const useUpgradeToFreelancerStep2 = () => {
//   return useQuery<UpgradeToFreelancerStep2 | null>({
//     queryKey: ['freelancerStep2'],
//     // queryFn: async () => {
//     //   const data = await AsyncStorage.getItem('@freelancer_step2');
//     //   if (!data) return null;
//     //   return JSON.parse(data);
//     // },

//     queryFn: async () => {
//       const data = await AsyncStorage.getItem('@freelancer_step2');
//       if (!data) return null;

//       const parsedData = JSON.parse(data);
      
//       // RECONSTRUCT BANNER IMAGE
//       if (parsedData.resumeImageFile) {
//         parsedData.resumeImageFile = {
//           uri: parsedData.resumeImageFile,
//           name: parsedData.bannerImageMeta.name,
//           type: parsedData.bannerImageMeta.type,
//         };

//         // Verify the file still exists
//         try {
//           const fileExists = await FileSystem.getInfoAsync(parsedData.bannerImagePath);
//           if (!fileExists.exists) {
//             console.warn('Banner image file not found at stored path');
//             parsedData.bannerImageFile = null;
//           }
//         } catch (error) {
//           console.log('Error checking banner file existence:', error);
//           parsedData.bannerImageFile = null;
//         }
//       }

      

//       return parsedData;
//     },
//   });
// }


type UpgradeToFreelancerStep2 = {
  skills: string[];
  experience: string[];
  aboutMe: string;
  resumeImageFile: FileWithType | null;
  certificateImages: FileWithType[];
};

export const useUpgradeToFreelancerStep2 = () => {
  return useQuery<UpgradeToFreelancerStep2 | null>({
    queryKey: ['freelancerStep2'],
    queryFn: async () => {
      const data = await AsyncStorage.getItem('@freelancer_step2');
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

      // RECONSTRUCT CERTIFICATE IMAGES ARRAY
      if (parsedData.certificatePaths && parsedData.certificateMetas) {
        parsedData.certificateImages = [];
        
        for (let i = 0; i < parsedData.certificatePaths.length; i++) {
          try {
            const filePath = parsedData.certificatePaths[i];
            const fileMeta = parsedData.certificateMetas[i];
            
            const fileExists = await FileSystem.getInfoAsync(filePath);
            if (fileExists.exists && fileMeta) {
              parsedData.certificateImages.push({
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
      } else {
        parsedData.certificateImages = [];
      }

      // Ensure the return type matches exactly
      return {
        skills: parsedData.skills || [],
        experience: parsedData.experience || [],
        aboutMe: parsedData.aboutMe || '',
        resumeImageFile: parsedData.resumeImageFile || null,
        certificateImages: parsedData.certificateImages || [],
      };
    },
  });
};


type UpgradeToFreelancerStep3 = {
  serviceDesc: string;
  hourlyRate: number;
  budgetCurrency: 'USD' | 'LAK';
};

export const useUpgradeToFreelancerStep3 = () => {
  return useQuery<UpgradeToFreelancerStep3 | null>({
    queryKey: ['freelancerStep3'],
    queryFn: async () => {
      const data = await AsyncStorage.getItem('@freelancer_step3');
      if (!data) return null;
      return JSON.parse(data);
    },
  });
}

export type UpgradeToFreelancerStep4 = {
  cardType: SetStateAction<"ID_CARD" | "PASSPORT" | "VISA">;
  cardID: string;
  fromDate: Date;
  address?: {
    province?: Province;
    district?: District;
    village?: string;
    longitude?: number;
    latitude?: number;
  };
};

export const useUpgradeToFreelancerStep4 = () => {
  return useQuery<UpgradeToFreelancerStep4 | null>({
    queryKey: ['freelancerStep4'],
    queryFn: async () => {
      const data = await AsyncStorage.getItem('@freelancer_step4');
      // console.log(data);
      if (!data) return null;
      return JSON.parse(data);
    },
  });
}




type UpgradeToFreelancerStep5 = {
  selfieWithCard: FileWithType | null;
  cardImage: FileWithType | null;
};

export const useUpgradeToFreelancerStep5 = () => {
  return useQuery<UpgradeToFreelancerStep5 | null>({
    queryKey: ['freelancerStep5'],
    queryFn: async () => {
      const data = await AsyncStorage.getItem('@freelancer_step5');
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

      // Ensure the return type matches exactly
      return {
        selfieWithCard: parsedData.selfieWithCard || null,
        cardImage: parsedData.cardImage || null,
      };
    },
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
  return useQuery<UpgradeToFreelancerStep6 | null>({
    queryKey: ['freelancerStep6'],
    queryFn: async () => {
      const data = await AsyncStorage.getItem('@freelancer_step6');
      if (!data) return null;
      return JSON.parse(data);
    },
  });
}


type UpgradeToFreelancerStep7 = {
  agreed: boolean;
}

export const useUpgradeToFreelancerStep7 = () => {
  return useQuery<UpgradeToFreelancerStep7 | null>({
    queryKey: ['freelancerStep7'],
    queryFn: async () => {
      const data = await AsyncStorage.getItem('@freelancer_step7');
      if (!data) return null;
      return JSON.parse(data);
    },
  });
}


const fetchFreelancerLocalProfile = async (): Promise<Freelancer | null> => {
 
  try {
    const [aoserProfile, saved1, saved2, saved3] = await Promise.all([
      AsyncStorage.getItem('@aoser_profile'),
      AsyncStorage.getItem('@freelancer_step1'),
      AsyncStorage.getItem('@freelancer_step2'),
      AsyncStorage.getItem('@freelancer_step3'),
    ]);

    const aoser_profile = aoserProfile ? JSON.parse(aoserProfile) : null;
    const step1 = saved1 ? JSON.parse(saved1) : null;
    const step2 = saved2 ? JSON.parse(saved2) : null;
    const step3 = saved3 ? JSON.parse(saved3) : null;

    console.log('Loaded 1:', aoser_profile)
    if (aoser_profile && step1 && step2 && step3) {


      const profile = {
        // User Info
        _id: aoser_profile.userId || aoser_profile._id || '',
        firstName: aoser_profile.firstName || '',
        lastName: aoser_profile.lastName || '',
        userProfileImage: aoser_profile.profileImg?.uri,


        // Basic Info
        jobTitle: step1.jobTitle || '',
        freelancerType: step1.freelancerType || 'FREELANCER',
        businessType: 'FREELANCER',
        // Media
        bannerImage: step1.bannerImagePath,
        videoPromote: step1.promoVideoPath,

        // Professional Info
        hourlyRate: Number(step3.hourlyRate || 0),
        about: step2.aboutMe || '',
        skills: step2.skills || [],
        workExperience: step2.experience || [],
        certificates: step2.certificatePaths || [],
        resumeImage: step2.resumeImagePath || '',
        customerExpect: step3.serviceDesc || '',
        starRating: 0,
        recommendStar: 0,
        address: aoser_profile.address || undefined,

        // Status
        workerStatus: 'ACTIVE',
        registrationStatus: 'PENDING',

       
      };

      console.log('Fetched freelancer profile:', JSON.stringify(profile,null,2));

      return profile as Freelancer;
    }

    return null;
  } catch (error) {
    console.log('❌ Error loading user profile:', error);
    throw error;
  }
};
export const useUpgradeToFreelancerReview = (

) => {
  return useQuery({
    queryKey: ['freelancerReview'],
    queryFn: () => fetchFreelancerLocalProfile(),

    staleTime: Infinity,
    // cacheTime: Infinity,
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
