export interface InboxOutbox {
  paperID: number,
  paperCreatedDate: string | Date,
  paperLastModifyDate: string | Date,
  paperType: string,
  paperStatusId: number,
  paperStatus: string,
  purposeRequired: string,
  paperProvision: string,
  cycleStartDate: string | Date,
  cycleDueDate: string | Date,
  voteStatus: string
}

export interface InboxOutboxPaging {
  start: number;
  length: number;
}

export interface InboxOutboxRequest {
  paperName?: string;
  paperStatus?: number[];
  dueDate?: string;
  orderType?: string;
  paging?: InboxOutboxPaging;
}
