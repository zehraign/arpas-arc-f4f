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
import MemoryGame from "./components/MemoryGame";
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

const store = createXRStore({ controller: false });
const quizzes = (import.meta as any).glob("./data/*.json");

interface AppProps {
  content_types: ContentTypesData;
  scene: SceneData;
  topic: TopicData;
}

/* Billboard Helper */
function Billboard({ children, position }: { children: React.ReactNode; position: [number, number, number]; }) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.lookAt(new THREE.Vector3(camera.position.x, ref.current.position.y, camera.position.z));
  });
  return <group ref={ref} position={position}>{children}</group>;
}

/* Sync Helpers */
function NavigationOverlayStateSync({ isArActive }: { isArActive: boolean }) {
  const { close } = useNavigationOverlay();
  useEffect(() => { if (!isArActive) close(); }, [isArActive, close]);
  return null;
}
function XrSessionSync({ onChange }: { onChange: (active: boolean) => void }) {
  const session = useXR((s) => s.session);
  useEffect(() => { onChange(Boolean(session)); }, [session, onChange]);
  return null;
}
function DomOverlayRootSync({ onChange }: { onChange: (root: Element | null) => void }) {
  const domOverlayRoot = useXR((state) => state.domOverlayRoot);
  useEffect(() => { onChange(domOverlayRoot ?? null); }, [domOverlayRoot, onChange]);
  return null;
}

