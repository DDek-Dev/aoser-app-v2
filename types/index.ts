import { Ionicons } from "@expo/vector-icons";

import { Address, UserProfile } from "./profile";




export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  freelancer: UserProfile;
  rating: number;
  reviews: number;
}


// types/index.ts
export interface Job {
  _id: string;
  createdBy: UserProfile;
  workTitle: string;
  jobTitle: string;
  customerExpect: string;
  kindOfWork: "ONLINE" | "OFFLINE";
  description: string;
  exampleWork: ExampleWork[];
  serviceType: ServiceType;
  jobs: string[];
  hourlyRate: number;
  bannerImage: string;
  category: string;
  deadLine?: string;
  budgetType: "FIXED_PRICE" | "HOURLY" | "OFFERING";
  hourlyRateCurrency: "LAK" | "USD";
  currency: "LAK" | "USD";
  startDate?: string;
  budget: number;
  systemFee: number;
  workStatus: "PUBLISHED" | "PRIVATE" | "ASSIGNED_WORKER" | "ASSIGNED_AWAIT_PAYMENT" | "DOING" | "AWAITING_COMPLETED" | "COMPLETED" | "DELAY";
  assignedTo: UserProfile;
  subWorkDetails: SubWorkDetail[];
  manageStatus: string;
  totalDonePercent: number;
  completedConfirmed: boolean;
  hiringType: "NEW_HIRE" | "RE_HIRE";
  likes: [];
  isLiked: boolean;
  totalLikes: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  workCode: string;
  invoiceType: ["WORK", "USER_RECOMMEND_STAR"]
  budget_type: string;
  myLike: Mylike[];
  applicant: UserProfile[];
  workApplicants: WorkApplicant[];
  address: Address;
  appendWorks: AppendWork[];

}

export type WorkById = {
  work: Job;
  applicant: Applicant[];
  totalApplicant: number
}

export type Applicant = {
  _id: string;
  work: string;
  applicant: UserProfile;
  applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'; // Add other possible statuses
  createdAt: string; // or Date if you want to use Date objects
  updatedAt: string; // or Date
}

export type TabType = 'mywork' | 'customerwork';
export type Mylike = {
  _id: string,
  createdBy: string,
  likedItem: string,
  likedItemType: "Work" | "UserProfile",

}
export type ExampleWork = {
  exampleType: "IMAGE" | "VIDEO" | "TEXT" | "FILE" | "LINK";
  detail: string;
  _id: string;
}

export interface WorkApplicant {
  _id: string;
  work: string;
  applicant: string;
  note: string;
  applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'; // Add other possible statuses
  createdAt: string; // or Date if you want to use Date objects
  updatedAt: string; // or Date
  __v: number;
  applicantProfile: UserProfile; // Replace 'any' with specific profile interface if known
}

// For frontend display, you might want a simplified version
export interface JobDisplay {
  id: string;
  title: string;
  type: string;
  description: string;
  budget: number;
  budgetType: string;
  category: string;
  serviceType: string;
  posted: string;
  workStatus: string;
  deadline?: string;
  createdAt: string;
}


// types.ts
export type SubTask = {
  title: string;
  subWorkStatus: "TODO" | "DOING" | "DONE" | "DELAY" | "FAILED";
};

export type SubWorkDetail = {
  // _id: string;
  sectionTitle: string;
  subTask: SubTask[];
};

export type WorkApplies = {
  _id: string;
  work: Job;
  applicant: string;
  note: string;
  applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED'; // Add other possible statuses
  createdAt: string; // or Date if you want to use Date objects
  updatedAt: string; // or Date
  __v: number;
  applicantProfile: UserProfile[]; // Replace 'any' with specific profile interface if known
}

export type BookingFormData = {
  userId?: string;
  workTitle: string;
  description: string;
  budget: number | null;
  category: string;
  kindOfWork: 'ONLINE' | 'OFFLINE';
  deadLine?: string | null;
  startDate?: string | null;
  subWorkDetails?: SubWorkDetail[];
  currency: 'LAK' | 'USD';
  budgetType: 'FIXED_PRICE' | 'HOURLY' | 'OFFERING';
  serviceType: string;
  assignedTo?: string;
  jobs?: string[];
  address:{
    country: string;
    province: string;
    district: string;
    village: string;
  }
};
export type CategoryOption = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  children?: string[];
};


