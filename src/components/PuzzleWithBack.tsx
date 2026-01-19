
import { useState, useEffect } from "react";
import { GroupProps } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import Puzzle3D from "./Puzzle3D";
import { formatTime } from "../utility";

interface PuzzleWithBackProps extends GroupProps {
  onBack: () => void;
  imageUrl: string; // 👈 NEU
}

const PUZZLE_CONTAINER_POSITION: [number, number, number] = [0, 0, -0.35];
const CONGRATS_DURATION_MS = 7000;

export default function PuzzleWithBack({
  onBack,
  imageUrl,
  position = [0, 1, -1.7],
  ...props
}: PuzzleWithBackProps) {
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
      <group position={PUZZLE_CONTAINER_POSITION}>
        {/* INFO + TIMER */}
        <group position={[0, 0.95, 0]}>
          <RoundedBox args={[1.25, 0.42, 0.03]} radius={0.04}>
            <meshStandardMaterial color="#ffffff" />
          </RoundedBox>

          {/* X BUTTON */}
          <group position={[0.55, 0.16, 0.04]}>
            <RoundedBox
              args={[0.12, 0.12, 0.04]}
              radius={0.02}
              onPointerDown={onBack}
            >
              <meshStandardMaterial color="#c42424" />
            </RoundedBox>

            <Text position={[0, 0, 0.045]} fontSize={0.08} color="#ffffff">
              X
            </Text>
          </group>

          <Text position={[0, 0.12, 0.04]} fontSize={0.075} color="#1f3f2e">
            Puzzle
          </Text>

          <Text
            position={[0, 0, 0.04]}
            fontSize={0.045}
            color="#1f3f2e"
            maxWidth={1.15}
            textAlign="center"
          >
            Schiebe die Kacheln, um das Bild wiederherzustellen!
          </Text>

          <Text
            position={[0, -0.13, 0.04]}
            fontSize={0.065}
            color="#c42424"
          >
            ⏱ {formatTime(currentTime)}
          </Text>
        </group>

        {/* PUZZLE */}
        <Puzzle3D
          imageUrl={imageUrl}
          onSolved={handleSolved}
          resetCount={resetCount}
        />

        {/* NEW GAME */}
        <group position={[0, -0.9, 0.08]}>
          <RoundedBox args={[0.8, 0.2, 0.05]} onPointerDown={handleNewGame}>
            <meshStandardMaterial color="#214730" />
          </RoundedBox>

          <Text
            position={[0, 0, 0.06]}
            fontSize={0.07}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Neues Spiel
          </Text>
        </group>

        {/* 🎉 GESCHAFFT OVERLAY */}
        {showCongrats && (
          <group position={[0, 0.1, 0.6]}>
            <RoundedBox args={[1.3, 0.6, 0.04]} radius={0.05}>
              <meshStandardMaterial color="#ffffff" />
            </RoundedBox>

            <Text position={[0, 0.18, 0.05]} fontSize={0.09} color="#1f3f2e">
              🎉 Herzlichen Glückwunsch!
            </Text>

            <Text position={[0, 0.03, 0.05]} fontSize={0.055} color="#1f3f2e">
              Puzzle gelöst in {formatTime(currentTime)}
            </Text>

            <Text position={[0, -0.15, 0.05]} fontSize={0.06} color="#162d21">
              Großartige Leistung 🏆
            </Text>
          </group>
        )}
      </group>
    </group>
  );
}
