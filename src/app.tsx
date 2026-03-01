import { XR, IfInSessionMode, createXRStore, useXR } from "@react-three/xr";
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

/*XR store mit hit test und Bodenerkennung*/
const store = createXRStore({
  controller: false,
  optionalFeatures: ["hit-test", "local-floor"],
});
// Lädt alle Quiz Dateien
const quizzes = (import.meta as any).glob("./data/*.json");

interface AppProps {
  content_types: ContentTypesData;
  scene: SceneData;
  topic: TopicData;
}

/* Billboard --> dreht UI Elemente zur Kamera, bleibt aber an der gleichen Stelle */
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
    // Dreht sich nur horizontal zur Kamera
    ref.current.lookAt(
      new THREE.Vector3(camera.position.x, ref.current.position.y, camera.position.z)
    );
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

/*
 SpawnInFrontOnKey
  Platziert ein Overlay einmalig vor der Kamera, wenn sich der spawnKey ändert
 --> genutzt für  Quiz/Puzzle/Memory Overlays, damit sie nicht "hinten" bleiben.
 */
function SpawnInFrontOnKey({
  spawnKey,
  offset = new THREE.Vector3(0, 0.05, -1.7),
  children,
}: {
  spawnKey: string;
  offset?: THREE.Vector3;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!ref.current) return;

    // Position relativ zur aktuellen Kamerarichtung berechnen
    const pos = offset.clone().applyQuaternion(camera.quaternion).add(camera.position);
    ref.current.position.copy(pos);
    // Overlay schaut zur Kamera
    ref.current.lookAt(camera.position.x, ref.current.position.y, camera.position.z);
  }, [spawnKey, camera, offset]);

  return <group ref={ref}>{children}</group>;
}

/*
  LocationUIAnchor
  Ein gemeinsamer Anker für Buttons, Badge-Leiste und Info Button
  --> Wird bei Ortswechsel neu vor dem Nutzer platziert
 */
function LocationUIAnchor({
  anchorKey,
  distance = 1.9, 
  height = 0.1,
  children,
}: {
  anchorKey: string;
  distance?: number;
  height?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (!ref.current) return;

     // Vorwärtsrichtung der Kamera bestimmen
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    
    // Position vor der Kamera berechnen
    const pos = new THREE.Vector3()
      .copy(camera.position)
      .add(forward.multiplyScalar(distance));

    pos.y += height;

    ref.current.position.copy(pos);
    // zur Kamera ausrichten
    ref.current.lookAt(camera.position.x, ref.current.position.y, camera.position.z);
  }, [anchorKey, camera, distance, height]);

  return <group ref={ref}>{children}</group>;
}


/* Sync Helpers 
--> halten React State und XR synchron */
// Schließt das Navigation Overlay automatisch, wenn AR nicht mehr aktiv ist
function NavigationOverlayStateSync({ isArActive }: { isArActive: boolean }) {
  const { close } = useNavigationOverlay();
  useEffect(() => {
    if (!isArActive) close();
  }, [isArActive, close]);
  return null;
}
// Gibt weiter, ob gerade eine XR Session läuft
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

/* Buttons für verschiedene Stationen
--> zeigt quiz, puzzle, memory Buttons, abängig von der Location an*/
type LocationInteractionButtonsProps = {
  activeLocation: any;
  canStartQuiz: boolean;
  showQuiz: boolean;
  showPuzzle: boolean;
  showMemory: boolean;
  showInfo: boolean;
  setShowQuiz: (value: boolean) => void;
  setShowPuzzle: (value: boolean) => void;
  setShowMemory: (value: boolean) => void;
};

