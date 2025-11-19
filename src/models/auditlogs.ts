export interface ApiResponse<T> {
  message: string;
  errorMessages: any;
  errors?: any; // Backend error format: { errors: { PaperIds: ["message"] } }
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

export interface GetAuditLogsListFilter {
  searchTerm?: string;
  paperId?: number;
  activityType?: string;
}

export interface GetAuditLogsListPaging {
  start: number;
  length: number;
}

export interface GetAuditLogsListRequest {
  filter?: GetAuditLogsListFilter;
  paging?: GetAuditLogsListPaging;
  orderType?: string;
}
