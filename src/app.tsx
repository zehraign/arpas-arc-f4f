import { XR, IfInSessionMode, createXRStore, useXR } from "@react-three/xr";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useState, useRef, useMemo } from "react";
import * as THREE from "three";
import QuizPlane from "./components/QuizPlane";
import PuzzleWithBack from "./components/PuzzleWithBack";
import IndexPage from "./pages/index";
import InfoPlanes from "./components/InfoPlane";
import NavigationOverlay from "./navigation/NavigationOverlay";
import MiniMapPreview from "./navigation/MiniMapPreview";
import { NavigationModelProvider } from "./navigation/NavigationModelContext";
import { NavigationOverlayProvider, useNavigationOverlay } from "./navigation/NavigationOverlayContext";

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

function NavigationOverlayStateSync({ isArActive }: { isArActive: boolean }) {
    const { close } = useNavigationOverlay();

    useEffect(() => {
        if (!isArActive) {
            close();
        }
    }, [isArActive, close]);

    return null;
}

function XrSessionSync({ onChange }: { onChange: (active: boolean) => void }) {
    const session = useXR((state) => state.session);

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
    const [xrSessionActive, setXrSessionActive] = useState(false);
    const [domOverlayRoot, setDomOverlayRoot] = useState<Element | null>(null);
    const inARMode = inAR;
    const [domOverlayReady, setDomOverlayReady] = useState(false);
    const navPortalRoot = xrSessionActive && domOverlayReady ? domOverlayRoot : null;

    /* ENTER AR */
    const handleEnterAR = async () => {
        setInAR(true);
        try {
            await store.enterAR();
        } catch (error) {
            console.warn("XR session konnte nicht gestartet werden:", error);
        }
    };
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
            {/* START UI (NICHT AR) */}
            {!inAR && (
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

                </div>
            )}

            {/* AR CANVAS */}
            <Canvas
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 0,
                }}
            >
                <XR store={store}>
                    <XrSessionSync onChange={setXrSessionActive} />
                    <DomOverlayRootSync onChange={setDomOverlayRoot} />
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

            <NavigationOverlayStateSync isArActive={inARMode} />
            {inARMode && (
                <NavigationModelProvider>
                    <MiniMapPreview isArActive={inARMode} portalRoot={navPortalRoot} />
                    <NavigationOverlay
                        portalRoot={navPortalRoot}
                        showSessionWarning={inARMode && !xrSessionActive}
                    />
                </NavigationModelProvider>
            )}
        </NavigationOverlayProvider>
    );
}