function LocationInteractionButtons({
  activeLocation,
  canStartQuiz,
  showQuiz,
  showPuzzle,
  showMemory,
  showInfo,
  setShowQuiz,
  setShowPuzzle,
  setShowMemory,
}: LocationInteractionButtonsProps) {
  const { isOpen } = useNavigationOverlay();

  const handleStartInteraction = (type: "quiz" | "puzzle" | "memory") => {
    // Solange das Navigations Overlay offen ist, keine Interaktion starten
    if (isOpen) return;
    if (type === "quiz") setShowQuiz(true);
    if (type === "puzzle") setShowPuzzle(true);
    if (type === "memory") setShowMemory(true);
  };
// Buttons nur zeigen, wenn eine Location aktiv ist und gerade kein anderes Overlay offen ist
  if (!activeLocation || showQuiz || showPuzzle || showMemory || showInfo) return null;

  return (
    <group>
      {/* Quiz Button */}
      {canStartQuiz && (
        <group position={[-0.6, 0.2, 0]}>
          <RoundedBox
            args={[0.9, 0.32, 0.08]}
            radius={0.06}
            onPointerDown={() => handleStartInteraction("quiz")}
          >
            <meshStandardMaterial color={activeLocation.button?.color} />
          </RoundedBox>
          <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">
            {activeLocation.button?.label}
          </Text>
        </group>
      )}

      {/* Puzzle Button */}
      {activeLocation.features?.puzzle && (
        <group position={[0.6, 0.2, 0]}>
          <RoundedBox
            args={[0.9, 0.32, 0.08]}
            radius={0.06}
            onPointerDown={() => handleStartInteraction("puzzle")}
          >
            <meshStandardMaterial color={activeLocation.button?.color} />
          </RoundedBox>
          <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">
            Puzzle 🧩
          </Text>
        </group>
      )}

      {/* Memory Button --> auf der gleichen Position wie Puzzle, da sie an verschiedenen Locations sind */}
      {(activeLocation.features?.memory || activeLocation.id === "kitchen") && (
        <group position={[0.6, 0.2, 0]}>
          <RoundedBox
            args={[1.1, 0.32, 0.08]}
            radius={0.06}
            onPointerDown={() => handleStartInteraction("memory")}
          >
            <meshStandardMaterial color="#086159" />
          </RoundedBox>
          <Text position={[0, 0, 0.06]} fontSize={0.065} color="white">
            Memory Spiel 🃏
          </Text>
        </group>
      )}
    </group>
  );
}

