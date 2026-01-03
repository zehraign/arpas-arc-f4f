import { useState, useRef, useEffect } from "react";
import { GroupProps, useFrame } from "@react-three/fiber";
import { Group } from "three";
import { Text, RoundedBox } from "@react-three/drei";
import Puzzle3D from "./Puzzle3D";
import { formatTime } from "../utility";

interface PuzzleWithBackProps extends GroupProps {
  onBack: () => void;
}

const PUZZLE_CONTAINER_POSITION: [number, number, number] = [0, 0, 0];
const CONGRATS_DURATION_MS = 8000;

export default function PuzzleWithBack({
  onBack,
  position = [0, 1, -1.7],
  ...props
}: PuzzleWithBackProps) {
  const backRef = useRef<Group>(null);
  const timeRef = useRef(0);

  const [showCongrats, setShowCongrats] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPuzzleRunning, setIsPuzzleRunning] = useState(true);
  const [resetCount, setResetCount] = useState(0);

  /* TIMER */
  useEffect(() => {
    if (!isPuzzleRunning) return;
    const id = setInterval(() => setCurrentTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isPuzzleRunning]);

  /* BACK BUTTON FLOAT */
  useFrame(() => {
    if (!backRef.current) return;
    timeRef.current += 0.02;
    backRef.current.position.y = 1.4 + Math.sin(timeRef.current) * 0.05;
  });

  const handleSolved = () => {
    setIsPuzzleRunning(false);
    setShowCongrats(true);
    setTimeout(() => setShowCongrats(false), CONGRATS_DURATION_MS);
  };

  const handleNewGame = () => {
    setResetCount(c => c + 1);
    setCurrentTime(0);
    setIsPuzzleRunning(true);
    setShowCongrats(false);
  };

  return (
    <group position={position} {...props}>
      {/* BACK */}
      <group ref={backRef} position={[-0.8, 1.4, 0]}>
        <RoundedBox args={[0.5, 0.2, 0.05]} onPointerDown={onBack}>
          <meshStandardMaterial color="#d9534f" />
        </RoundedBox>
        <Text position={[0, 0, 0.06]} fontSize={0.07} color="white">
          Zurück
        </Text>
      </group>

      {/* PUZZLE */}
      <group position={PUZZLE_CONTAINER_POSITION}>
        <Puzzle3D
          imageUrl="/static/images/puzzle/mein-puzzle-bild.png"
          onSolved={handleSolved}
          resetCount={resetCount}
        />

        <Text position={[0, -0.6, 0.05]} fontSize={0.07}>
          ⏱ {formatTime(currentTime)}
        </Text>

        <group position={[0, -0.9, 0.05]}>
          <RoundedBox args={[0.8, 0.2, 0.05]} onPointerDown={handleNewGame}>
            <meshStandardMaterial color="#214730" />
          </RoundedBox>
          <Text position={[0, 0, 0.06]} fontSize={0.07} color="white">
            Neues Spiel
          </Text>
        </group>

        {showCongrats && (
          <Text position={[0, 0.8, 0.1]} fontSize={0.1}>
            🎉 Geschafft!
          </Text>
        )}
      </group>
    </group>
  );
}
