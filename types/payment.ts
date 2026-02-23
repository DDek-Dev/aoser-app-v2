import { UserProfile } from "./profile";

export interface Payment {
  createBy?: string;
  _id: string;
  amount: number;
  currency: "LAK" | "USD";

  paymentMethod: string;
  bankName: string;
  paymentForType: "Work" | "UserProfile";
  invoiceType: "WORK" | "USER_RECOMEND__STAR" |"APPEND_WORK";
  uuid:string;
  desc: string;
  payTo: string;
  paymentFor: string;
  fromBankInformation: string;
  description?: string;
  terminalid: string;
  tag1?: string;
  tag2?: string;
  tag3?: string;
  createdAt?: string;
  updatedAt?: string;
  

}


export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    qrc: string;
  };
  invoiceId: string;
}

export type PaymentCallback ={
  createBy: UserProfile;
  payTo: UserProfile;
  paymentForType: "Work" | "UserProfile";
  invoiceType: "WORK" | "USER_RECOMEND__STAR" |"APPEND_WORK";
  invoiceid: string;
  uuid: string;
  amount: number;
  currency: "LAK" | "USD";
  status: "PAYMENT_PENDING"|"PAYMENT_COMPLETED" | "PAYMENT_FAILED"| "PAYMENT_CANCELLED"| "PAYMENT_AWAITING_APPROVAL"
}



