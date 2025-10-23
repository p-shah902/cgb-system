export interface ApiResponse<T> {
  message: string;
  errorMessages: any;
  exception: any;
  data: T;
  status: boolean;
}

export interface AuditLogs {
  id: number;
  paperId: number;
  activityType: string;
  logDescription: string;
  createdBy: number;
  createdByName: string;
  createdDate: string;
  modifiedBy: number;
  modifiedByName: string;
  modifiedDate: string;
}
