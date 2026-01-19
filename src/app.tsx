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
import MiniMapPreview from "./navigation/MiniMapPreview";
import { NavigationModelProvider } from "./navigation/NavigationModelContext";
import { NavigationOverlayProvider, useNavigationOverlay } from "./navigation/NavigationOverlayContext";

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

function DomOverlayRootSync({ onChange }: { onChange: (root: Element | null) => void }) {
    const domOverlayRoot = useXR((state) => state.domOverlayRoot);

    useEffect(() => {
        onChange(domOverlayRoot ?? null);
    }, [domOverlayRoot, onChange]);

    return null;
}

/* App */
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

/* DOM Overlay (für Navigation Overlay / PortalRoot) */
const [domOverlayRoot, setDomOverlayRoot] = useState<Element | null>(null);
const [domOverlayReady, setDomOverlayReady] = useState(false);
const navPortalRoot = xrSessionActive && domOverlayReady ? domOverlayRoot : null;

/* Badges */
const [collectedBadges, setCollectedBadges] = useState<string[]>([]);
const [newBadgeText, setNewBadgeText] = useState<string | null>(null);
const [shownBadgePopups, setShownBadgePopups] = useState<string[]>([]);
const badgeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

const collectBadgeSilent = (id: string, callback?: () => void) => {
  if (!id || collectedBadges.includes(id)) return;
  setCollectedBadges((p) => {
    const newBadges = [...p, id];
    if (callback) callback(); // Popup direkt nach Hinzufügen
    return newBadges;
  });
};
const showBadgePopup = (locationId: string) => {
  if (!locationId) return;

  // ⛔ Popup schon gezeigt? Dann nix tun
  if (shownBadgePopups.includes(locationId)) return;

  const count = collectedBadges.length + 1; // +1 weil wir es gerade gesammelt haben
  let message = "";
  if (count === 1) {
    message = "Glückwunsch! Du hast dein erstes Badge 🎉";
  } else if (count === 5) {
    message = "WOW! Alle Standorte gesammelt! ⭐ Master Explorer!";
  } else {
    message = `Super! Schon dein ${count}. Badge!`;
  }

  setNewBadgeText(message);
  setShownBadgePopups((prev) => [...prev, locationId]);

  if (badgeTimeout.current) clearTimeout(badgeTimeout.current);
  badgeTimeout.current = setTimeout(() => setNewBadgeText(null), 6000);
};

/* ENTER AR */
const handleEnterAR = async () => {
  // Wenn du lieber sofort Startscreen ausblendest: setInAR(true) hier nach oben ziehen
  try {
    await store.enterAR();
    setInAR(true);
  } catch (error) {
    console.warn("XR session konnte nicht gestartet werden:", error);
  }
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

    const found = quizLocations.find((loc) => {
      const dist = distanceInMeters(latitude, longitude, loc.coords.lat, loc.coords.lon);
      return dist < loc.radius;
    });

    if (!found) return;

    setActiveLocation(found);

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
}, [inAR, collectedBadges]);

/* DOM-Overlay ready check */
useEffect(() => {
  if (!xrSessionActive || !domOverlayRoot) {
    setDomOverlayReady(false);
    return;
  }

  let rafId = 0;
  let tries = 0;
  const maxTries = 10;

  const checkReady = () => {
    tries += 1;

    if (!(domOverlayRoot instanceof HTMLElement)) {
      setDomOverlayReady(true);
      return;
    }

    const rect = domOverlayRoot.getBoundingClientRect();
    const isVisible = domOverlayRoot.style.display !== "none" && rect.width > 0 && rect.height > 0;

    setDomOverlayReady(isVisible);

    if (!isVisible && tries < maxTries) {
      rafId = requestAnimationFrame(checkReady);
    }
  };

  rafId = requestAnimationFrame(checkReady);
  return () => cancelAnimationFrame(rafId);
}, [xrSessionActive, domOverlayRoot]);

return (
  <NavigationOverlayProvider>
    {/* STARTSCREEN */}
    {!inAR && (
      <div className="startscreen">
        <img className="startscreen__bg" src={`${base}start/background.PNG`} alt="" />

        {/* optionaler Text aus startseite-Branch */}
        <div className="startscreen__text">
          <div className="startscreen__title">Willkommen beim AR Campus Guide</div>
          <div className="startscreen__subtitle">Tippe auf START, um in den AR Modus zu wechseln.</div>
        </div>

        <img
          className="startscreen__character"
          src={frames[frameIndex]}
          alt="character"
          draggable={false}
        />

        <button className="startscreen__startImgBtn" onClick={handleEnterAR}>
          <img src={`${base}start/ui/start-button.PNG`} alt="START" draggable={false} />
        </button>
      </div>
    )}

    {/* AR */}
    <Canvas>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <XR store={store}>
        <XrSessionSync onChange={setXrSessionActive} />
        <DomOverlayRootSync onChange={setDomOverlayRoot} />

        <IfInSessionMode allow="immersive-ar">
          {!showInfo && (
            <IndexPage contentTypes={content_types} sceneData={scene} topicData={topic} />
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
                  position={[0, 0, 0.03]}
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

          {/* QUIZ */}
          {showQuiz && quizData && !showInfo && (
           <QuizPlane
           questions={quizData}
           position={[0, 1, -1.7]}
           // Quiz
onClose={(completed: boolean) => {
  setShowQuiz(false);
  if (completed && activeLocation) {
    const locationId = activeLocation.infoId || activeLocation.id;

    // Badge sammeln und Popup direkt danach
    collectBadgeSilent(locationId, () => showBadgePopup(locationId));
  }
}}
         />
          )}

          {/* PUZZLE */}
{showPuzzle && activeLocation?.features?.puzzle && !showInfo && (
 <PuzzleWithBack
 imageUrl={activeLocation.features.puzzle.image}
 // Puzzle
onBack={(completed: boolean) => {
  setShowPuzzle(false);
  if (completed && activeLocation) {
    const locationId = activeLocation.infoId || activeLocation.id;

    collectBadgeSilent(locationId, () => showBadgePopup(locationId));
  }
}}
/>
)}

          {/* INFO PLANES */}
{activeLocation?.infoId && (
  <Billboard position={[3, 0.5, -1]}>
    <InfoPlanes
      locationId={activeLocation.infoId}
      showInfo={showInfo}
      setShowInfo={setShowInfo} // Keine Badge hier!
    />
  </Billboard>
)}
        </IfInSessionMode>
      </XR>
    </Canvas>

    {/* Navigation Overlay — kombiniert (Portal wenn verfügbar) */}
    <NavigationOverlayStateSync isArActive={xrSessionActive} />

    <NavigationModelProvider>
      <MiniMapPreview isArActive={inAR} portalRoot={navPortalRoot} />
      <NavigationOverlay portalRoot={navPortalRoot} showSessionWarning={inAR && !xrSessionActive} />
    </NavigationModelProvider>

  </NavigationOverlayProvider>
);
}