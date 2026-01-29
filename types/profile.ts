

export type Address = {
  country: string;
  province: string;
  district: string;
  latitude: number;
  longitude: number;
};

export type Like = {
  _id: string;
  createdBy: string;
  likedItem: string;
  likedItemType: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type Freelancer = {
  _id: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  firstName: string;
  lastName: string;
  userProfileImage: string;
  businessType: "FREELANCER" | "CLIENT" | "OTHER";
  registrationStatus: "APPROVED_COMPLETE" | "PENDING" | "REJECTED" | "INCOMPLETE";
  workerStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  points: number;
  jobs: string[];
  skills: string[];
  workExperience: string[];
  certificates: string[];
  hourlyRate: number;
  allowNoti: boolean;
  newWorkNoti: boolean;
  chatNoti: boolean;
  systemNoti: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  about?: string;
  address?: Address;
  bannerImage?: string;
  customerExpect: string;
  freelancerType?: "FULLTIME" | "PART_TIME" | "CONTRACT" | "OFFERING";
  jobTitle?: string;
  phone?: string;
  resumeImage?: string;
  serviceType?: string;
  videoPromote?: string;
  isDeleted?: boolean;
  recommendStar?: number;
  customerStatus?: "NORMALE" | "PREMIUM" | "VIP";
  starRating?: number;
  hourlyRateCurrency: "LAK" | "USD";
  likes: Like[];
  isLiked?: boolean;
  totalWorks?: number;
  totalCompletedWork?: number;
  totalDoingWork?: number;
  totalLikes?: number;
};


export interface UserProfile {
  _id: string;
  user: {
    _id:string;
    email:string;
  };
  userCode: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  firstName: string;
  lastName: string;
  profileImage: string;
 
  email: string;
  businessType: "CUSTOMER" | "FREELANCER" | "TRANSPORT" | "ACCOMMODATION" | "COMPANY" | "SHOP";
  phone: string;
  personalCardType: "ID_CARD" | "PASSPORT" | "VISA";
  personalCardID: string;
  personalCardExpireDate: Date | string;
  personalCardImage: string;
  bankAccountId: string;
  bankAccountName: string;
  bankAccountType: string;
  bankAccountNumber: string;
  userWithCardImage: string;
  registrationStatus: "PENDING" | "APPROVED_WAITING_PAYMENT" | "APPROVED_COMPLETE" | "REJECTED" | "";
  address: {
    village: string;
    country: string;
    province: string ;
    district: string;
    latitude: number;
    longitude: number;
  };
  jobTitle: string;
  freelancerType: string;
  userProfileImage: string;
  bannerImage: string;
  videoPromote: string;
  workerStatus: "ACTIVE" | "INACTIVE";
  customerStatus: "NORMAL" | "BANNED" | "REPORTED" | "PUSHED";
  points: number;
  starRating: number;
  recommendStar: number;
  serviceType: string; // ObjectId as string
  jobs: string[]; // Array of ObjectIds as strings
  about: string;
  skills: string[];
  workExperience: string[];
  resumeImage: string;
  certificates: string[];
  customerExpect: string;
  hourlyRate: number;
  allowNoti: boolean;
  newWorkNoti: boolean;
  chatNoti: boolean;
  systemNoti: boolean;
  isDeleted: boolean;
  hourlyRateCurrency: "LAK" | "USD";
  distanceScore: number;
  createdAt: Date | string;
  updatedAt: Date | string;


}



// reviews
// types/review.d.ts
export interface IReview {
  _id: string;
  reviewer: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  reviewTo: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  work?: {
    _id: string;
    title?: string;
  };
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetReviewsParams {
  reviewer?: string;
  reviewTo?: string;
  work?: string;
  skip?: number;
  limit?: number;
}