export interface VotingCycle {
  voteCycleId: number,
  papersData: ParsedData[],
  votingStartDate: string | Date,
  votingEndDate: string | Date,
  isCycleActive: boolean,
  createdDate: string | Date,
  createdByName: string,
  createdById: number,
}

export interface ParsedData {
  voteId: number,
  paperID: number,
  votingCycleId: number,
  userID: number,
  userName: string,
  userEmail: string,
  userRoleId: number,
  userRoleName: string,
  voteStatus: string,
  remarks: string | null
}
