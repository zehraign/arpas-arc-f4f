import {
  XR,
  IfInSessionMode,
  createXRStore,
  useXR,
} from "@react-three/xr";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { useEffect, useState, useRef, useMemo } from "react";
import * as THREE from "three";

/* Components */
import QuizPlane from "./components/QuizPlane";
import PuzzleWithBack from "./components/PuzzleWithBack";
import IndexPage from "./pages/index";
import InfoPlanes from "./components/InfoPlane";
import ProgressBoard from "./components/ProgressBoard";

/* Navigation */
import NavigationOverlay from "./navigation/NavigationOverlay";
import NavigationFab from "./navigation/NavigationFab";
import {
  NavigationOverlayProvider,
  useNavigationOverlay,
} from "./navigation/NavigationOverlayContext";

/* Data */
import { quizLocations } from "./data/locations";
import { distanceInMeters } from "./utility/geo";

/* Types */
import { SceneData } from "./types/objectData";
import { TopicData } from "./types/topicData";
import { ContentTypesData } from "./types/contentTypesData";

/* XR STORE */
const store = createXRStore({ controller: false });
const quizzes = (import.meta as any).glob("./data/*.json");

interface AppProps {
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
      new THREE.Vector3(
        camera.position.x,
        ref.current.position.y,
        camera.position.z
      )
    );
  });

  return <group ref={ref} position={position}>{children}</group>;
}

/* Navigation Sync */
function NavigationOverlayStateSync({ isArActive }: { isArActive: boolean }) {
  const { close } = useNavigationOverlay();
  useEffect(() => {
    if (!isArActive) close();
  }, [isArActive, close]);
  return null;
}

function XrSessionSync({ onChange }: { onChange: (active: boolean) => void }) {
  const session = useXR((s) => s.session);
  useEffect(() => {
    onChange(Boolean(session));
  }, [session, onChange]);
  return null;
}

