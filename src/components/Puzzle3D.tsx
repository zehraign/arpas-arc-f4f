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

/* === TUNING === */
const TILE_SIZE = 0.50;
const TILE_THICKNESS = 0.1;
const TILE_GAP = 0.03;
const STEP = TILE_SIZE + TILE_GAP;

/* === HILFSFUNKTIONEN === */
const get3DPosition = (index: number): [number, number, number] => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const x = (col - (GRID_SIZE - 1) / 2) * STEP;
  const y = ((GRID_SIZE - 1) / 2 - row) * STEP;
  return [x, y, TILE_THICKNESS / 2];
};

/* === INTERFACES === */
interface AnimatedTileProps {
  currentIndex: number;
  tileId: number;
  baseTexture: THREE.Texture;
  onClick: () => void;
}

// ✅ Dieses Interface muss hier stehen, damit der Fehler unten verschwindet
interface Puzzle3DProps {
  imageUrl: string;
  position?: [number, number, number];
  onSolved?: () => void;
  resetCount: number;
}

/* === TILE KOMPONENTE === */
const AnimatedTile = ({
  currentIndex,
  tileId,
  baseTexture,
  onClick,
}: AnimatedTileProps) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const targetPosition = useMemo(() => get3DPosition(currentIndex), [currentIndex]);

  const texture = useMemo(() => {
    const row = Math.floor((tileId - 1) / GRID_SIZE);
    const col = (tileId - 1) % GRID_SIZE;
    const t = baseTexture.clone();
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(1 / GRID_SIZE, 1 / GRID_SIZE);
    t.offset.set(col / GRID_SIZE, 1 - (row + 1) / GRID_SIZE);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [baseTexture, tileId]);

  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: "#0f3d2e" }),
    new THREE.MeshStandardMaterial({ color: "#0f3d2e" }),
    new THREE.MeshStandardMaterial({ color: "#145a43" }),
    new THREE.MeshStandardMaterial({ color: "#0a2b21" }),
    new THREE.MeshPhongMaterial({ map: texture, shininess: 35, specular: new THREE.Color("#ffffff") }),
    new THREE.MeshStandardMaterial({ color: "#0b3326" }),
  ], [texture]);

  useFrame((_, delta) => {
    const [tx, ty, tz] = targetPosition;
    // Glattes, lineares Gleiten ohne Federn
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
      {materials.map((m, i) => (
        <primitive key={i} attach={`material-${i}`} object={m} />
      ))}
    </mesh>
  );
};

/* === HAUPT KOMPONENTE === */
export default function Puzzle3D({
  imageUrl,
  position = [0, 0, -1.5],
  onSolved,
  resetCount,
}: Puzzle3DProps) { // ✅ Fehler behoben: Interface ist nun oben definiert
  const baseTexture = useLoader(TextureLoader, imageUrl) as THREE.Texture;
  const [puzzleState, setPuzzleState] = useState<PuzzleState>(createInitialState());
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setPuzzleState(shuffle(createInitialState()));
    setSolved(false);
  }, [resetCount]);

  const handleTileClick = (index: number) => {
    if (solved) return;
    const newState = moveTile(puzzleState, index);
    setPuzzleState(newState);
    if (isSolved(newState)) {
      setSolved(true);
      onSolved?.();
    }
  };

  return (
    <group position={position}>
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





/* working import { useState, useEffect, useMemo, useRef } from "react";
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

/* === TUNING === /
const TILE_SIZE = 0.3;
const TILE_GAP = 0.005;
const STEP = TILE_SIZE + TILE_GAP;
const PUZZLE_FIELD_SIZE =
  GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * TILE_GAP;

/* === HILFSFUNKTION === /
const get3DPosition = (index: number): [number, number, number] => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const x = (col - (GRID_SIZE - 1) / 2) * STEP;
  const y = ((GRID_SIZE - 1) / 2 - row) * STEP;
  return [x, y, 0.01];
};

/* === TILE === /
interface AnimatedTileProps {
  currentIndex: number;
  tileId: number;
  baseTexture: THREE.Texture;
  onClick: () => void;
}

const AnimatedTile = ({
  currentIndex,
  tileId,
  baseTexture,
  onClick,
}: AnimatedTileProps) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  const targetPosition = useMemo(
    () => get3DPosition(currentIndex),
    [currentIndex]
  );

  const texture = useMemo(() => {
    const row = Math.floor((tileId - 1) / GRID_SIZE);
    const col = (tileId - 1) % GRID_SIZE;

    const t = baseTexture.clone();
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(1 / GRID_SIZE, 1 / GRID_SIZE);
    t.offset.set(col / GRID_SIZE, 1 - (row + 1) / GRID_SIZE);
    t.needsUpdate = true;
    return t;
  }, [baseTexture, tileId]);

  useEffect(() => {
    const [x, y, z] = targetPosition;
    meshRef.current.position.set(x, y, z);
  }, [targetPosition]);

  useFrame((_, delta) => {
    const [tx, ty] = targetPosition;
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      tx,
      delta * 10
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      ty,
      delta * 10
    );
  });

  return (
    <mesh ref={meshRef} onPointerDown={onClick}>
  <boxGeometry args={[TILE_SIZE, TILE_SIZE, 0.04]} />
  <meshStandardMaterial map={texture} />
</mesh>

  );
};

/* === PUZZLE === /
interface Puzzle3DProps {
  imageUrl: string;
  position?: [number, number, number];
  onSolved?: () => void;
  resetCount: number;
}

export default function Puzzle3D({
  imageUrl,
  position = [0, 0, -1.5],
  onSolved,
  resetCount,
}: Puzzle3DProps) {
  const baseTexture = useLoader(TextureLoader, imageUrl);

  const [puzzleState, setPuzzleState] = useState<PuzzleState>(
    createInitialState()
  );
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    setPuzzleState(shuffle(createInitialState()));
    setSolved(false);
  }, [resetCount]);

  const clickTile = (index: number) => {
    if (solved) return;

    const newState = moveTile(puzzleState, index);
    setPuzzleState(newState);

    if (isSolved(newState)) {
      setSolved(true);
      onSolved?.();
    }
  };

  return (
    <group position={position}>
      {/* Hintergrund /}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry
          args={[PUZZLE_FIELD_SIZE + 0.01, PUZZLE_FIELD_SIZE + 0.01]}
        />
        <meshBasicMaterial color="#2e553d" />
      </mesh>

      {/* Tiles /}
      {puzzleState.map((tile, index) =>
        tile.isEmpty ? null : (
          <AnimatedTile
            key={tile.id}
            tileId={tile.id}
            currentIndex={index}
            baseTexture={baseTexture}
            onClick={() => clickTile(index)}
          />
        )
      )}
    </group>
  );
}*/