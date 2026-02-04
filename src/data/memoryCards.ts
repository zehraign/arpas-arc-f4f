// data/memoryCards.ts
export type MemoryCategory =
  | "grillen"
  | "algen"
  | "salzpflanzen"
  | "makroquallen";

export interface MemoryCardData {
  id: number;
  pairId: number;
  image: string;
  category: MemoryCategory;
}

const withBase = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const memoryCards: MemoryCardData[] = [
  // =======================
  // GRILLEN (2 Paare)
  // =======================
  {
    id: 1,
    pairId: 1,
    category: "grillen",
    image: withBase("images/memory/grillen.jpg"),
  },
  {
    id: 2,
    pairId: 1,
    category: "grillen",
    image: withBase("images/memory/grillen.jpg"),
  },
  {
    id: 3,
    pairId: 2,
    category: "grillen",
    image: withBase("images/memory/grillen2.jpg"),
  },
  {
    id: 4,
    pairId: 2,
    category: "grillen",
    image: withBase("images/memory/grillen2.jpg"),
  },

  // =======================
  // ALGEN (2 Paare)
  // =======================
  {
    id: 5,
    pairId: 3,
    category: "algen",
    image: withBase("images/memory/algen.jpg"),
  },
  {
    id: 6,
    pairId: 3,
    category: "algen",
    image: withBase("images/memory/algen.jpg"),
  },
  {
    id: 7,
    pairId: 4,
    category: "algen",
    image: withBase("images/memory/algen2.jpg"),
  },
  {
    id: 8,
    pairId: 4,
    category: "algen",
    image: withBase("images/memory/algen2.jpg"),
  },

  // =======================
  // SALZPFLANZEN (2 Paare)
  // =======================
  {
    id: 9,
    pairId: 5,
    category: "salzpflanzen",
    image: withBase("images/memory/salzpflanzen.jpg"),
  },
  {
    id: 10,
    pairId: 5,
    category: "salzpflanzen",
    image: withBase("images/memory/salzpflanzen.jpg"),
  },
  {
    id: 11,
    pairId: 6,
    category: "salzpflanzen",
    image: withBase("images/memory/salzpflanzen2.jpg"),
  },
  {
    id: 12,
    pairId: 6,
    category: "salzpflanzen",
    image: withBase("images/memory/salzpflanzen2.jpg"),
  },

  // =======================
  // MAKROQUALLEN (2 Paare)
  // =======================
  {
    id: 13,
    pairId: 7,
    category: "makroquallen",
    image: withBase("images/memory/quallen.jpg"),
  },
  {
    id: 14,
    pairId: 7,
    category: "makroquallen",
    image: withBase("images/memory/quallen.jpg"),
  },
  {
    id: 15,
    pairId: 8,
    category: "makroquallen",
    image: withBase("images/memory/quallen2.jpg"),
  },
  {
    id: 16,
    pairId: 8,
    category: "makroquallen",
    image: withBase("images/memory/quallen2.jpg"),
  },
];
