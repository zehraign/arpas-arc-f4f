import { useEffect, useLayoutEffect, useMemo, useCallback, useState, useRef, type MouseEvent } from "react";
import { useXRInputSourceEvent, useXRStore, XRDomOverlay } from "@react-three/xr";
import * as THREE from "three";
import { Header, Footer, DirectionalArrow, HelpMenu, ObjectDescription } from "../../components-ui";
import { ContentTypesData } from "../../types/contentTypesData";
import { SceneData, ObjectData, VariantData } from "../../types/objectData";
import { TopicData } from "../../types/topicData";
import { ObjectScene } from "../../components";
import { useThree } from "@react-three/fiber";
import { Position, Rotation, Scale } from "../../types/transform";
import { getClosestObject, getIntersectedSceneObject, getObjectPosition } from "../../utility/objects";
import { Compass2D, Compass3D } from "../../components-ui/compass";
import "./style.css";
import useSceneStore from "../../store/sceneStore";
import { useMessageStore } from "../../store/messagesStore";
import { MinioData } from "../../types/databaseData";
import { useWorldRotation, useWorldPosition } from "../../hooks";
import { useCommentsStore } from "../../store/commentsStore";
import { useRatingStore } from "../../store/ratingStore";
import characterDialogs from "../../data/characterDialogs.json";
import { CharacterDialogMap } from "../../types/characterDialog";
import useLocationStore from "../../store/locationStore";
import { CharacterOverlay } from "../../components-ui";
import characterZones from "../../data/characterZones.json";


const debounce = (func: () => void, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(func, delay);
    };
};

