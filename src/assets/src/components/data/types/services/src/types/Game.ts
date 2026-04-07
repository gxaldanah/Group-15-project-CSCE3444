export interface PlayerStats {
  health: number;
  strength: number;
  intelligence: number;
}

export interface GameState {
  currentNode: string;
  history: string[];
  stats: PlayerStats;
  character: string;
}