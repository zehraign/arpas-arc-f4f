import { GRID_SIZE, PuzzleState } from "../types";


// Puzzle Ausgangszustand
export function createInitialState(): PuzzleState {
  const tiles = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
    id: i + 1,
    isEmpty: i === GRID_SIZE * GRID_SIZE - 1 // letztes Feld ist leer (hat id = 9 bei 3x3)
  }));
  return tiles;
}

// LÖSBARKEITSPRÜFUNG

// Zählt die Anzahl der Inversionen im Zustand des Puzzles.
function getInversions(state: PuzzleState): number {
  let inversions = 0;
  // Wir betrachten nur die IDs der nicht leeren Kacheln
  const numbers = state
    .filter(tile => !tile.isEmpty)
    .map(tile => tile.id);

  for (let i = 0; i < numbers.length; i++) {
    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[i] > numbers[j]) {
        inversions++;
      }
    }
  }
  return inversions;
}

// Prüft, ob ein Puzzle lösbar ist
export function isSolvable(state: PuzzleState): boolean {
  // Da GRID_SIZE = 3 (ungerade) ist, muss die Inversionsanzahl gerade sein.
  return getInversions(state) % 2 === 0;
}


// Mischen --> stellt sicher dass es lösbar isr
export function shuffle(state: PuzzleState): PuzzleState {
  let initial = [...state];

  do {
    // 1. Initialzustand erstellen
    initial = createInitialState();
    
    // 2. Fisher-Yates-Shuffle
    const arr = [...initial];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    initial = arr;

  } while (!isSolvable(initial)); // Wiederhole solange der Zustand nicht lösbar ist

  return initial;
}

// Bewegung prüfen & ausführen
export function moveTile(state: PuzzleState, tileIndex: number): PuzzleState {
  const emptyIndex = state.findIndex(tile => tile.isEmpty);

  const canMove = isAdjacent(tileIndex, emptyIndex);
  if (!canMove) return state;

  const newState = [...state];
  [newState[tileIndex], newState[emptyIndex]] = [newState[emptyIndex], newState[tileIndex]];
  return newState;
}

function isAdjacent(i: number, j: number) {
  const rowI = Math.floor(i / GRID_SIZE);
  const colI = i % GRID_SIZE;
  const rowJ = Math.floor(j / GRID_SIZE);
  const colJ = j % GRID_SIZE;
  return Math.abs(rowI - rowJ) + Math.abs(colI - colJ) === 1;
}

// Lösung prüfen
export function isSolved(state: PuzzleState): boolean {
  return state.every((tile, index) => tile.id === index + 1);
}

// Zeitformatierung
export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  
  return `${paddedMinutes}:${paddedSeconds}`;
}


export * from "./angle";
export * from "./camera";
export * from "./conversion";
export * from "./databaseApi";
export * from "./fetchGLTFModel";
export * from "./filtering";
export * from "./geo";
export * from "./geolocation";
export * from "./interpolation";
export * from "./minioClient";
export * from "./minioData";
export * from "./mockData";
export * from "./objects";
export * from "./performCameraRaycast";