export type AppendWork ={
  _id:string;
  createdBy: string;
  workId: string;
  subWorkDetails: SubWorkDetail[];
  currency: 'LAK' | 'USD';
  budget: number;
  budgetType: 'FIXED_PRICE' | 'HOURLY' | 'OFFERING';
  deadLine?: string;
  status: "PENDING" | "CONFIRMED" | "PAYMENT_COMPLETED" | "REJECTED";
  systemPercent: number;
  totalDonePercent: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}


// types/chat.ts
export type Chat = {
  _id: string;
  participants: UserProfile[];
  createdAt: string;
  updatedAt: string;
  lastMessage: Message;
  unreadCount: number;
  pinned?: boolean;
  online?: boolean;
  unread?: boolean;
};



export type Message = {
  _id?: string;
  message: string;
  conversation: string;
  sender: string;

  files?: string[];
  // projects?: string[] | WorkApplicant[];
  work?: Job;
  isUnSend: boolean;
  // projectUpdates?: ProjectUpdateData[];
  replyTo?: ReplyTo;
  messageType: "TEXT" | "FILE" | "LINK" | "WORK" | "LOCATION" | "OFFERING_WORK";
  status: "SENT" | "DELIVERED" | "READ";
  createdAt?: string;
  updatedAt?: string;
  userProfile?: UserProfile;
  offeringWorkId?: IOfferingWorkUpdate | string;
}
export type IOfferingWorkUpdate = {
  _id: string;
  workId: Job;
  requester: string;
  requestStatus: "PENDING" | "CONFIRM" | "REJECTED";
  reason: string;
  updateData: {
    deadLine: string;
    budgetType: string;
    currency: string;
    budget: number;
    assignedTo: string;
  };
  confirmedAt: Date;
}

export interface NewOfferData {
    conversationId: string,
    offeringWorkId: string
    requestStatus: "PENDING" | "CONFIRM" | "REJECTED"
}
export interface OptimisticMessage extends Omit<Message, '_id' | 'createdAt'> {
  _id?: string;
  tempId?: string;
  createdAt?: string;
  pending?: boolean;
  replyTo?: any;
}

export type ChatRoom = {
  _id: string;
  userProfile: UserProfile;
  conversationMessages: Message[];
  conversation: Conversation;

};

export type ReplyTo = {
  _id: string;
  message: string;
  conversation: string;
  sender: string;
  files?: string[];
  work?: Job;
  messageType: "TEXT" | "FILE" | "LINK" | "WORK" | "LOCATION";
  status: "SENT" | "DELIVERED" | "READ";
  createdAt?: string;
  updatedAt?: string;
  deletedUserIds?: string[]
  isUnsend?: boolean
}
export type Conversation = {
  participants: [
    string,
    string
  ];
  _id: string;
  createdAt: string;
  updatedAt: string;
}


export interface MediaFile {
  id: string;
  uri: string;
  type: 'image' | 'video' | 'document';
  name: string;
  size?: number;
  mimeType?: string;
}

export interface ProjectUpdateData {
  // offeringWorkId: string;
  // newBudget?: number;
  // newDeadline?: string;

  projectId: string;
  newBudget: number;
  newDeadline: string;
  currency: string; // Add currency field
  offeringWorkId?: string;
}


// address slector type 
export interface District {
  district_la: string;
  district_en: string;
  _id: string;
}

export interface Province {
  province_id: number;
  province_la: string;
  province_en: string;
  districts: District[];

}

// This should match your actual API response
export interface AddressInfo {
  _id?: string;
  country_la: string;
  country_en: string;
  country_code: string;
  country_calling_code: string;
  provinces: Province[]; // This is the key - provinces is an array
  __v: number;
  longitude: number;
  latitude: number;
}

