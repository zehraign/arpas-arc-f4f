import { useState, useEffect } from "react";
import { GroupProps } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";

/* -------------------- Types -------------------- */
interface Question {
  question: string;
  options: string[];
  correct: number;
}

interface QuizPlaneProps extends GroupProps {
  questions: Question[];
  onClose: (completed: boolean) => void; // ✅ übergeben, ob Quiz bestanden
}

/* -------------------- Constants -------------------- */
const QUESTION_TIME = 15;
const TEXT = "#111";
const RED = "#d9534f";

/* -------------------- Component -------------------- */
export default function QuizPlane({
  questions,
  onClose,
  ...props
}: QuizPlaneProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const q = questions[current];
  const progress = (current + 1) / questions.length;

  /* -------------------- Timer -------------------- */
  useEffect(() => {
    if (answered || showResult) return;
    const i = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, [answered, showResult]);

  useEffect(() => {
    if (timeLeft === 0 && !answered) {
      setAnswered(true);
      setSelected(null);
    }
  }, [timeLeft, answered]);

  /* -------------------- Handlers -------------------- */
  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setSelected(null);
    setAnswered(false);
    setTimeLeft(QUESTION_TIME);
    if (current + 1 < questions.length) setCurrent((c) => c + 1);
    else setShowResult(true);
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setShowResult(false);
    setScore(0);
    setTimeLeft(QUESTION_TIME);
  };

  /* -------------------- Render -------------------- */
  return (
    <group position={[0, 1.05, -2.6]} {...props}>
      {/* PANEL */}
      <RoundedBox args={[1.3, 0.95, 0.05]} radius={0.04}>
        <meshStandardMaterial color="#fff" />
      </RoundedBox>

      {/* CLOSE X */}
      <RoundedBox
        args={[0.12, 0.12, 0.04]}
        position={[0.58, 0.42, 0.06]}
        radius={0.03}
        onPointerDown={() => onClose(score === questions.length)}
      >
        <meshStandardMaterial color={RED} />
        <Text fontSize={0.08} color="#fff" position={[0, 0, 0.03]}>
          ✕
        </Text>
      </RoundedBox>

      {!showResult && (
        <>
          {/* HEADER */}
          <Text
            position={[0, 0.42, 0.06]}
            fontSize={0.05}
            anchorX="center"
            textAlign="center"
            color={TEXT}
          >
            Frage {current + 1} von {questions.length}
          </Text>

          {/* TIMER */}
          <Text position={[0.45, 0.34, 0.06]} fontSize={0.05} color={RED}>
            ⏱ {timeLeft}s
          </Text>

         {/* PROGRESS BAR BACKGROUND */}
<RoundedBox
  args={[1.1, 0.045, 0.02]}
  position={[0, 0.30, 0.02]}
  radius={0.02}
>
  <meshStandardMaterial color="#e0e0e0" />
</RoundedBox>

{/* PROGRESS BAR FILL */}
<RoundedBox
  args={[1.1 * progress, 0.045, 0.02]}
  position={[
    -0.55 + (1.1 * progress) / 2,
    0.30,
    0.03
  ]}
  radius={0.02}
>
  <meshStandardMaterial color="#4caf50" />
</RoundedBox>

          {/* QUESTION */}
          <Text
            position={[0, 0.17, 0.06]}
            fontSize={0.06}
            maxWidth={1.15}
            textAlign="center"
            anchorX="center"
            color={TEXT}
          >
            {q.question}
          </Text>

          {/* OPTIONS */}
          {q.options.slice(0, 3).map((opt, idx) => {
            const bg = answered
              ? idx === q.correct
                ? "#4caf50"
                : idx === selected
                ? RED
                : "#ccc"
              : "#f2f2f2";

            return (
              <RoundedBox
                key={idx}
                args={[1.1, 0.16, 0.04]}
                position={[0, -0.02 - idx * 0.19, 0.04]}
                radius={0.03}
                onPointerDown={() => handleSelect(idx)}
              >
                <meshStandardMaterial color={bg} />
                <Text
                  position={[0, 0, 0.03]}
                  maxWidth={0.95}
                  textAlign="center"
                  anchorX="center"
                  anchorY="middle"
                  fontSize={0.045}
                  color={TEXT}
                >
                  {opt}
                </Text>
              </RoundedBox>
            );
          })}

          {/* NEXT */}
          {answered && (
            <RoundedBox
              args={[0.45, 0.12, 0.04]}
              position={[0, -0.52, 0.04]}
              radius={0.03}
              onPointerDown={handleNext}
            >
              <meshStandardMaterial color="#1abc9c" />
              <Text
                position={[0, 0, 0.03]}
                fontSize={0.05}
                color={TEXT}
              >
                Weiter
              </Text>
            </RoundedBox>
          )}
        </>
      )}

      {/* RESULT */}
      {showResult && (
        <>
          <Text position={[0, 0.2, 0.06]} fontSize={0.08} color={TEXT}>
            Ergebnis
          </Text>

          <Text position={[0, 0.05, 0.06]} fontSize={0.06} color={TEXT}>
            {score} / {questions.length} richtig
          </Text>

          {score === questions.length ? (
            <Text position={[0, -0.05, 0.06]} fontSize={0.055} color="#0077cc">
              🏅 Future-Food-Quiz-Experte!
            </Text>
          ) : (
            <Text position={[0, -0.05, 0.06]} fontSize={0.055} color="#f39c12">
              Fast geschafft! Versuch es nochmal!
            </Text>
          )}

          <RoundedBox
            args={[0.55, 0.12, 0.04]}
            position={[0, -0.30, 0.04]}
            onPointerDown={handleRestart}
          >
            <meshStandardMaterial color="#1abc9c" />
            <Text position={[0, 0, 0.03]} fontSize={0.05} color={TEXT}>
              Nochmal
            </Text>
          </RoundedBox>

          <RoundedBox
  args={[0.55, 0.12, 0.04]}
  position={[0, -0.46, 0.04]}
  onPointerDown={() => onClose(score === questions.length)} // ✅ Badge nur wenn alle richtig
>
  <meshStandardMaterial color={RED} />
  <Text position={[0, 0, 0.03]} fontSize={0.05} color="#fff">
    Schließen
  </Text>
</RoundedBox>
        </>
      )}
    </group>
  );
}