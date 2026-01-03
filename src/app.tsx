import { XR, IfInSessionMode, createXRStore } from "@react-three/xr";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";
import * as THREE from "three";

import QuizPlane from "./components/QuizPlane";
import PuzzleWithBack from "./components/PuzzleWithBack";
import IndexPage from "./pages/index";
import InfoPlanes from "./components/InfoPlane";

import { quizLocations } from "./data/locations";
import { distanceInMeters } from "./utility/geo";

import { SceneData } from "./types/objectData";
import { TopicData } from "./types/topicData";
import { ContentTypesData } from "./types/contentTypesData";

/* XR STORE */
const store = createXRStore({
  controller: false,
});

/* Quiz loader */
const quizzes = (import.meta as any).glob("./data/*.json");

interface AppProps {
  buttonClassName?: string;
  buttonText?: string | JSX.Element;
  view3dButtonText?: string | JSX.Element;
  content_types: ContentTypesData;
  scene: SceneData;
  topic: TopicData;
}

/* Billboard-Komponente: Dreht nur zur Kamera */
function Billboard({
  children,
  position,
}: {
  children: React.ReactNode;
  position: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (ref.current) {
      const target = new THREE.Vector3(camera.position.x, ref.current.position.y, camera.position.z);
      ref.current.lookAt(target);
    }
  });

  return <group ref={ref} position={position}>{children}</group>;
}

/* App */
export default function App({
  buttonClassName = "start-button",
  buttonText = "Enter AR",
  view3dButtonText = "View in 3D",
  content_types,
  scene,
  topic,
}: AppProps) {
  const [inAR, setInAR] = useState(false);
  const [activeLocation, setActiveLocation] = useState<any | null>(null);
  const [quizData, setQuizData] = useState<any[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [canStartQuiz, setCanStartQuiz] = useState(false);

  /* ENTER AR */
  const handleEnterAR = async () => {
    await store.enterAR();
    setInAR(true);
  };

  /* LOCATION + QUIZ LOAD */
  useEffect(() => {
    if (!inAR) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      const found = quizLocations.find((loc) => {
        const dist = distanceInMeters(
          latitude,
          longitude,
          loc.coords.lat,
          loc.coords.lon
        );
        return dist < loc.radius;
      });

      if (!found) return;

      setActiveLocation(found);

      // Quiz laden
      if (found.features?.quiz) {
        const quizPath = `./data/${found.features.quiz.file}`;
        const loader = quizzes[quizPath];
        if (!loader) return;
        const data = await loader();
        setQuizData(data.default);
        setCanStartQuiz(true);
      } else {
        setCanStartQuiz(false);
      }

      // Puzzle nur für Standorte mit Puzzle-Feature
      if (!found.features?.puzzle) {
        setShowPuzzle(false);
      }
    });
  }, [inAR]);

  return (
    <>
      {/* START UI (NICHT AR) */}
      {!inAR && (
        <div className="button-group">
          <button className={buttonClassName} onClick={handleEnterAR}>
            {buttonText}
          </button>
          <button className={buttonClassName}>{view3dButtonText}</button>
        </div>
      )}

      {/* AR CANVAS */}
      <Canvas style={{ width: "100%", height: "100%" }}>
        <XR store={store}>
          <IfInSessionMode allow="immersive-ar">
            {/* Szene */}
            <IndexPage contentTypes={content_types} sceneData={scene} topicData={topic} />

            {/* Zwei Buttons nebeneinander: Quiz & Puzzle */}
            {activeLocation && !showQuiz && !showPuzzle && (
  <group position={[0, 1, -1.4]} rotation={[0, 0, 0]}>
    {/* Quiz Button */}
    {canStartQuiz && activeLocation.features?.quiz && (
      <group position={[-0.55, 0, 0]}>
        <mesh onPointerDown={() => setShowQuiz(true)}>
          <boxGeometry args={[0.9, 0.32, 0.1]} />
          <meshStandardMaterial color={activeLocation.button?.color ?? "#187852"} />
        </mesh>
        <Text
          position={[0, 0, 0.09]}
          fontSize={0.065}
          color="black"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.8}
          textAlign="center"
        >
          {activeLocation.button?.label ?? "Quiz starten"}
        </Text>
      </group>
    )}

    {/* Puzzle Button */}
    {activeLocation.features?.puzzle && (
      <group position={[0.55, 0, 0]}>
        <mesh onPointerDown={() => setShowPuzzle(true)}>
          <boxGeometry args={[0.9, 0.32, 0.1]} />
          <meshStandardMaterial color="#3c8c40" />
        </mesh>
        <Text
          position={[0, 0, 0.09]}
          fontSize={0.065}
          anchorX="center"
          anchorY="middle"
        >
          Puzzle starten 🌱
        </Text>
      </group>
    )}
  </group>
)}


            {/* QuizPlane */}
            {showQuiz && quizData && (
              <QuizPlane
                questions={quizData}
                position={[0, 1, -1.7]}
                onClose={() => setShowQuiz(false)}
              />
            )}

            {/* Puzzle */}
            {showPuzzle && activeLocation?.features?.puzzle && (
              <PuzzleWithBack
                onBack={() => setShowPuzzle(false)}
              />
            )}

            {/* InfoPlanes nach Standort */}
            {activeLocation && activeLocation.infoId && (
              <Billboard position={[3, 0.5, -1]}>
                <InfoPlanes locationId={activeLocation.infoId} />
              </Billboard>
            )}
          </IfInSessionMode>
        </XR>
      </Canvas>
    </>
  );
}