export default function App({ content_types, scene, topic }: AppProps) {
  /* UI States */
  const [inAR, setInAR] = useState(false);
  const [xrSessionActive, setXrSessionActive] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  /* Game States */
  const [activeLocation, setActiveLocation] = useState<any | null>(null);
  const [quizData, setQuizData] = useState<any[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [canStartQuiz, setCanStartQuiz] = useState(false);

  /* XR Overlay Sync */
  const [domOverlayRoot, setDomOverlayRoot] = useState<Element | null>(null);
  const [domOverlayReady, setDomOverlayReady] = useState(false);
  const navPortalRoot = xrSessionActive && domOverlayReady ? domOverlayRoot : null;

  /* Badge System */
  const [collectedBadges, setCollectedBadges] = useState<string[]>([]);
  const [newBadgeText, setNewBadgeText] = useState<string | null>(null);
  const [shownBadgePopups, setShownBadgePopups] = useState<string[]>([]);
  const badgeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const collectBadgeSilent = (id: string, callback?: () => void) => {
    if (!id || collectedBadges.includes(id)) return;
    setCollectedBadges((p) => [...p, id]);
    if (callback) callback();
  };

  const showBadgePopup = (locationId: string) => {
    if (!locationId || shownBadgePopups.includes(locationId)) return;
    const count = collectedBadges.length + 1;
    let message = count === 1 ? "Glückwunsch! Dein erstes Badge 🎉" : 
                  count === 5 ? "WOW! Alle Badges gesammelt! ⭐ Master Explorer!" : 
                  `Super! Dein ${count}. Badge!`;
    setNewBadgeText(message);
    setShownBadgePopups((prev) => [...prev, locationId]);
    if (badgeTimeout.current) clearTimeout(badgeTimeout.current);
    badgeTimeout.current = setTimeout(() => setNewBadgeText(null), 6000);
  };

  const handleEnterAR = async () => {
    try { await store.enterAR(); setInAR(true); } 
    catch (error) { console.warn("XR session konnte nicht gestartet werden:", error); }
  };

  /* Startscreen Animation */
  const base = import.meta.env.BASE_URL;
  const frames = useMemo(() => Array.from({ length: 10 }, (_, i) => `${base}start/character/frame_${String(i + 1).padStart(2, '0')}.PNG`), [base]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (inAR) return;
    const id = setInterval(() => { setFrameIndex((p) => (p + 1) % 10); }, 160);
    return () => clearInterval(id);
  }, [inAR]);

  /* Geo-Location Logik */
  useEffect(() => {
    if (!inAR) return;
  
    setIsLoading(true); //  LOADING START
  
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
        if (loader) {
          const data = await loader();
          setQuizData(data.default);
          setCanStartQuiz(true);
        }
      } else { setCanStartQuiz(false); }
      setIsLoading(false); //  LOADING ENDE


    });
  }, [inAR]);

  useEffect(() => {
    if (!xrSessionActive || !domOverlayRoot) { setDomOverlayReady(false); return; }
    setDomOverlayReady(true);
  }, [xrSessionActive, domOverlayRoot]);

  return (
    <NavigationOverlayProvider>
      {!inAR && (
        <div className="startscreen">
          <img className="startscreen__bg" src={`${base}start/background.PNG`} alt="" />
          <div className="startscreen__text">
            <div className="startscreen__title">Willkommen beim AR Campus Guide</div>
            <div className="startscreen__subtitle">Tippe auf START, um in den AR Modus zu wechseln.</div>
          </div>
          <img className="startscreen__character" src={frames[frameIndex]} alt="character" draggable={false} />
          <button className="startscreen__startImgBtn" onClick={handleEnterAR}>
            <img src={`${base}start/ui/start-button.PNG`} alt="START" draggable={false} />
          </button>
        </div>
      )}

      <Canvas>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <XR store={store}>
          <XrSessionSync onChange={setXrSessionActive} />
          <DomOverlayRootSync onChange={setDomOverlayRoot} />
          <IfInSessionMode allow="immersive-ar">
            
          {isLoading && (
  <Billboard position={[0, 1.4, -1.8]}  >
    <group>
      <RoundedBox args={[1.5, 0.4, 0.06]} radius={0.05}>
        <meshStandardMaterial color="#84b3b0" />
      </RoundedBox>

      <Text
        position={[0, 0.05, 0.04]}
        fontSize={0.08}
        color="#105c57"
        textAlign="center"
      >
        Einen Moment bitte…
      </Text>

      <Text
        position={[0, -0.15, 0.04]}
        fontSize={0.055}
        color="#105c57"
        textAlign="center"
      >
        Inhalte werden geladen
      </Text>
    </group>
  </Billboard>
)}

            {/* UI: Progress Board (nur zeigen wenn kein Spiel aktiv) */}
            { !showInfo && !showMemory && !showQuiz && !showPuzzle && (
              <>
                <IndexPage contentTypes={content_types} sceneData={scene} topicData={topic} />
                <Billboard position={[0, 1.2, -1.2]}>
                  <ProgressBoard collected={collectedBadges} />
                </Billboard>
              </>
            )}

            {/* UI: Badge Popup Animation */}
            {newBadgeText && !showInfo && (
              <Billboard position={[0, 1.5, -1.5]}>
                <group scale={[0.8, 0.8, 0.8]}>
                  <RoundedBox args={[1.8, 0.4, 0.05]} radius={0.05}><meshStandardMaterial color="#caedea" /></RoundedBox>
                  <Text position={[0, 0, 0.03]} fontSize={0.07} color="#326661" maxWidth={1.6} textAlign="center">{newBadgeText}</Text>
                </group>
              </Billboard>
            )}

            {/* Standort Interaktionen (Buttons) */}
            {activeLocation && !showQuiz && !showPuzzle && !showMemory && !showInfo && (
              <group position={[0, 1, -1.4]}>
                {canStartQuiz && (
                  <group position={[-0.6, 0.2, -1]}>
                    <RoundedBox args={[0.9, 0.32, 0.08]} radius={0.06} onPointerDown={() => setShowQuiz(true)}>
                      <meshStandardMaterial color={activeLocation.button?.color} />
                    </RoundedBox>
                    <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">{activeLocation.button?.label}</Text>
                  </group>
                )}

                {activeLocation.features?.puzzle && (
                  <group position={[0.6, 0.2, -1]}>
                    <RoundedBox args={[0.9, 0.32, 0.08]} radius={0.06} onPointerDown={() => setShowPuzzle(true)}>
                      <meshStandardMaterial color="#369e9e" />  {/* button farbe ändern dass beide button verschiedene farben haben*/}
                    </RoundedBox>
                    <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">Puzzle 🧩</Text>
                  </group>
                )}

                {/* Memory Button (Aktiviert wenn Feature im Location-Objekt oder ID Kitchen) */}
                {(activeLocation.features?.memory || activeLocation.id === "kitchen") && (
                  <group position={[0.6, 0.2, -1]}>
                    <RoundedBox args={[1.1, 0.32, 0.08]} radius={0.06} onPointerDown={() => setShowMemory(true)}>
                      <meshStandardMaterial color="#149085" />
                    </RoundedBox>
                    <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">Memory Spiel 🃏</Text>
                  </group>
                )}
              </group>
            )}

            {/* --- GAME OVERLAYS --- */}

            {/* QUIZ */}
            {showQuiz && quizData && (
              <QuizPlane 
                questions={quizData} 
                position={[0, 1, -1.7]} 
                onClose={(comp) => { 
                  setShowQuiz(false); 
                  if (comp && activeLocation) {
                    const id = activeLocation.infoId || activeLocation.id;
                    collectBadgeSilent(id, () => showBadgePopup(id));
                  }
                }} 
              />
            )}

            {/* PUZZLE */}
            {showPuzzle && activeLocation?.features?.puzzle && (
              <PuzzleWithBack 
                imageUrl={activeLocation.features.puzzle.image} 
                onBack={(comp) => { 
                  setShowPuzzle(false); 
                  if (comp && activeLocation) {
                    const id = activeLocation.infoId || activeLocation.id;
                    collectBadgeSilent(id, () => showBadgePopup(id));
                  }
                }} 
              />
            )}
            
            {/* MEMORY */}
            {showMemory && (
              <MemoryGame 
                onClose={(completed) => { 
                  setShowMemory(false); 
                  if (completed && activeLocation) { 
                    const badgeId = activeLocation.infoId || activeLocation.id;
                    collectBadgeSilent(badgeId, () => showBadgePopup(badgeId)); 
                  } 
                }} 
              />
            )}

            {/* INFO PLANES –*/}
{activeLocation?.infoId && !showQuiz && !showPuzzle && !showMemory && (
  <group position={[3, 0.5, -1]}>
    <InfoPlanes
      locationId={activeLocation.infoId}
      showInfo={showInfo}
      setShowInfo={setShowInfo}
    />
  </group>
)}
          </IfInSessionMode>
        </XR>
      </Canvas>

      <NavigationOverlayStateSync isArActive={xrSessionActive} />
      <NavigationModelProvider>
        <MiniMapPreview isArActive={inAR} portalRoot={navPortalRoot} />
        <NavigationOverlay portalRoot={navPortalRoot} showSessionWarning={inAR && !xrSessionActive} />
      </NavigationModelProvider>
    </NavigationOverlayProvider>
  );
}