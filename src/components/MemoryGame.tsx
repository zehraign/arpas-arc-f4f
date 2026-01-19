import React, { useState, useEffect, useMemo } from "react";
import { Text, RoundedBox, useTexture } from "@react-three/drei";
import MemoryCard from "./MemoryCard";
import { memoryCards, MemoryCategory } from "../data/memoryCards";

/* 🔥 PRELOAD ALL TEXTURES */
useTexture.preload(memoryCards.map(c => c.image));

/* ---------------- TYPES ---------------- */

interface CardState {
  id: number;
  isFlipped: boolean;
  isMatched: boolean;
  position: [number, number, number];
}

/* ---------------- HELPERS ---------------- */

const shuffleArray = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ---------------- CARD LAYOUT (SPHERE) ---------------- */

const CARD_RADIUS = 2.2;
const CARD_BASE_Y = 1.15;
const CARD_Y_VARIATION = 0.35;

const getSphericalCardPositions = (count: number) =>
  Array.from({ length: count }).map((_, i) => {
    const a = (i / count) * Math.PI * 2;
    return [
      Math.sin(a) * CARD_RADIUS,
      CARD_BASE_Y + Math.sin(a * 2) * CARD_Y_VARIATION,
      Math.cos(a) * CARD_RADIUS,
    ] as [number, number, number];
  });



interface MemoryGameProps {
  onClose?: () => void;
}

const CONGRATS_DURATION_MS = 9000;

