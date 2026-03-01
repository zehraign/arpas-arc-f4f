import { useState, useEffect } from "react";
import { GroupProps } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import Puzzle3D from "./Puzzle3D";
import { formatTime } from "../utility";

interface PuzzleWithBackProps extends GroupProps {
  onBack: (completed: boolean) => void; // Callback beim Zurückgehen
  imageUrl: string; // Bild für das Puzzle
}

const PUZZLE_CONTAINER_POSITION: [number, number, number] = [0, 0, -0.35]; // Position vom Puzzle relativ zur Hauptgruppe
const CONGRATS_DURATION_MS = 7000; // glückwunsch overlay ist 7 sek sichtbar

export default function PuzzleWithBack({
  onBack,
  imageUrl,
  position = [0, 1, -1.7],
  ...props
}: PuzzleWithBackProps) {
  const [showCongrats, setShowCongrats] = useState(false); // Steuert, ob das Glückwunsch Overlay angezeigt wird
  const [isCompleted, setIsCompleted] = useState(false); // Merkt dauerhaft, ob das Puzzle schon einmal gelöst wurde
  const [currentTime, setCurrentTime] = useState(0); // spielzeit timer
  const [isPuzzleRunning, setIsPuzzleRunning] = useState(true); // Steuert, ob der Timer weiterläuft
  const [resetCount, setResetCount] = useState(0);  // Erzwingt ein Zurücksetzen des Puzzles

  // TIMER 
  useEffect(() => { // timer geht solange das puzzle läuft
    if (!isPuzzleRunning) return;
    const id = setInterval(() => setCurrentTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isPuzzleRunning]);

  const handleSolved = () => { // werden aufgerufen, wenn das Puzzle gelöst wurde
    setIsPuzzleRunning(false); // Timer stoppen
    setShowCongrats(true);// Glückwunsch anzeigen
    setIsCompleted(true); // Erfolg speichern
    setTimeout(() => setShowCongrats(false), CONGRATS_DURATION_MS); // Overlay nach einigen Sekunden wieder ausblenden
  };

  const handleNewGame = () => { // Startet ein neues Spiel
    setResetCount(c => c + 1);  // Puzzle neu aufbauen
    setCurrentTime(0);  // Zeit zurücksetzen
    setIsPuzzleRunning(true);  // Timer neu starten
    setShowCongrats(false);  // Glückwunsch ausblenden
    // isCompleted bleibt true, falls er schonmal gewonnen hat
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
              onPointerDown={(e) => {
                e.stopPropagation();
                onBack(isCompleted); 
              }}
            >
              
              <meshStandardMaterial color="#b22323" />
            </RoundedBox>
            <Text position={[0, 0, 0.045]} fontSize={0.08} color="#ffffff">X</Text>
          </group>

          <Text position={[0, 0.12, 0.04]} fontSize={0.075} color="#1f3f2e">Schiebepuzzle</Text>

          <Text
            position={[0, 0, 0.04]}
            fontSize={0.045}
            color="#1f3f2e"
            maxWidth={1.15}
            textAlign="center"
          >
           Schiebe die Kacheln, um das Bild wiederherzustellen!
          </Text>
              {/* Timer */}
          <Text position={[0, -0.13, 0.04]} fontSize={0.065} color="#c42424">
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
        <group position={[0, -0.9, 0.08]} onPointerDown={handleNewGame}>
          <RoundedBox args={[0.8, 0.2, 0.05]} radius={0.04}>
            <meshStandardMaterial color="#3b7352" />
          </RoundedBox>
          <Text position={[0, 0, 0.06]} fontSize={0.07} color="white">Neues Spiel</Text>
        </group>

        {/* Geschafft Overlay */}
        {showCongrats && (
          <group position={[0, 0.1, 0.4]}>
            <RoundedBox args={[1.3, 0.6, 0.04]} radius={0.05}>
              <meshStandardMaterial color="#ffffff" />
            </RoundedBox>
            <Text position={[0, 0.18, 0.05]} fontSize={0.08} color="#1f3f2e">🎉Herzlichen Glückwunsch!🎉</Text>
            <Text position={[0, 0.03, 0.05]} fontSize={0.055} color="#1f3f2e">Puzzle gelöst in {formatTime(currentTime)}</Text>
            <Text position={[0, -0.15, 0.05]} fontSize={0.06} color="#162d21">Großartige Leistung 🏆</Text>
          </group>
        )}
      </group>
    </group>
  );
}