export interface AddressSelectorProps {
  onAddressChange?: (address: {
    province?: Province;
    district?: District;
    village?: string;
    provinceId?: string;
    districtId?: string;
    longitude?: number;
    latitude?: number;
  }) => void;
  initialProvince?: Province;
  initialDistrict?: District;
  initialVillage?: string;
}


export interface SelectedAddress {
  province?: Province;
  district?: District;
  village?: string;
  provinceId?: string;
  districtId?: string;
  longitude?: number;
  latitude?: number;

}


// Service type

export type ServiceType = {
  _id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  isDeleted: boolean;
};


export type SubService = {
  _id: string;
  title: string;
  serviceType: string;
  rating?: number;
  ratingCount?: number;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type ServiceTypeWithJobs = ServiceType & {
  jobs?: SubService[];
};


// File image FILE

export interface FileWithType {
  uri: string;
  name: string;
  type: string;
}

export type FileMeta = {
  name: string;
  type: string; // MIME type like 'image/jpeg', 'application/pdf', etc.
  size?: number; // Optional file size in bytes
  // You can add other metadata if needed
  [key: string]: any; // For additional custom properties
};

export type PresignedUrl = {
  contentType: string;  // e.g., "image/jpeg"
  filename: string;     // e.g., "3a8a8404-b495-4fd0-af8f-f8f9c7af66a5.jpeg"
  key: string;          // e.g., "uploads/3a8a8404-b495-4fd0-af8f-f8f9c7af66a5.jpeg"
  url: string;          // The full presigned URL with query params
};


// review 


export type CreateReview = {
  work: string;
  reviewTo: string;
  rating: number;
  comment: string;
};
export type Review = {
  _id: string;
  work: Job;
  reviewTo: UserProfile;
  rating: number;
  comment: string;
  reviewer: UserProfile;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

// create Favorite 
export type Favorite = {
  likedItem: string;
  likedItemType: 'Work' | 'UserProfile';
};

export type GetFavorite = {
  _id: string;
  createdBy: UserProfile;
  likedItem: Job;
  likedItemType: 'Work' | 'UserProfile';
  createdAt: string;
  updatedAt: string;
  __v: number;
}



export interface JobInfo {
  _id: string;
  title: string;
  serviceType: string;
  rating: number;
  ratingCount: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  __v: number;
  isDeleted: boolean;
  image: string;
}

export interface ServiceInfo {
  _id: string;
  name: string;
  icon: string;
  __v: number;
  isDeleted: boolean;
  color: string;
}

export interface JobpopularData {
  _id: string;
  count: number;
  jobInfo: JobInfo;
  serviceInfo: ServiceInfo[];
}



// notification type 


export type NotificationType = "Like" | "Work" | "Review" | "Message" | "PaymentHistory" | "PostComment" | "UserProfile" | "News";

export interface Notifications {
  _id: string;
  recipient: UserProfile;
  sender?: UserProfile;
  title: string;
  message: string;
  aboutNotification: string;
  notificationType: NotificationType;
  isRead: boolean;
  relatedPost?: string;
  relatedChat?: string;
  relatedFreelancer?: string; 
  createdAt: string;
  updatedAt: string;
  notifyAbout: ["ADMING_PAYMENT_CLAIM_TO_WORKER", "ADMIN_UPDATE_WORK_DATA", "FREELANCER_SUBMIT_WORK", "FREELANCER_EXCEPT_ASIGNED_WORK", "FREELANCER_EXCEPTION_APPEND_WORK", "FREELANCER_APPLY_WORK","OWNER_APPEND_WORK", "CONFIRMATION_WORK","UPDATE_WORK_DATA","CREATE_WORK_AND_ASSIGNED_WORKER","CREATE_PUBLIC_WORK","CREATE_REVIEW","AOSER_ADMIN_UPDATE_NEWS","AOSER_ADMIN_CREATE_NEWS","UPDATE_FREELANCER_DATA","UPDATE_FREELANCER_KYC","CREATE_FREELANCER_KYC"]
}


export type UreadNotification = {
  isViewed: boolean;
  notificationUnreadCount: number;
}
