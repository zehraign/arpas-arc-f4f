import { useState, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { TextureLoader, RepeatWrapping } from "three";
import { useLoader, useFrame } from "@react-three/fiber";

import {
  createInitialState,
  moveTile,
  shuffle,
  isSolved,
} from "../utility";
import { GRID_SIZE, PuzzleState } from "../types";

//TUNING
const TILE_SIZE = 0.50; // Größe eines Puzzle-Teils
const TILE_THICKNESS = 0.1; // Dicke des 3D-Steins
const TILE_GAP = 0.03; // Abstand zwischen den Teilen
const STEP = TILE_SIZE + TILE_GAP; // Schrittweite zwischen zwei Feldern

//HILFSFUNKTIONEN 
const get3DPosition = (index: number): [number, number, number] => { 
  // Rechnet den Index im Grid in eine 3D-Position um
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const x = (col - (GRID_SIZE - 1) / 2) * STEP;
  const y = ((GRID_SIZE - 1) / 2 - row) * STEP;
  return [x, y, TILE_THICKNESS / 2];// z etwas vorne, damit die Kachel sichtbar sind
};

//INTERFACES 
interface AnimatedTileProps {
 currentIndex: number; // Aktuelle Position im Puzzle
  tileId: number; // ID des Kachels
  baseTexture: THREE.Texture;// Das Originalbild
  onClick: () => void; 
}


interface Puzzle3DProps {
  imageUrl: string; // Bild für das Puzzle
  position?: [number, number, number]; // Position des ganzen Puzzles
  onSolved?: () => void; // Callback bei Erfolg
  resetCount: number; // Erzwingt Neustart
}

// TILE KOMPONENTE
const AnimatedTile = ({
  currentIndex,
  tileId,
  baseTexture,
  onClick,
}: AnimatedTileProps) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  // Zielposition des KAchels aus dem aktuellen Index berechnen
  const targetPosition = useMemo(() => get3DPosition(currentIndex), [currentIndex]);

  const texture = useMemo(() => {
     // Schneidet aus dem Gesamtbild den richtigen Bildausschnitt aus
    const row = Math.floor((tileId - 1) / GRID_SIZE);
    const col = (tileId - 1) % GRID_SIZE;
    const t = baseTexture.clone();
    t.wrapS = t.wrapT = RepeatWrapping;
    // Nur ein Teil des Bildes pro Kachel 
    t.repeat.set(1 / GRID_SIZE, 1 / GRID_SIZE);
    t.offset.set(col / GRID_SIZE, 1 - (row + 1) / GRID_SIZE);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [baseTexture, tileId]);

  const materials = useMemo(() => [
    // Materialien für die 6 Seiten des Würfels
    new THREE.MeshStandardMaterial({ color: "#0f3d2e" }),
    new THREE.MeshStandardMaterial({ color: "#0f3d2e" }),
    new THREE.MeshStandardMaterial({ color: "#145a43" }),
    new THREE.MeshStandardMaterial({ color: "#0a2b21" }),
    // Vorderseite mit Bildausschnitt
    new THREE.MeshPhongMaterial({ map: texture, shininess: 35, specular: new THREE.Color("#ffffff") }),
    new THREE.MeshStandardMaterial({ color: "#0b3326" }),
  ], [texture]);

  useFrame((_, delta) => {
    const [tx, ty, tz] = targetPosition;
    // weiche animation
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, tx, delta * 15);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, ty, delta * 15);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, tz, delta * 15);
  });

  return (
    <mesh 
      ref={meshRef} 
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <boxGeometry args={[TILE_SIZE, TILE_SIZE, TILE_THICKNESS]} />
      {/* Weist jeder Seite ihr Material zu */}
      {materials.map((m, i) => (
        <primitive key={i} attach={`material-${i}`} object={m} />
      ))}
    </mesh>
  );
};

//HAUPT KOMPONENTE 
export default function Puzzle3D({
  imageUrl,
  position = [0, 0, -1.5],
  onSolved,
  resetCount,
}: Puzzle3DProps) { 
  // Bild laden, das später in Puzzle-Teile zerlegt wird
  const baseTexture = useLoader(TextureLoader, imageUrl) as THREE.Texture; 
  const [puzzleState, setPuzzleState] = useState<PuzzleState>(createInitialState()); // Aktueller Zustand des Puzzles
  const [solved, setSolved] = useState(false); // Merkt, ob das Puzzle schon gelöst wurde

  useEffect(() => { // bei reset wird das Puzzle neu gemischt
    setPuzzleState(shuffle(createInitialState()));
    setSolved(false);
  }, [resetCount]);

  const handleTileClick = (index: number) => {
    if (solved) return;  // Keine Züge mehr wenn schon gelöst
    const newState = moveTile(puzzleState, index);
    setPuzzleState(newState);
    if (isSolved(newState)) { // Prüfen, ob das Puzzle jetzt gelöst ist
      setSolved(true);
      onSolved?.();
    }
  };

  return (
    <group position={position}>
      {/* Rendert alle Puzzle-Teile außer dem leeren Feld */}
      {puzzleState.map((tile, index) =>
        tile.isEmpty ? null : (
          <AnimatedTile
            key={tile.id}
            tileId={tile.id}
            currentIndex={index}
            baseTexture={baseTexture}
            onClick={() => handleTileClick(index)}
          />
        )
      )}
    </group>
  );
}