export default function MemoryGame({ onClose }: MemoryGameProps) {
  const [cards, setCards] = useState<CardState[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [resetCount, setResetCount] = useState(0);

  /* ⏱ TIMER */
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);

  /* 🎉 OVERLAY */
  const [showCongrats, setShowCongrats] = useState(false);

  const [score, setScore] = useState<Record<MemoryCategory, number>>({
    grillen: 0,
    algen: 0,
    salzpflanzen: 0,
    makroquallen: 0,
  });

  /* 🔁 FAST LOOKUP MAP */
  const cardDataMap = useMemo(() => {
    const m = new Map<number, typeof memoryCards[0]>();
    memoryCards.forEach(c => m.set(c.id, c));
    return m;
  }, []);

  /* ⏱ TIMER LOOP */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  /* 🃏 SETUP CARDS */
  useEffect(() => {
    const shuffled = shuffleArray(memoryCards);
    const positions = getSphericalCardPositions(shuffled.length);

    setCards(
      shuffled.map((c, i) => ({
        id: c.id,
        isFlipped: false,
        isMatched: false,
        position: positions[i],
      }))
    );

    setSelected([]);
    setRunning(true);
    setShowCongrats(false);
  }, [resetCount]);

  /* 🃏 FLIP */
  const flipCard = (id: number) => {
    setCards(prev => {
      const clicked = prev.find(c => c.id === id);
      if (!clicked || clicked.isFlipped || clicked.isMatched) return prev;

      if (prev.filter(c => c.isFlipped && !c.isMatched).length >= 2) return prev;

      return prev.map(c =>
        c.id === id ? { ...c, isFlipped: true } : c
      );
    });

    setSelected(s => (s.length < 2 ? [...s, id] : s));
  };

  /* ✅ MATCHING */
  useEffect(() => {
    if (selected.length !== 2) return;

    const [a, b] = selected;
    const A = cardDataMap.get(a)!;
    const B = cardDataMap.get(b)!;

    if (A.pairId === B.pairId) {
      setTimeout(() => {
        setCards(p =>
          p.map(c =>
            c.id === a || c.id === b ? { ...c, isMatched: true } : c
          )
        );
        setScore(s => ({ ...s, [A.category]: s[A.category] + 1 }));
        setSelected([]);
      }, 400);
    } else {
      setTimeout(() => {
        setCards(p =>
          p.map(c =>
            c.id === a || c.id === b ? { ...c, isFlipped: false } : c
          )
        );
        setSelected([]);
      }, 700);
    }
  }, [selected, cardDataMap]);

  /* 🏁 FINISHED */
  useEffect(() => {
    if (!cards.length) return;
    if (cards.every(c => c.isMatched)) {
      setRunning(false);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), CONGRATS_DURATION_MS);
    }
  }, [cards]);

  /* 🔄 RESET */
  const newGame = () => {
    setScore({
      grillen: 0,
      algen: 0,
      salzpflanzen: 0,
      makroquallen: 0,
    });
    setTime(0);
    setResetCount(r => r + 1);
  };

  /* ---------------- RENDER ---------------- */

  return (
    <group>
      {/* ================= HUD ================= */}
      <group position={[0, 1.9, -4.2]}>
        <RoundedBox args={[2.6, 0.6, 0.06]} radius={0.06}>
          <meshStandardMaterial color="#a8c9f0" />
        </RoundedBox>

        <Text position={[-1.25, 0.2, 0.08]} fontSize={0.085} anchorX="left">
          <meshBasicMaterial color="#1c3d5a" depthTest={false} />
          Memory 🃏Finde die passenden Paare!
        </Text>

        <Text position={[0.6, 0.2, 0.08]} fontSize={0.07}>
          <meshBasicMaterial color="#1c3d5a" depthTest={false} />
          ⏱ {formatTime(time)}
        </Text>

        {Object.entries(score).map(([cat, val], i) => (
          <Text
            key={cat}
            position={[-1.25 + (i % 2) * 1.25, 0.03 - Math.floor(i / 2) * 0.1, 0.08]}
            fontSize={0.055}
            anchorX="left"
          >
            <meshBasicMaterial color="#244f73" depthTest={false} />
            {cat}: {val}
          </Text>
        ))}

        <RoundedBox
          args={[0.9, 0.18, 0.05]}
          radius={0.04}
          position={[0, -0.24, 0.08]}
          onPointerDown={newGame}
        >
          <meshStandardMaterial color="#1c3d5a" />
          <Text fontSize={0.065} anchorX="center" anchorY="middle">
            <meshBasicMaterial color="#ffffff" depthTest={false} />
            Neues Spiel
          </Text>
        </RoundedBox>

        {onClose && (
          <RoundedBox
            args={[0.14, 0.14, 0.03]}
            radius={0.035}
            position={[1.25, 0.2, 0.08]}
            onPointerDown={onClose}
          >
            <meshStandardMaterial color="#d9534f" />
            <Text fontSize={0.085} anchorX="center" anchorY="middle">
              <meshBasicMaterial color="#ffffff" depthTest={false} />
              ✕
            </Text>
          </RoundedBox>
        )}
      </group>
{/* 🎉 CONGRATS */}
      {showCongrats && (
        <group position={[0, 1.2, -2]}>
          {/* Hintergrund-Board */}
          <RoundedBox args={[1.8, 0.8, 0.05]} radius={0.06}>
            <meshStandardMaterial color="#a8c9f0" />
          </RoundedBox>

          {/* Haupt-Überschrift */}
          <Text 
            position={[0, 0.15, 0.06]} 
            fontSize={0.08} 
            color="#1c3d5a"
            maxWidth={1.6}        // Verhindert das Herausragen
            textAlign="center"    // Zentriert den Text
            anchorY="middle"
          >
            🎉 Herzlichen Glückwunsch! 🎉{"\n"}
            Sie haben das Memory geschafft!
          </Text>

          {/* Zeit-Statistik */}
          <Text 
            position={[0, -0.18, 0.06]} 
            fontSize={0.07} 
            color="#244f73"
            maxWidth={1.6}
            textAlign="center"
          >
            Zeit: {formatTime(time)}
          </Text>
        </group>
      )}

      {/* ================= CARDS ================= */}
      {cards.map(card => {
        const data = cardDataMap.get(card.id)!;
        return (
          <MemoryCard
            key={card.id}
            image={data.image}
            position={card.position}
            isFlipped={card.isFlipped}
            isMatched={card.isMatched}
            onClick={() => flipCard(card.id)}
          />
        );
      })}
    </group>
  );
}

