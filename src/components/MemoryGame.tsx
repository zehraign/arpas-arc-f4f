import React, { useState, useEffect, useMemo, useRef } from "react";
import { Text, RoundedBox, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import MemoryCard from "./MemoryCard";
import { memoryCards, MemoryCategory } from "../data/memoryCards";

// Alle Bilder werden vorgeladen 
useTexture.preload(memoryCards.map(c => c.image));

//TYPES 
interface CardState {
  id: number;
  isFlipped: boolean;
  isMatched: boolean;
  position: [number, number, number];
}

//HELPERS
const shuffleArray = <T,>(arr: T[]) => {
  const a = [...arr]; // Mischt ein Array zufällig
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const formatTime = (s: number) => // Wandelt Sekunden in MM:SS um
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const CARD_RADIUS = 2.2;
const CARD_BASE_Y = 1.15;
const CARD_Y_VARIATION = 0.35;

const getSphericalCardPositions = (count: number) =>  // Verteilt Karten kreisförmig im Raum (also in einer Sphäre)
  Array.from({ length: count }).map((_, i) => {
    const a = (i / count) * Math.PI * 2;
    return [
      Math.sin(a) * CARD_RADIUS,
      CARD_BASE_Y + Math.sin(a * 2) * CARD_Y_VARIATION,
      Math.cos(a) * CARD_RADIUS,
    ] as [number, number, number];
  });

// COMPONENT
interface MemoryGameProps {
  onClose?: (completed: boolean) => void; 
}// completed sagt, ob das Spiel geschafft wurde

const CONGRATS_DURATION_MS = 7000; // Glückwunsch Overlay wird 7 sekunden angezeigt

export default function MemoryGame({ onClose }: MemoryGameProps) {
  const [cards, setCards] = useState<CardState[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [resetCount, setResetCount] = useState(0);
  const [hasWon, setHasWon] = useState(false); 

  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);

  const [score, setScore] = useState<Record<MemoryCategory, number>>({
    grillen: 0,
    algen: 0,
    salzpflanzen: 0,
    makroquallen: 0,
  });// Zählt Treffer pro Kategorie


  const congratsRef = useRef<THREE.Group>(null); // Referenz auf das Glückwunsch-Overlay
  const { camera } = useThree();  // Kamera holen, damit das Overlay dem Blick folgen kann

  const cardDataMap = useMemo(() => { // Map für schnellen Zugriff auf Kartendaten per ID
    const m = new Map<number, typeof memoryCards[0]>();
    memoryCards.forEach(c => m.set(c.id, c));
    return m;
  }, []);

  useEffect(() => {// Timer läuft solange das Spiel aktiv ist
    if (!running) return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {  // Spiel neu aufbauen bei Reset
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

  
  useFrame(() => {// Glückwunsch Overlay wird in jedem Frame vor die Kamera gesetzt
    if (showCongrats && congratsRef.current) {
      const offset = new THREE.Vector3(0, 0, -2.5); 
      offset.applyQuaternion(camera.quaternion);
      congratsRef.current.position.copy(camera.position).add(offset);
      congratsRef.current.lookAt(camera.position);
    }
  });

  const flipCard = (id: number) => {
    setCards(prev => {
      const clicked = prev.find(c => c.id === id);
      if (!clicked || clicked.isFlipped || clicked.isMatched) return prev;// Nicht nochmal anklicken wenn schon offen oder schon gefunden
      if (prev.filter(c => c.isFlipped && !c.isMatched).length >= 2) return prev; // Maximal 2 Karten gleichzeitig offen
      return prev.map(c => (c.id === id ? { ...c, isFlipped: true } : c));   // Geklickte Karte umdrehen
    });
    setSelected(s => (s.length < 2 ? [...s, id] : s));
  };

  useEffect(() => {  // Prüft immer dann, wenn 2 Karten ausgewählt wurden
    if (selected.length !== 2) return;
    const [a, b] = selected;
    const A = cardDataMap.get(a)!;
    const B = cardDataMap.get(b)!;

    if (A.pairId === B.pairId) {  // Bei Treffer --> beide Karten nach kurzer Verzögerung als gematcht markieren
      setTimeout(() => {
        setCards(p => p.map(c => (c.id === a || c.id === b ? { ...c, isMatched: true } : c)));
        setScore(s => ({ ...s, [A.category]: s[A.category] + 1 }));
        setSelected([]);
      }, 400);
    } else { //kein treffer --> werden wieder umgedreht
      setTimeout(() => {
        setCards(p => p.map(c => (c.id === a || c.id === b ? { ...c, isFlipped: false } : c)));
        setSelected([]);
      }, 700);
    }
  }, [selected, cardDataMap]);

  useEffect(() => { // beim finden aller Paare wird das spiel beendet
    if (!cards.length) return;
    if (cards.every(c => c.isMatched)) {
      setRunning(false); // Timer stoppen
      setShowCongrats(true);  // Glückwunsch anzeigen
      setHasWon(true);  // Gewinn merken
      setTimeout(() => setShowCongrats(false), CONGRATS_DURATION_MS);
    }
  }, [cards]);

  const newGame = () => {  // Setzt Score und Zeit zurück und startet neu
    setScore({ grillen: 0, algen: 0, salzpflanzen: 0, makroquallen: 0 });
    setTime(0);
    setResetCount(r => r + 1);
  };

  return (
    <group>
      {/* HUD(head up display) */}
      {/* Feste Anzeige im Raum --> Titel, Zeit, Score, Buttons */}
      <group position={[0, 1.9, -4.2]}>
        <RoundedBox args={[2.6, 0.6, 0.06]} radius={0.06}>
          <meshStandardMaterial color="#bbd4f4" />
        </RoundedBox>

        <Text position={[-1.25, 0.2, 0.08]} fontSize={0.085} anchorX="left">
          <meshBasicMaterial color="#285883" />
          Memory 🃏 Finde die passenden Paare!
        </Text>

        <Text position={[0.6, 0.2, 0.08]} fontSize={0.07}>
          <meshBasicMaterial color="#285883" />
          ⏱ {formatTime(time)}
        </Text>

        {Object.entries(score).map(([cat, val], i) => (
          <Text
            key={cat}
            position={[-1.25 + (i % 2) * 1.25, 0.03 - Math.floor(i / 2) * 0.1, 0.08]}
            fontSize={0.055}
            anchorX="left"
          >
            <meshBasicMaterial color="#244f73" />
            {cat}: {val}
          </Text>
        ))}

         {/* Neustart-Button */}
        <RoundedBox args={[0.9, 0.18, 0.05]} radius={0.04} position={[0, -0.24, 0.08]} onPointerDown={newGame}>
          <meshStandardMaterial color="#285883" />
          <Text fontSize={0.065} anchorX="center" anchorY="middle" position={[0, 0, 0.03]}>
            <meshBasicMaterial color="#ffffff" />
            Neues Spiel
          </Text>
        </RoundedBox>

        {/* Schließen-Button */}
        {onClose && (
          <RoundedBox
            args={[0.14, 0.14, 0.03]}
            radius={0.035}
            position={[1.25, 0.2, 0.08]}
            onPointerDown={() => onClose(hasWon)} 
          >
            <meshStandardMaterial color="#d9534f" />
            <Text fontSize={0.085} anchorX="center" anchorY="middle">
              <meshBasicMaterial color="#ffffff" depthTest={false} />
              ✕
            </Text>
          </RoundedBox>
        )}
      </group>

      {/* Glückwunsch overlay  */}
      {showCongrats && (
        <group ref={congratsRef}>
          <pointLight position={[0, 2, 2]} intensity={0.5} />
          <RoundedBox args={[1.8, 0.8, 0.05]} radius={0.06}>
            <meshStandardMaterial color="#ffffff" />
          </RoundedBox>
          <Text position={[0, 0.15, 0.06]} fontSize={0.08} color="#285883" maxWidth={1.6} textAlign="center">
            🎉 Herzlichen Glückwunsch! 🎉{"\n"}
            Memory erfolgreich abgeschlossen!
          </Text>
          <Text position={[0, -0.18, 0.06]} fontSize={0.07} color="#244f73">
            Zeit: {formatTime(time)}
          </Text>
        </group>
      )}

      {/* CARDS --> Karten im Raum rendern */}
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