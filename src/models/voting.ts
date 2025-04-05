export interface VotingCycle {
  voteCycleId: number,
  papersData: ParsedData[],
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
