// export interface ThresholdType {
//   thresholdName: string;
//   description?: string;
//   paperType: string;
//   status: boolean;
//   psaAgreement?: string;
//   contractValueLimit: number;
//   variationPercent: number;
//   thresholdType: string
//   sourcingType?: number
// }

export interface ThresholdType {
  id: number;
  thresholdType: string;
  thresholdName: string;
  description: string;
  paperType: string | string[]; // Support both single string and array
  sourcingType: number | number[]; // Support both single number and array
  contractValueLimit: number;
  extension: string;
  triggerAction: number;
  notificationSendTo: string;
  psaAgreement: number;
  isActive: boolean;
  createdBy: number;
  createdByName: string;
  createdDate: string; // ISO date string
  modifiedBy: number | null;
  modifiedByName: string | null;
  modifiedDate: string | null;
}
