import { BookingFormData } from "types";
import { UserProfile } from "./profile";
import { NavigatorScreenParams } from "@react-navigation/native";

export type OnboardingStackParamList = {
  LanguageSelection: undefined;
  Onboarding: undefined;


};
export type FreelancerStackParamList = {
  AuthCallback: undefined;
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  SearchBar: { text: string; focus?: boolean };
  SearchView: { query: string };
  Onboarding: undefined;

  FreelancerProfile: { userId: string };
  ResumeImageViewer: { uri: string };
  Bookfreelancer: { userId: string };
  ConfirmBookingScreen: { formData: BookingFormData , isBook?:boolean};
  ConfirmPostjob: { formData: BookingFormData};
  TopFreelancerList: undefined;

  // profile setting
  AoserProfileSetting: undefined;

  // start freelancer role 

  UpgradeToFreelancer: undefined;
  // freelancer profile 
  CustomerProfile: { userId: string };

  FreelancerRoleGate: undefined;
  AuthFreelancerProfile: { userId: string };
  AuthFreelancerSetting: undefined;
  EditFreelancerJobsection: undefined;
  EditAoserProfile: undefined;
  EditFreelancerAboutMe: undefined;
  EditFreelancerOffer: undefined;
  FreelancerWorkHistory: undefined;
  UserIdScreen: { userId: UserProfile };
  RecommendUser: undefined;


  // aoser peofile setting
  LanguageSelectScreen: undefined;
  ChangePasswordScreen: undefined;
  NotificationSettingsScreen: undefined;
  AskAQuestionScreen: undefined;
  PrivacyPolicyScreen: undefined;


  // Freelancer work detail 
  FreelancerWorkDetail: { workId: string };
  EditWorkById: { workId: string };
  AppendOwnerWork: { workId: string };

  // Payment
  PaymentScreen: { workId: string, budget: number, currency: string, terminalid: string, invoiceType: string, workCode?: string };
  PaymentDetail_Id: { workId: string };

  // Chat 
  ChatScreen: undefined;
  RoomChat: { userId: string };
  ChatStack: undefined


  // Aoser profile favorite 
  FavoriteScreen: undefined;
  HistoryScreen: undefined;

  // Auth login/signup
  SignUp: undefined;
  SignIn: undefined;
  OtpRequest: { email: string };
  ForgotPassword: undefined;
  ProfileSetup: undefined;
};


export type TabParamList = {
  Home: undefined;
  Works: undefined;
  Notifications: undefined;
  "New work": undefined;
  Profile: undefined;
  NotificationsScreen: undefined;
};




