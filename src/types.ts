export interface UserData {
  id: number;
  name: string;
  winValues: { [opponentId: number]: number };
}

export interface LaCounts {
  [winnerId: number]: {
    [loserId: number]: number;
  };
}

export interface ScoreChange {
  userId: number;
  change: number;
}

export interface GameState {
  users: UserData[];
  laCounts: LaCounts;
  currentWinnerId: number | null;
  dealerId: number;
  consecutiveWins: number;
  action: string;
  scoreChanges: ScoreChange[];
}
