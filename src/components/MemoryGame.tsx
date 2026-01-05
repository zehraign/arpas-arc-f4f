import { useState } from "react";
import { Text } from "@react-three/drei";
import MemoryCard from "./MemoryCard";
import { memoryCards, MemoryCategory } from "../data/memoryCards";

interface CardState {
  id: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGame() {
  const [cards, setCards] = useState<CardState[]>(
    memoryCards.map(c => ({
      id: c.id,
      isFlipped: false,
      isMatched: false,
    }))
  );

  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState<Record<MemoryCategory, number>>({
    Grillen: 0,
    Algen: 0,
    Salzpflanzen: 0,
    Quallen: 0,
  });

  const flipCard = (id: number) => {
    if (selected.length === 2) return;

    setCards(prev =>
      prev.map(c =>
        c.id === id ? { ...c, isFlipped: true } : c
      )
    );

    setSelected(prev => [...prev, id]);
  };

  if (selected.length === 2) {
    const [a, b] = selected;
    const cardA = memoryCards.find(c => c.id === a)!;
    const cardB = memoryCards.find(c => c.id === b)!;

    if (
      cardA.pairId === cardB.pairId &&
      cardA.category === cardB.category
    ) {
      setTimeout(() => {
        setCards(prev =>
          prev.map(c =>
            c.id === a || c.id === b
              ? { ...c, isMatched: true }
              : c
          )
        );

        setScore(prev => ({
          ...prev,
          [cardA.category]: prev[cardA.category] + 1,
        }));

        setSelected([]);
      }, 600);
    } else {
      setTimeout(() => {
        setCards(prev =>
          prev.map(c =>
            c.id === a || c.id === b
              ? { ...c, isFlipped: false }
              : c
          )
        );
        setSelected([]);
      }, 900);
    }
  }

  return (
    <group>
      <Text position={[0, 1, 0]} fontSize={0.09} color="#1f3f2e">
        Memory Spiel 🧠
      </Text>

      {memoryCards.map(card => {
        const state = cards.find(c => c.id === card.id)!;
        return (
          <MemoryCard
            key={card.id}
            category={card.category}
            position={card.position}
            isFlipped={state.isFlipped}
            isMatched={state.isMatched}
            onClick={() =>
              !state.isFlipped &&
              !state.isMatched &&
              flipCard(card.id)
            }
          />
        );
      })}

      {/* SCORE */}
      <group position={[0, -1.1, 0]}>
        {Object.entries(score).map(([cat, val], i) => (
          <Text
            key={cat}
            position={[0, -i * 0.12, 0]}
            fontSize={0.05}
            color="#1f3f2e"
          >
            {cat}: {val}
          </Text>
        ))}
      </group>
    </group>
  );
}