const IndexPage = ({
    contentTypes,
    sceneData,
    topicData,
    minioData,
    overlayHidden = false,
}: {
    contentTypes: ContentTypesData;
    sceneData: SceneData;
    topicData: TopicData;
    minioData?: MinioData;
    overlayHidden?: boolean;
}) => {
    // XR objects and values
    const store = useXRStore();
    const { camera, ...state } = useThree();
    const { scene, setScene } = useSceneStore();
    const { messages, addScreenMessage, removeScreenMessage } = useMessageStore();
    const groundMesh = store.getState().groundMesh;
    const [minioClientData, setMinioClientData] = useState<MinioData | null>(null);

    const dialogContent: CharacterDialogMap = characterDialogs;

    const { getPosition, origin } = useLocationStore((state) => ({
        getPosition: state.getPosition,
        origin: state.origin,
    }));
    const [dialogKey, setDialogKey] = useState("default");
    const [characterLines, setCharacterLines] = useState(dialogContent.default?.lines ?? []);
    const [showCharacterOverlay, setShowCharacterOverlay] = useState(true);

    // UI values
    const fontSize = 22;
    const [isHelpVisible, setIsHelpVisible] = useState(false);
    const [showArHeader, setShowArHeader] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);

    // Location values
    const [worldPosition] = useWorldPosition(20, 2);
    //temporär:
    //const [worldPosition] = useState<Position>(new Position(0, 0, -2)); // Test-Stub
    const [fixedWorldPosition, setFixedWorldPosition] = useState<Position | null>(null);

    // Compass values
    const [compassPosition, setCompassPosition] = useState(camera?.position?.clone() ?? new THREE.Vector3(0, 0, 0));
    const [worldRotation] = useWorldRotation(camera);
    const [fixedWorldRotation, setFixedWorldRotation] = useState<number | null>(null);
    const positionFixedRef = useRef(false);
    const rotationFixedRef = useRef(false);
    const compassReadyRef = useRef(false);
    // no ground hit-test offset; keep GPS placement stable

    // Memoized camera position for ObjectScene
    const cameraPositionMemo = useMemo(() => camera?.position?.clone() ?? new THREE.Vector3(0, 0, 0), [worldPosition]);

    // Scene values
    const [selectedObject, setSelectedObject] = useState<number | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});

    const setCurrentVariant = useCallback((objectId: number, variantId: number) => {
        setSelectedVariants((prev) => ({ ...prev, [objectId]: variantId }));
    }, []);

    useEffect(() => {
        if (messages.some((m) => m.id === "compass_initialized")) {
            compassReadyRef.current = true;
        }
    }, [messages]);

    useEffect(() => {
        if (positionFixedRef.current) return;
        if (!origin || !worldPosition) return;
        if (worldPosition.length() < 0.1) return;
        setFixedWorldPosition(worldPosition.clone());
        positionFixedRef.current = true;
    }, [origin, worldPosition]);

    useEffect(() => {
        if (rotationFixedRef.current) return;
        if (!compassReadyRef.current) return;
        if (!Number.isFinite(worldRotation)) return;
        setFixedWorldRotation(worldRotation);
        rotationFixedRef.current = true;
    }, [worldRotation, messages]);

    // ground hit-test removed; keep original placement behavior

    const closestSceneObject = useMemo(() => {
        if (!scene.objects?.length) return null;
        return getClosestObject(worldPosition, scene.objects, selectedVariants, getPosition);
    }, [scene.objects, worldPosition, selectedVariants, getPosition]);

    const zonesWithPosition = useMemo(
        () => characterZones.map((z) => ({
            ...z,
            position: getPosition(z.geo.lat, z.geo.lon)
        })),
        [getPosition]
    );
    const currentZone = useMemo(() => {
        if (!worldPosition) return null;
        return zonesWithPosition.find((z) => worldPosition.distanceTo(z.position) <= z.geo.radiusM);
    }, [zonesWithPosition, worldPosition]);

    useEffect(() => {
        if (currentZone) {
            const zoneKey = currentZone.id;
            setDialogKey(dialogContent[zoneKey] ? zoneKey : "default");
            return;
        }
        const candidate =
            closestSceneObject?.sceneObject?.qr_id ||
            closestSceneObject?.sceneObject?.name ||
            (closestSceneObject?.sceneObject ? `object-${closestSceneObject.sceneObject.id}` : "default");
        setDialogKey(dialogContent[candidate] ? candidate : "default");
    }, [currentZone, closestSceneObject]);

    useEffect(() => {
        setCharacterLines(dialogContent[dialogKey]?.lines ?? dialogContent.default?.lines ?? []);
        setShowCharacterOverlay(true);
    }, [dialogKey]);

    // Apply data
    useEffect(() => {
        if (!contentTypes) {
            console.warn("No content types provided.");
            return;
        }

        if (!sceneData) {
            console.warn("No scene data provided to add object data.");
            return;
        }

        // Set content types
        useCommentsStore.getState().setVariantContentType(contentTypes.variant_content_type_id);
        useCommentsStore.getState().setCommentContentType(contentTypes.comments_content_type_id);
        useRatingStore.getState().setSceneContentType(sceneData.content_type);
        useRatingStore.getState().setVariantContentType(contentTypes.variant_content_type_id);
        useRatingStore.getState().setCommentContentType(contentTypes.comments_content_type_id);
        console.log("Content types set:", contentTypes);

        // Apply scene data
        setScene(sceneData);
        console.log("Scene data updated:", sceneData);
        const variants = sceneData.objects.reduce((acc, object) => {
            acc[object.id] = object.variants[0]?.id ?? null;
            return acc;
        }, {} as Record<number, number>);
        setSelectedVariants(variants);
        // setSelectedObject(sceneData.objects[0]?.id ?? null);
    }, [contentTypes, sceneData]);

    useEffect(() => {
        console.log('Topic data updated:', topicData);
    }, [topicData]);

    useEffect(() => {
        if (!minioData) return;
        setMinioClientData(minioData);
        console.log("Minio data set:", minioData);
    }, [minioData]);

    useEffect(() => {
        console.log('Scene objects:', scene.objects);
    }, [scene.objects]);

    // Update header height on mount and window resize
    useLayoutEffect(() => {
        const updateHeaderHeight = () => {
            const header = document.querySelector("#arc-header") as HTMLElement;
            if (header) {
                setHeaderHeight(header.offsetTop + header.offsetHeight);
            }
        };

        // Delay the calculation slightly to ensure the DOM is fully rendered
        setTimeout(updateHeaderHeight, 100);

        // Debounced update for resize events
        const debouncedUpdateHeaderHeight = debounce(updateHeaderHeight, 200);
        window.addEventListener("resize", debouncedUpdateHeaderHeight);
        return () => window.removeEventListener("resize", debouncedUpdateHeaderHeight);
    }, []);

    // Handle scene object selection
    useXRInputSourceEvent(
        "all",
        "selectstart",
        (event) => {
            if (overlayHidden || !scene) return;

            const selectedObjectId = getIntersectedSceneObject(event, { ...state, camera }, scene.objects);
            if (selectedObjectId) {
                setSelectedObject(selectedObjectId);
            }
        },
        [scene, overlayHidden]
    );

    // Update compass position if camera moves significantly
    useEffect(() => {
        const distance = compassPosition.distanceTo(camera.position);
        if (distance > 0.2) {
            setCompassPosition(camera.position.clone());
        }
    }, [camera.position.x, camera.position.z]);

    const handleOverlayClick = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (overlayHidden || event.defaultPrevented) return;
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (
                target.closest(
                    "button, a, input, textarea, select, [role='button'], [role='textbox'], [contenteditable='true'], .input-div, [data-no-header-toggle]"
                )
            ) {
                return;
            }
            setShowArHeader((prev) => !prev);
        },
        [overlayHidden]
    );

    return (
        <>
            <XRDomOverlay
                style={{ width: "100%", height: "100%", fontSize: `${fontSize}px`, boxSizing: "border-box" }}
                onClick={handleOverlayClick}
            >
                {!overlayHidden && (
                    <>
                        <div className="xr-message-stack">
                            {messages.map((msg) => (
                                <div key={msg.id} className="xr-loading-label py-2 px-3 fw-bold text-center" style={{ fontSize: `${fontSize * 0.8}px`, color: msg.color ?? "white" }}>
                                    {msg.text}
                                </div>
                            ))}
                        </div>

                        {/* Header */}
                        <div className={`ar-header${showArHeader ? " ar-header--visible" : ""}`}>
                            <Header
                                isHelpVisible={isHelpVisible}
                                onToggleHelp={() => setIsHelpVisible((v) => !v)}
                                onLeave={() => store.getState().session?.end()}
                                fontSize={fontSize}
                            />
                        </div>
                        <CharacterOverlay
                            lines={characterLines}
                            characterImageSrc={`${import.meta.env.BASE_URL}images/character/guide.png`}
                            isVisible={showCharacterOverlay}
                            onFinished={() => setShowCharacterOverlay(false)}
                        />


                        {/* Content */}
                        <div style={{ top: `${headerHeight}px` }}>
                            <Compass2D showCardinal={!fixedWorldPosition && !fixedWorldRotation} />
                            <div id="compass-container" style={{ background: "transparent" }}>
                                <button
                                    className={`compass-fix-btn${fixedWorldPosition && fixedWorldRotation ? " active" : ""}`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        if (fixedWorldPosition && fixedWorldRotation !== null) {
                                            setFixedWorldPosition(null);
                                            setFixedWorldRotation(null);
                                        } else {
                                            setFixedWorldPosition(worldPosition.clone());
                                            if (Number.isFinite(worldRotation)) {
                                                setFixedWorldRotation(worldRotation);
                                            }
                                        }
                                        positionFixedRef.current = true;
                                        rotationFixedRef.current = true;
                                    }}
                                >
                                    { }
                                </button>
                            </div>
                        </div>

                        <HelpMenu
                            isVisible={isHelpVisible}
                            onClose={() => setIsHelpVisible(false)}
                            onLeave={() => store.getState().session?.end()}
                            headerHeight={headerHeight}
                            fontSize={fontSize}
                        />

                        {selectedObject && (
                            <ObjectDescription
                                objectId={selectedObject}
                                variantId={selectedVariants[selectedObject]}
                                headerHeight={headerHeight}
                                setCurrentVariant={setCurrentVariant}
                                onClose={() => setSelectedObject(null)}
                                fontSize={fontSize}
                            />
                        )}

                        {/* Footer */}
                        {/* <Footer>
                            <small className="text-dark">Selected: {selectedObject ?? "None"}</small>
                            <small className="text-muted">Heading: {worldRotation.toFixed(2)} rad</small>
                        </Footer> */}

                        {/* Debugging box can be removed or kept */}
                        {/* <div
                            style={{
                                position: "absolute",
                                bottom: "10px",
                                left: "10px",
                                backgroundColor: "rgba(0, 0, 0, 0.7)",
                                color: "white",
                                padding: "10px",
                                borderRadius: "5px",
                                zIndex: 1000,
                            }}
                        >
                            <p>world rot: {worldRotation.toFixed(3)}</p>
                            <p>Selected Object: {selectedObject ?? "None"}</p>
                        </div> */}
                    </>
                )}
            </XRDomOverlay>

            {/* 3D Scene */}
            {scene && (
                <>
                    {!overlayHidden && (
                        <>
                            <ambientLight intensity={5} />
                            <directionalLight intensity={10} />
                            <Compass3D headingInRad={worldRotation} cameraPosition={compassPosition} />
                        </>
                    )}
                    <ObjectScene
                        selectedVariants={selectedVariants}
                        minioClientData={minioClientData}
                        worldRotation={fixedWorldRotation ?? worldRotation}
                        cameraPosition={cameraPositionMemo}
                        visible={!overlayHidden}
                    />
                </>
            )}
        </>
    );
};

export default IndexPage;
