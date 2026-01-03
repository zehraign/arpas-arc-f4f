import { useState, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { TextureLoader, RepeatWrapping } from "three";
import { useLoader, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

import {
  createInitialState,
  moveTile,
  shuffle,
  isSolved,
} from "../utility";
import { GRID_SIZE, PuzzleState } from "../types";

/* === TUNING === */
const TILE_SIZE = 0.3;
const TILE_GAP = 0.015;
const TILE_DEPTH = 0.06;
const STEP = TILE_SIZE + TILE_GAP;
const PUZZLE_FIELD_SIZE =
  GRID_SIZE * TILE_SIZE + (GRID_SIZE - 1) * TILE_GAP;

/* === POSITION === */
const get3DPosition = (index: number): [number, number, number] => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;

  const x = (col - (GRID_SIZE - 1) / 2) * STEP;
  const y = ((GRID_SIZE - 1) / 2 - row) * STEP;

  return [x, y, TILE_DEPTH / 2]; // leicht über Hintergrund
};

/* === TILE === */
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
  const meshRef = useRef<THREE.Group>(null!);

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
    meshRef.current.position.set(...targetPosition);
  }, [targetPosition]);

  useFrame((_, delta) => {
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      targetPosition[0],
      delta * 10
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetPosition[1],
      delta * 10
    );
  });

  return (
    <group ref={meshRef} onPointerDown={onClick}>
      {/* 3D-Box für Tiefe */}
      <RoundedBox args={[TILE_SIZE, TILE_SIZE, TILE_DEPTH]} radius={0.03} smoothness={4}>
        <meshStandardMaterial attach="material-0" color="#214730" />
        <meshStandardMaterial attach="material-1" color="#214730" />
        <meshStandardMaterial attach="material-2" color="#214730" />
        <meshStandardMaterial attach="material-3" color="#214730" />
        <meshStandardMaterial attach="material-4" color="#214730" />
        <meshStandardMaterial attach="material-5" color="#214730" />
      </RoundedBox>

      {/* Plane oben für Textur */}
      <mesh position={[0, 0, TILE_DEPTH / 2 + 0.001]}>
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
};

/* === PUZZLE === */
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
      {/* Hintergrund */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[PUZZLE_FIELD_SIZE + 0.1, PUZZLE_FIELD_SIZE + 0.1]} />
        <meshStandardMaterial color="#2e553d" />
      </mesh>

      {/* Tiles */}
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
}



/*  export default function Puzzle3D({
  imageUrl,
  position = [0, 1.4, -0.6], // 👈 AR-sichere Position
  onSolved,
}: Puzzle3DProps) {

  // Textur laden
  const texture = useLoader(TextureLoader, imageUrl);

  // Textur korrekt für Tiles vorbereiten
  useEffect(() => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / GRID_SIZE, 1 / GRID_SIZE);
    texture.needsUpdate = true;
  }, [texture]);

  // Puzzle State
  const [puzzleState, setPuzzleState] = useState<PuzzleState>(
    createInitialState()
  );

  useEffect(() => {
    setPuzzleState(shuffle(createInitialState()));
  }, []);

  const clickTile = (tileIndex: number) => {
    const newState = moveTile(puzzleState, tileIndex);
    setPuzzleState([...newState]);

    if (isSolved(newState) && onSolved) {
      onSolved();
    }
  };

  return (
    <group position={position}>
      {puzzleState.map((tile, index) => {
        if (tile.isEmpty) return null;

        const row = Math.floor(index / GRID_SIZE);
        const col = index % GRID_SIZE;

        return (
          <mesh
            key={tile.id}
            position={[
              (col - 1) * 0.45,
              (1 - row) * 0.45,
              0,
            ]}
            onPointerDown={() => clickTile(index)} // 👈 wichtig für AR
          >
            <planeGeometry args={[0.4, 0.4]} />
            <meshBasicMaterial
              map={texture}
              transparent
              map-offset={[
                (tile.id - 1) % GRID_SIZE / GRID_SIZE,
                1 -
                  Math.floor((tile.id - 1) / GRID_SIZE) / GRID_SIZE -
                  1 / GRID_SIZE,
              ]}
            />
          </mesh>
        );
      })}
    </group>
  );
}*/

/*Pinke boxen export default function Puzzle3D({ position = [0, 0, -1] }: any) {
  return (
    <group position={position}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            ((i % 3) - 1) * 0.35,
            (1 - Math.floor(i / 3)) * 0.35,
            0,
          ]}
        >
          <boxGeometry args={[0.3, 0.3, 0.05]} />
          <meshBasicMaterial color="hotpink" />
        </mesh>
      ))}
    </group>
  );
}
*/