export const GRID_SIZE = 3;  // 3x3 Puzzle

export interface Tile {
  id: number;
  isEmpty: boolean;
}

export type PuzzleState = Tile[];



export * from "./characterDialog";
export * from "./contentTypesData";
export * from "./databaseData";
export * from "./objectData";
export * from "./sessionData";
export * from "./topicData";
export * from "./transform";