/* APP */
export default function App({
  content_types,
  scene,
  topic,
}: AppProps) {
  const [inAR, setInAR] = useState(false);
  const [xrSessionActive, setXrSessionActive] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [activeLocation, setActiveLocation] = useState<any | null>(null);
  const [quizData, setQuizData] = useState<any[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [canStartQuiz, setCanStartQuiz] = useState(false);

  /* Badges */
  const [collectedBadges, setCollectedBadges] = useState<string[]>([]);
  const [newBadgeText, setNewBadgeText] = useState<string | null>(null);
  const [shownBadgePopups, setShownBadgePopups] = useState<string[]>([]);
  const badgeTimeout = useRef<NodeJS.Timeout | null>(null);

  const collectBadgeSilent = (id: string) => {
    if (!id || collectedBadges.includes(id)) return;
    setCollectedBadges((p) => [...p, id]);
  };



  const showBadgePopup = (locationId: string) => {
    if (!locationId) return;
  
    // ⛔ Popup schon gezeigt? Dann nix tun
    if (shownBadgePopups.includes(locationId)) return;
  
    // ⛔ Badge existiert noch gar nicht
    if (!collectedBadges.includes(locationId)) return;
  
    const count = collectedBadges.length;
    if (count <= 0) return; // 🔒 Sicherheitsnetz gegen "0. Badge"
  
    let message = "";
    if (count === 1) {
      message = "Glückwunsch! Du hast dein erstes Badge 🎉";
    } else if (count === 5) {
      message = "WOW! Alle Standorte gesammelt! ⭐ Master Explorer!";
    } else {
      message = `Super! Schon dein ${count}. Badge!`;
    }

    setNewBadgeText(message);
    setShownBadgePopups(prev => [...prev, locationId]);
  
    if (badgeTimeout.current) clearTimeout(badgeTimeout.current);
    badgeTimeout.current = setTimeout(() => setNewBadgeText(null), 6000);
  };





  /* ENTER AR */
  const handleEnterAR = async () => {
    await store.enterAR();
    setInAR(true);
  };

  /* STARTSCREEN CHARACTER */
  const base = import.meta.env.BASE_URL;
  const frames = useMemo(
      () => [
          `${base}start/character/frame_01.PNG`,
          `${base}start/character/frame_02.PNG`,
          `${base}start/character/frame_03.PNG`,
          `${base}start/character/frame_04.PNG`,
          `${base}start/character/frame_05.PNG`,
          `${base}start/character/frame_06.PNG`,
          `${base}start/character/frame_07.PNG`,
          `${base}start/character/frame_08.PNG`,
          `${base}start/character/frame_09.PNG`,
          `${base}start/character/frame_10.PNG`,
      ],
      [base]
  );



  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
      if (inAR) return;
      const id = setInterval(() => {
          setFrameIndex((p) => (p + 1) % 10);
      }, 160);
      return () => clearInterval(id);
  }, [inAR]);


  /* LOCATION + QUIZ */
  useEffect(() => {
    if (!inAR) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      const found = quizLocations.find(
        (l) =>
          distanceInMeters(
            latitude,
            longitude,
            l.coords.lat,
            l.coords.lon
          ) < l.radius
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
  }, [inAR, collectedBadges]);

  return (
    <NavigationOverlayProvider>

      {/* STARTSCREEN */}
      {!inAR && (
        <div className="startscreen">
          <img className="startscreen__bg" src={`${base}start/background.PNG`} />
          <img
            className="startscreen__character"
            src={frames[frameIndex]}
            draggable={false}
          />
          <button
            className="startscreen__startImgBtn"
            onClick={handleEnterAR}
          >
            <img src={`${base}start/ui/start-button.PNG`} />
          </button>
        </div>
      )}

      {/* AR */}
      <Canvas>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <XR store={store}>
          <XrSessionSync onChange={setXrSessionActive} />
          <IfInSessionMode allow="immersive-ar">

            {!showInfo && (
              <IndexPage
                contentTypes={content_types}
                sceneData={scene}
                topicData={topic}
              />
            )}

            {!showInfo && (
              <Billboard position={[0, 1.2, -1.2]}>
                <ProgressBoard collected={collectedBadges} />
              </Billboard>
            )}

{newBadgeText && !showInfo && (
  <Billboard position={[0, 1.5, -1.2]}>
    <group scale={[0.8, 0.8, 0.8]}>
      
      <RoundedBox args={[1.8, 0.4, 0.05]} radius={0.05}>
        <meshStandardMaterial color="#caedea" />
      </RoundedBox>

      <Text
        position={[0, 0, 0.03]}   // 👈 WICHTIG: vor die Box
        fontSize={0.07}
        color="#326661"
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

            {/* BUTTONS */}
            {activeLocation && !showQuiz && !showPuzzle && !showInfo && (
              <group position={[0, 1, -1.4]}>

                {canStartQuiz && (
                  <group position={[-0.6, 0, -1]}>
                    <RoundedBox
                      args={[0.9, 0.32, 0.08]}
                      radius={0.06}
                      onPointerDown={() => {
                        setShowQuiz(true);
                        collectBadgeSilent(activeLocation.infoId || activeLocation.id);
                      }}
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
                      onPointerDown={() => {
                        setShowPuzzle(true);
                        collectBadgeSilent(activeLocation.infoId || activeLocation.id);
                      }}
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

            {/* QUIZ */}
            {showQuiz && quizData && !showInfo && (
              <QuizPlane
                questions={quizData}
                position={[0, 1, -1.7]}
                onClose={() => {
                  setShowQuiz(false);
                  showBadgePopup(activeLocation.infoId || activeLocation.id);
                }}
              />
            )}

            {/* PUZZLE */}
            {showPuzzle && activeLocation?.features?.puzzle && !showInfo && (
              <PuzzleWithBack
                imageUrl={activeLocation.features.puzzle.image}
                onBack={() => {
                  setShowPuzzle(false);
                  showBadgePopup(activeLocation.infoId || activeLocation.id);
                }}
              />
            )}

            {/* INFO PLANES */}
            {activeLocation?.infoId && (
              <Billboard position={[3, 0.5, -1]}>
                <InfoPlanes
                  locationId={activeLocation.infoId}
                  showInfo={showInfo}
                  setShowInfo={(v) => {
                    if (!v) {
                      showBadgePopup(activeLocation.infoId || activeLocation.id);
                    }
                    setShowInfo(v);
                  }}
                />
              </Billboard>
            )}

          </IfInSessionMode>
        </XR>
      </Canvas>

      <NavigationOverlayStateSync isArActive={xrSessionActive} />
      <NavigationOverlay />
      {xrSessionActive && <NavigationFab />}

    </NavigationOverlayProvider>
  );
}