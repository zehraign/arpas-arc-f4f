export type MemoryCategory =
  | "Grillen"
  | "Algen"
  | "Salzpflanzen"
  | "Quallen";

export interface MemoryCardData {
  id: number;
  category: MemoryCategory;
  pairId: number;
  position: [number, number, number];
}

export const memoryCards: MemoryCardData[] = [
  // 🦗 Grillen
  { id: 1, category: "Grillen", pairId: 1, position: [-0.8, 0.3, -1.2] },
  { id: 2, category: "Grillen", pairId: 1, position: [-0.2, 0.5, -1.5] },

  // 🌱 Algen
  { id: 3, category: "Algen", pairId: 2, position: [0.6, 0.4, -1.3] },
  { id: 4, category: "Algen", pairId: 2, position: [0.2, 0.1, -1.7] },

  // 🧂 Salzpflanzen
  { id: 5, category: "Salzpflanzen", pairId: 3, position: [-0.5, -0.3, -1.6] },
  { id: 6, category: "Salzpflanzen", pairId: 3, position: [0.1, -0.4, -1.2] },

  // 🪼 Quallen
  { id: 7, category: "Quallen", pairId: 4, position: [0.7, -0.2, -1.4] },
  { id: 8, category: "Quallen", pairId: 4, position: [0.3, -0.6, -1.8] },
];