/* cache loading
import React, { useState, useEffect, useMemo } from "react";
import { Text, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import MemoryCard from "./MemoryCard";
import { memoryCards, MemoryCategory } from "../data/memoryCards";

/* ---------------- HELPERS ---------------- /
const shuffleArray = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const CARD_RADIUS = 2.2;
const CARD_BASE_Y = 1.15;
const CARD_Y_VARIATION = 0.35;

const getSphericalCardPositions = (count: number) =>
  Array.from({ length: count }).map((_, i) => {
    const a = (i / count) * Math.PI * 2;
    return [
      Math.sin(a) * CARD_RADIUS,
      CARD_BASE_Y + Math.sin(a * 2) * CARD_Y_VARIATION,
      Math.cos(a) * CARD_RADIUS,
    ] as [number, number, number];
  });

/* ---------------- COMPONENT ---------------- /
interface MemoryGameProps {
  onClose?: () => void;
}

const CONGRATS_DURATION_MS = 6000;

export default function MemoryGame({ onClose }: MemoryGameProps) {
  // --- TEXTUR CACHE ---
  // Lädt alle Bilder sofort in den VRAM
  const loadedTextures = useTexture(memoryCards.map(c => c.image));

  // Textur-Optimierung für AR (weniger Speicherverbrauch)
  useEffect(() => {
    loadedTextures.forEach(tex => {
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
    });
  }, [loadedTextures]);

  const [cards, setCards] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [resetCount, setResetCount] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [score, setScore] = useState<Record<MemoryCategory, number>>({
    grillen: 0, algen: 0, salzpflanzen: 0, makroquallen: 0,
  });

  const cardDataMap = useMemo(() => {
    const m = new Map<number, typeof memoryCards[0]>();
    memoryCards.forEach(c => m.set(c.id, c));
    return m;
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const shuffled = shuffleArray(memoryCards);
    const positions = getSphericalCardPositions(shuffled.length);
    setCards(shuffled.map((c, i) => ({
      id: c.id,
      isFlipped: false,
      isMatched: false,
      position: positions[i],
    })));
    setSelected([]);
    setRunning(true);
    setShowCongrats(false);
  }, [resetCount]);

  const flipCard = (id: number) => {
    setCards(prev => {
      if (prev.filter(c => c.isFlipped && !c.isMatched).length >= 2) return prev;
      return prev.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    });
    setSelected(s => (s.length < 2 ? [...s, id] : s));
  };

  useEffect(() => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    const A = cardDataMap.get(a)!;
    const B = cardDataMap.get(b)!;

    if (A.pairId === B.pairId) {
      setTimeout(() => {
        setCards(p => p.map(c => c.id === a || c.id === b ? { ...c, isMatched: true } : c));
        setScore(s => ({ ...s, [A.category]: s[A.category] + 1 }));
        setSelected([]);
      }, 400);
    } else {
      setTimeout(() => {
        setCards(p => p.map(c => c.id === a || c.id === b ? { ...c, isFlipped: false } : c));
        setSelected([]);
      }, 700);
    }
  }, [selected, cardDataMap]);

  useEffect(() => {
    if (cards.length && cards.every(c => c.isMatched)) {
      setRunning(false);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), CONGRATS_DURATION_MS);
    }
  }, [cards]);

  return (
    <group>
      {/* HUD (Hier gekürzt für Übersichtlichkeit, bleibt wie in deinem Original) /}
      <group position={[0, 1.9, -4.2]}>
         {/* ... (deine Text- und RoundedBox-Elemente) ... /}
         <RoundedBox args={[2.6, 0.6, 0.06]} radius={0.06} onPointerDown={() => setResetCount(r => r+1)}>
            <meshStandardMaterial color="#a8c9f0" />
            <Text position={[0, 0, 0.08]} fontSize={0.1} color="#1c3d5a">Reset / Neues Spiel</Text>
         </RoundedBox>
      </group>

      {/* CARDS /}
      {cards.map((card) => {
        // Die richtige Textur aus dem Array anhand der ID finden
        const textureIndex = memoryCards.findIndex(m => m.id === card.id);
        const texture = loadedTextures[textureIndex];

        return (
          <MemoryCard
            key={card.id}
            texture={texture}
            position={card.position}
            isFlipped={card.isFlipped}
            isMatched={card.isMatched}
            onClick={() => flipCard(card.id)}
          />
        );
      })}
    </group>
  );
}*/