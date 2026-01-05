import { XR, IfInSessionMode, createXRStore } from "@react-three/xr";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
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
const store = createXRStore({ controller: false });
const quizzes = (import.meta as any).glob("./data/*.json");

interface AppProps {
  buttonClassName?: string;
  buttonText?: string | JSX.Element;
  view3dButtonText?: string | JSX.Element;
  content_types: ContentTypesData;
  scene: SceneData;
  topic: TopicData;
}

/* Billboard */
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
    if (!ref.current) return;
    ref.current.lookAt(
      new THREE.Vector3(camera.position.x, ref.current.position.y, camera.position.z)
    );
  });

  return <group ref={ref} position={position}>{children}</group>;
}

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

  const handleEnterAR = async () => {
    await store.enterAR();
    setInAR(true);
  };

  useEffect(() => {
    if (!inAR) return;

    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;

      const found = quizLocations.find(loc =>
        distanceInMeters(latitude, longitude, loc.coords.lat, loc.coords.lon) < loc.radius
      );

      if (!found) return;
      setActiveLocation(found);

      if (found.features?.quiz) {
        const loader = quizzes[`./data/${found.features.quiz.file}`];
        const data = await loader();
        setQuizData(data.default);
        setCanStartQuiz(true);
      } else {
        setCanStartQuiz(false);
      }
    });
  }, [inAR]);

  return (
    <>
      {!inAR && (
        <div className="button-group">
          <button className={buttonClassName} onClick={handleEnterAR}>
            {buttonText}
          </button>
          <button className={buttonClassName}>{view3dButtonText}</button>
        </div>
      )}

      <Canvas>
        <XR store={store}>
          <IfInSessionMode allow="immersive-ar">
            <IndexPage contentTypes={content_types} sceneData={scene} topicData={topic} />

            {activeLocation && !showQuiz && !showPuzzle && (
              <group position={[0, 1, -1.4]}>
                {canStartQuiz && activeLocation.features?.quiz && (
                  <group position={[-0.6, 0, -1]}>
                    <RoundedBox args={[0.9, 0.32, 0.08]} radius={0.06}
                      onPointerDown={() => setShowQuiz(true)}>
                      <meshStandardMaterial color={activeLocation.button?.color} />
                    </RoundedBox>
                    <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">
                      {activeLocation.button?.label}
                    </Text>
                  </group>
                )}

                {activeLocation.features?.puzzle && (
                  <group position={[0.6, 0, -1]}>
                    <RoundedBox args={[0.9, 0.32, 0.08]} radius={0.06}
                      onPointerDown={() => setShowPuzzle(true)}>
                      <meshStandardMaterial color="#3c8c40" />
                    </RoundedBox>
                    <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">
                      Puzzle starten 🌱
                    </Text>
                  </group>
                )}
              </group>
            )}

            {showQuiz && quizData && (
              <QuizPlane questions={quizData} position={[0, 1, -1.7]} onClose={() => setShowQuiz(false)} />
            )}

            {showPuzzle && activeLocation?.features?.puzzle && (
              <PuzzleWithBack
                imageUrl={activeLocation.features.puzzle.image}
                onBack={() => setShowPuzzle(false)}
              />
            )}

            {activeLocation?.infoId && (
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
