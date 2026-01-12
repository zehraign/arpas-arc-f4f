import { XR, IfInSessionMode, createXRStore } from "@react-three/xr";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";
import * as THREE from "three";

import QuizPlane from "./components/QuizPlane";
import PuzzleWithBack from "./components/PuzzleWithBack";
import IndexPage from "./pages/index";
import InfoPlanes from "./components/InfoPlane";
import ProgressBoard from "./components/ProgressBoard"; // STEMPELKARTE

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

/* Billboard für Text/3D-Objekte, immer zur Kamera */
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
  const [showInfo, setShowInfo] = useState(false); // INFOPLANE ERGÄNZT
  const [inAR, setInAR] = useState(false);
  const [activeLocation, setActiveLocation] = useState<any | null>(null);
  const [quizData, setQuizData] = useState<any[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [canStartQuiz, setCanStartQuiz] = useState(false);

  // STEMPELKARTE: Badges
  const [collectedBadges, setCollectedBadges] = useState<string[]>([]);
  const [newBadgeText, setNewBadgeText] = useState<string | null>(null); // Popup-Text
  const badgeTimeout = useRef<NodeJS.Timeout | null>(null);

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

     // STEMPELKARTE: Neues Badge sammeln
const locationId = found.infoId || found.id; // ID für Badge
if (locationId && !collectedBadges.includes(locationId)) {
  setCollectedBadges(prev => [...prev, locationId]);

  // Popup-Text setzen
  const count = collectedBadges.length + 1;
  let message = "";
  if (count === 1) message = "Glückwunsch! Du hast dein erstes Badge 🎉";
  else message = `Super! Schon dein ${count}. Badge! Mach weiter!`;

  setNewBadgeText(message);

  // Popup nach 6 Sekunden wieder ausblenden
  if (badgeTimeout.current) clearTimeout(badgeTimeout.current);
  badgeTimeout.current = setTimeout(() => setNewBadgeText(null), 6000); // 6 Sekunden
}

      // Quiz laden
      if (found.features?.quiz) {
        const loader = quizzes[`./data/${found.features.quiz.file}`];
        const data = await loader();
        setQuizData(data.default);
        setCanStartQuiz(true);
      } else {
        setCanStartQuiz(false);
      }
    });
  }, [inAR, collectedBadges]);

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



      <ambientLight intensity={0.8} />   {/* Gleichmäßiges Grundlicht */}
<directionalLight
  position={[5, 5, 5]}
  intensity={1}
  castShadow
  shadow-mapSize-width={1024}
  shadow-mapSize-height={1024}
/>
<directionalLight
  position={[-5, 5, -5]}
  intensity={0.6}
/>




        <XR store={store}>
          <IfInSessionMode allow="immersive-ar">


{/* InfoPlanes */}
{activeLocation?.infoId && showInfo && (
        <group>
          
          <Billboard position={[3, 0.5, -1]}>
            <InfoPlanes
              locationId={activeLocation.infoId}
              showInfo={showInfo}
              setShowInfo={setShowInfo}
            />
          </Billboard>
        </group>
      )}


          {!showInfo && (         // Hinzugefügt infoplanes 
  <IndexPage
    contentTypes={content_types}
    sceneData={scene}
    topicData={topic}
  />
)}

            {/* STEMPELKARTE */}
           {!showInfo && (
  <Billboard position={[0, 1.2, -1.2]}>
    <ProgressBoard collected={collectedBadges} />
  </Billboard>
)}

            {/* STEMPELKARTE: Popup für neues Badge */}
            {newBadgeText && !showInfo && (
  <Billboard position={[0, 1.5, -1.2]}>
                <group scale={[0.8, 0.8, 0.8]}>
                  <RoundedBox args={[1.8, 0.4, 0.05]} radius={0.05}>
                    <meshStandardMaterial color="#caedea" />
                  </RoundedBox>
                  <Text
                    position={[0, 0, 0.03]}
                    fontSize={0.07}
                    color="#326661" // algen grün
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={1.6}
                    textAlign="center"
                  >
                    {newBadgeText}
                  </Text>
                </group>
              </Billboard>
            )}

            {/* Standort-Buttons */}
            {activeLocation && !showQuiz && !showPuzzle && !showInfo && (
              <group position={[0, 1, -1.4]}>
                {canStartQuiz && activeLocation.features?.quiz && (
                  <group position={[-0.6, 0, -1]}>
                    <RoundedBox
                      args={[0.9, 0.32, 0.08]}
                      radius={0.06}
                      onPointerDown={() => setShowQuiz(true)}
                    >
                      <meshStandardMaterial color={activeLocation.button?.color} />
                    </RoundedBox>
                    <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">
                      {activeLocation.button?.label}
                    </Text>
                  </group>
                )}

                {activeLocation.features?.puzzle && (
                  <group position={[0.6, 0, -1]}>
                    <RoundedBox
                      args={[0.9, 0.32, 0.08]}
                      radius={0.06}
                      onPointerDown={() => setShowPuzzle(true)}
                    >
                      <meshStandardMaterial color="#3c8c40" />
                    </RoundedBox>
                    <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">
                      Puzzle starten 🌱
                    </Text>
                  </group>
                )}
              </group>
            )}

            {/* Quiz & Puzzle */}
            {showQuiz && quizData && !showInfo && (
              <QuizPlane
                questions={quizData}
                position={[0, 1, -1.7]}
                onClose={() => setShowQuiz(false)}
              />
            )}
           {showPuzzle && activeLocation?.features?.puzzle && !showInfo && (
              <PuzzleWithBack
                imageUrl={activeLocation.features.puzzle.image}
                onBack={() => setShowPuzzle(false)}
              />
            )}

           {/* Info-Panels */}
{activeLocation?.infoId && (
  <Billboard position={[3, 0.5, -1]}>
    <InfoPlanes
      locationId={activeLocation.infoId}
      showInfo={showInfo}
      setShowInfo={setShowInfo}
    />
  </Billboard>
)}
          </IfInSessionMode>
        </XR>
      </Canvas>
    </>
  );
}