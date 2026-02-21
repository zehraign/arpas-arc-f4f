import { useState, useEffect } from "react";
import { GroupProps } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { formatTime } from "../utility";

/* -------------------- Types -------------------- */
interface Question {
  question: string;
  options: string[];
  correct: number;
}

interface QuizPlaneProps extends GroupProps {
  questions: Question[]; // fragen array für das Quiz
  onClose: (completed: boolean) => void; // übergeben, ob Quiz bestanden
}

/* Constants  */

const TEXT = "#111"; 
const RED = "#d9534f"; // rot falsche antowrt x buttons

/*  Component */
export default function QuizPlane({
  questions,
  onClose,
  ...props
}: QuizPlaneProps) {
  // - State 
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false); // ob aktuelle frage beantwortet
  const [showResult, setShowResult] = useState(false); 
  const [score, setScore] = useState(0); // anzahl richtig beantwortete 
  const [quizTime, setQuizTime] = useState(0); // timer in sekunden 
const [isQuizRunning, setIsQuizRunning] = useState(true); // timer status
  

  const q = questions[current]; // aktuelle frage
  const progress = (current + 1) / questions.length; // fortschritt für progressboard 

  // TIMER
  useEffect(() => {
    if (!isQuizRunning) return;
    const id = setInterval(() => {
      setQuizTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isQuizRunning]);
 

  /*  Handlers  */
  const handleSelect = (idx: number) => {
    if (answered) return; // keine mehrfachauswahl
    setSelected(idx);
    setAnswered(true); // frage als beantwortet markieren
    if (idx === q.correct) setScore((s) => s + 1); // wenn richuig + 1 punkt 
  };

  const handleNext = () => {
    setSelected(null);
    setAnswered(false);
  
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1); // nächste frage
    } else {
      setShowResult(true); // quiz beenden
      setIsQuizRunning(false); // ⏸️ STOPPUHR STOPPEN
    }
  };

  const handleRestart = () => {
    // quiz zurücksetzen
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setShowResult(false);
    setScore(0);
    setQuizTime(0);
setIsQuizRunning(true);
   
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
        onPointerDown={() => {
          setIsQuizRunning(false); // timmer stoppen
          onClose(score === questions.length);
        }}
      >
        <meshStandardMaterial color={RED} />
        <Text fontSize={0.08} color="#fff" position={[0, 0, 0.03]}>
          ✕
        </Text>
      </RoundedBox>

      {!showResult && (
        <>
          {/* HEADER aktuelle frage */}
          <Text
            position={[0, 0.42, 0.06]}
            fontSize={0.05}
            anchorX="center"
            textAlign="center"
            color={TEXT}
          >
            Frage {current + 1} von {questions.length}
          </Text>

 {/* stop Uhr */}
          <Text position={[0.45, 0.34, 0.06]} fontSize={0.05} color={RED}>
  ⏱ {formatTime(quizTime)}
</Text>

       

         {/* PROGRESS BAR BACKGROUND */}
<RoundedBox
  args={[1.1, 0.045, 0.02]}
  position={[0, 0.30, 0.02]}
  radius={0.02}
>
  <meshStandardMaterial color="#e0e0e0" />
</RoundedBox>

{/* PROGRESS BAR Füllung */}
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

          {/* NEXT button nur wenn frage beantwortet*/}
          {answered && (
            <RoundedBox
              args={[0.45, 0.12, 0.04]}
              position={[0, -0.52, 0.04]}
              radius={0.03}
              onPointerDown={handleNext} // nächste frage
              
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

<Text position={[0, -0.18, 0.06]} fontSize={0.055} color={TEXT}>
  ⏱ Zeit: {formatTime(quizTime)}
</Text>
{/* nochmal button am ende */}
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
{/* schließen button */}
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