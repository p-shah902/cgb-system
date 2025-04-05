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
