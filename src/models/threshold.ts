export interface ThresholdType {
  thresholdName: string;
  description?: string;
  paperType: string;
  status: boolean;
  psaAgreement: string;
  contractValueLimit: number;
  variationPercent: number;
  thresholdType: string
}