/*Hauptkomponente*/
export default function App({ content_types, scene, topic }: AppProps) {
  /* UI States */
  const [inAR, setInAR] = useState(false);
  const [xrSessionActive, setXrSessionActive] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* Game/Location States */
  const [activeLocation, setActiveLocation] = useState<any | null>(null);
// Refs speichern den letzten bekannten Zustand
  const activeLocationRef = useRef<any | null>(null);
  const lastLocationIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeLocationRef.current = activeLocation;
  }, [activeLocation]);

  /*Interaktions States*/
  const [quizData, setQuizData] = useState<any[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [canStartQuiz, setCanStartQuiz] = useState(false);

  // Solange ein großes Overlay offen ist, werden andere UI Elemente versteckt
  const isOverlayHidden = showInfo || showMemory || showQuiz || showPuzzle;

  useEffect(() => {
    // Sobald Spiel-Overlay geöffnet wird, InfoPlanes schließen
    if (showQuiz || showPuzzle || showMemory) setShowInfo(false);
  }, [showQuiz, showPuzzle, showMemory]);

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
    // Badge nur einmal sammeln
    if (!id || collectedBadges.includes(id)) return;
    setCollectedBadges((p) => [...p, id]);
    callback?.();
  };

  const showBadgePopup = (locationId: string) => {
    // Popup pro Location nur einmal zeigen
    if (!locationId || shownBadgePopups.includes(locationId)) return;
    const count = collectedBadges.length + 1;
    const message = // Unterschiedlicher Text je nach Anzahl gesammelter Badges
      count === 1
        ? "Glückwunsch! Dein erstes Badge 🎉"
        : count === 5
        ? "WOW! Alle Badges gesammelt! ⭐ Master Explorer!"
        : `Super! Dein ${count}. Badge!`;
    setNewBadgeText(message);
    setShownBadgePopups((prev) => [...prev, locationId]);
    if (badgeTimeout.current) clearTimeout(badgeTimeout.current);
    badgeTimeout.current = setTimeout(() => setNewBadgeText(null), 6000);
  };

  /*AR Starten*/
  const handleEnterAR = async () => {
    try {
      await store.enterAR();
      setInAR(true);
    } catch (error) {
      console.warn("XR session konnte nicht gestartet werden:", error);
    }
  };

  /* Startscreen Animation */
  const base = import.meta.env.BASE_URL;
  const frames = useMemo( // Alle Animationsframes des Start-Charakters vorberechnen
    () =>
      Array.from(
        { length: 10 },
        (_, i) => `${base}start/character/frame_${String(i + 1).padStart(2, "0")}.PNG`
      ),
    [base]
  );
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (inAR) return; // solange man auf der Startseite ist, Charakter animieren
    const id = setInterval(() => setFrameIndex((p) => (p + 1) % 10), 160);
    return () => clearInterval(id);
  }, [inAR]);

  /* GeoLocation Logik
  --> Erkennt welche Location gerade aktiv ist */
  useEffect(() => {
    if (!inAR) return;

    const EXIT_MARGIN = 1.5;
    const SWITCH_ADVANTAGE = 1.5; // Neue Location muss deutlich näher sein

    let cancelled = false;
    setIsLoading(true);

    const pickLocation = (lat: number, lon: number, current: any | null) => {
      // Distanzen zu allen bekannten Quiz Locations berechnen
      const items = quizLocations
        .map((loc) => ({
          loc,
          dist: distanceInMeters(lat, lon, loc.coords.lat, loc.coords.lon),
        }))
        .sort((a, b) => a.dist - b.dist);

      const closest = items[0];
      if (!closest) return null;

      if (current) {
        // Wenn man noch innerhalb der aktuellen Zone ist, dort bleiben
        const currentDist = distanceInMeters(lat, lon, current.coords.lat, current.coords.lon);
        if (currentDist < current.radius + EXIT_MARGIN) return current;

        // Nur wechseln, wenn die neue Location deutlich näher ist
        if (closest.dist < closest.loc.radius && closest.dist + SWITCH_ADVANTAGE < currentDist) {
          return closest.loc;
        }
        return null;
      }
// Ohne aktuelle Location--> nur aktivieren, wenn man im Radius ist
      return closest.dist < closest.loc.radius ? closest.loc : null;
    };
 
     // Beobachtet laufend die aktuelle GPS-Position
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        if (cancelled) return;

        const { latitude, longitude } = pos.coords;

        const current = activeLocationRef.current;
        const found = pickLocation(latitude, longitude, current);

// Keine gültige Location gefunden
        if (!found) {
          lastLocationIdRef.current = null;
          setActiveLocation(null);
          setQuizData(null);
          setCanStartQuiz(false);
          setIsLoading(false);
          return;
        }

        // Gleiche Location wie vorher --> nichts neu laden
        if (found.id === lastLocationIdRef.current) {
          setIsLoading(false);
          return;
        }
        // Neue Location aktiv
        lastLocationIdRef.current = found.id;
        // Alle offenen Overlays schließen
        setShowQuiz(false);
        setShowPuzzle(false);
        setShowMemory(false);
        setShowInfo(false);

        setActiveLocation(found);
        setQuizData(null);
        setCanStartQuiz(false);
        setIsLoading(true);

        // Falls diese Location ein Quiz hat --> Quizdaten laden
        if (found.features?.quiz) {
          const quizPath = `./data/${found.features.quiz.file}`;
          const loader = quizzes[quizPath];
          if (loader) {
            try {
              const data = await loader();
              if (cancelled) return;

              // Nur übernehmen, wenn immer noch dieselbe Location aktiv ist
              if (lastLocationIdRef.current === found.id) {
                setQuizData(data.default);
                setCanStartQuiz(true);
              }
            } catch (e) {
              console.warn("Quiz laden fehlgeschlagen:", e);
            }
          }
        }

        setIsLoading(false);
      },
      (err) => {
        console.warn("Geolocation Fehler:", err);
        if (!cancelled) setIsLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 500, timeout: 10000 }
    );

    // Cleanup beim Verlassen oder Neuladen
    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [inAR]);

  useEffect(() => {
    if (!xrSessionActive || !domOverlayRoot) {
      setDomOverlayReady(false);
      return;
    }
    setDomOverlayReady(true);
  }, [xrSessionActive, domOverlayRoot]);

  /*RENDER*/
  return (
    <NavigationOverlayProvider>
      {!inAR && ( /*Startseite*/
        <div className="startscreen">
          <img className="startscreen__bg" src={`${base}start/background.PNG`} alt="" />
          <div className="startscreen__text">
            <div className="startscreen__title">Willkommen beim AR Campus Guide</div>
            <div className="startscreen__subtitle">
              Tippe auf START, um in den AR Modus zu wechseln.
            </div>
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
          <div className="startscreen__credits">
            Zukunftsbild „Agrarsysteme der Zukunft“. (S. Fleischmann, P. Albers, M. Schreiner)
          </div>
        </div>
      )}

     {/*3D szene*/}
      <Canvas>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <XR store={store}>
          {/* Synchronisiert XR-Zustände mit React-State */}
          <XrSessionSync onChange={setXrSessionActive} />
          <DomOverlayRootSync onChange={setDomOverlayRoot} />

          <IfInSessionMode allow="immersive-ar">
            {/* Loading Anzeige */}
            {isLoading && (
              <Billboard position={[0, 1.4, -1.8]}>
                <group>
                  <RoundedBox args={[1.5, 0.4, 0.06]} radius={0.05}>
                    <meshStandardMaterial color="#84b3b0" />
                  </RoundedBox>
                  <Text position={[0, 0.05, 0.04]} fontSize={0.08} color="#105c57" textAlign="center">
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

            {/* Model/IndexPage */}
            <IndexPage
              contentTypes={content_types}
              sceneData={scene}
              topicData={topic}
              overlayHidden={isOverlayHidden}
            />

            {/* Badge Popup */}
            {newBadgeText && !showInfo && (
              <Billboard position={[0, 1.5, -1.5]}>
                <group scale={[0.8, 0.8, 0.8]}>
                  <RoundedBox args={[1.8, 0.4, 0.05]} radius={0.05}>
                    <meshStandardMaterial color="#caedea" />
                  </RoundedBox>
                  <Text
                    position={[0, 0, 0.03]}
                    fontSize={0.07}
                    color="#326661"
                    maxWidth={1.6}
                    textAlign="center"
                  >
                    {newBadgeText}
                  </Text>
                </group>
              </Billboard>
            )}

            {/* Location UI */}
            {activeLocation && (
              <LocationUIAnchor anchorKey={activeLocation.id} distance={1.9} height={0.1}>
                {/* Badge-Leiste*/}
                {!isOverlayHidden && (
                  <group position={[0, 0.55, 0]}>
                    <ProgressBoard collected={collectedBadges} />
                  </group>
                )}

                {/* Buttons */}
                <LocationInteractionButtons
                  key={activeLocation.id}
                  activeLocation={activeLocation}
                  canStartQuiz={canStartQuiz}
                  showQuiz={showQuiz}
                  showPuzzle={showPuzzle}
                  showMemory={showMemory}
                  showInfo={showInfo}
                  setShowQuiz={setShowQuiz}
                  setShowPuzzle={setShowPuzzle}
                  setShowMemory={setShowMemory}
                />

                {/* Info Button/Planes*/}
                {activeLocation.infoId && !showQuiz && !showPuzzle && !showMemory && (
                  <group position={[1.4, 0.05, -0.05]}>
                    <InfoPlanes
                      locationId={activeLocation.infoId}
                      showInfo={showInfo}
                      setShowInfo={setShowInfo}
                    />
                  </group>
                )}
              </LocationUIAnchor>
            )}

            {/*GAME OVERLAYS*/}

            {/* QUIZ */}
            {showQuiz && quizData && activeLocation && (
              <SpawnInFrontOnKey
                spawnKey={`${activeLocation.id}-quiz-open`}
                offset={new THREE.Vector3(0, 0.05, -1.7)}
              >
                <QuizPlane
                  questions={quizData}
                  position={[0, 0, 0]}
                  onClose={(comp) => {
                    setShowQuiz(false);
                    if (comp && activeLocation) { // Bei Erfolg Badge vergeben
                      const id = activeLocation.infoId || activeLocation.id;
                      collectBadgeSilent(id, () => showBadgePopup(id));
                    }
                  }}
                />
              </SpawnInFrontOnKey>
            )}

            {/* PUZZLE */}
            {showPuzzle && activeLocation?.features?.puzzle && (
              <SpawnInFrontOnKey
                spawnKey={`${activeLocation.id}-puzzle-open`}
                offset={new THREE.Vector3(0, 0.05, -1.7)}
              >
                <PuzzleWithBack
                  imageUrl={activeLocation.features.puzzle.image}
                  onBack={(comp) => {
                    setShowPuzzle(false);
                    if (comp && activeLocation) { // Bei Erfolg Badge vergeben
                      const id = activeLocation.infoId || activeLocation.id;
                      collectBadgeSilent(id, () => showBadgePopup(id));
                    }
                  }}
                />
              </SpawnInFrontOnKey>
            )}

            {/* MEMORY */}
            {showMemory && activeLocation?.id === "kitchen" && (
            <MemoryGame
              onClose={(completed) => {
                setShowMemory(false);
                if (completed && activeLocation) { // Bei Erfolg Badge vergeben
                  const badgeId = activeLocation.infoId || activeLocation.id;
                  collectBadgeSilent(badgeId, () => showBadgePopup(badgeId));
      }
    }}
  />
)}
    {/* Navigation overlay DOM */}
          </IfInSessionMode>
        </XR>
      </Canvas>

      <NavigationOverlayStateSync isArActive={xrSessionActive} />
      <NavigationModelProvider>
        <MiniMapPreview isArActive={inAR} portalRoot={navPortalRoot} hidden={isOverlayHidden} />
        <NavigationOverlay
          portalRoot={navPortalRoot}
          showSessionWarning={inAR && !xrSessionActive}
        />
      </NavigationModelProvider>
    </NavigationOverlayProvider>
  );
}
