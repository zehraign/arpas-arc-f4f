import { GroupProps, useFrame, useThree } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { useState, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

const IMAGE_WIDTH = 1.4 
const IMAGE_HEIGHT = 0.95

const INFO_PLANE_OFFSET_X = IMAGE_WIDTH + 0.2; // Abstand Info-Plane
const GALLERY_SCALE = 1.25;  

// --> Sphärische Bild-Positionen  
const IMAGE_RADIUS = 4;        
const IMAGE_BASE_Y = 1;       
const IMAGE_Y_VARIATION = 0.35;  

const getSphericalImagePositions = (count: number) =>
  Array.from({ length: count }).map((_, i) => {
    const a = (i / count) * Math.PI * 2;
    return [
      Math.sin(a) * IMAGE_RADIUS,
      IMAGE_BASE_Y + Math.sin(a * 2) * IMAGE_Y_VARIATION,
      Math.cos(a) * IMAGE_RADIUS,
    ] as [number, number, number];
  });

const GALLERY_RADIUS_IMAGES = 2.6;
const GALLERY_BASE_Y = 1.3;
const GALLERY_Y_VARIATION = 0.35;

// PRELOAD HOOK

export function usePreloadTextures(urls: string[]) {
  const [textures, setTextures] = useState<THREE.Texture[]>([]);

  useEffect(() => {
    let mounted = true;
    const loader = new THREE.TextureLoader();

    Promise.all(
      urls.map(
        (url) =>
          new Promise<THREE.Texture>((resolve, reject) => {
            loader.load(
              url,
              (tex) => resolve(tex),
              undefined,
              (err) => reject(err)
            );
          })
      )
    )
      .then((texs) => {
        if (mounted) setTextures(texs);
      })
      .catch((err) => console.error("Texture loading failed", err));

    return () => {
      mounted = false;
    };
  }, [urls]);

  return textures;
}

// Farben für jeden Standort
const infoPlaneColors: Record<string, string> = {
  grillen: "#e8a054",
  kitchen: "#2BB0A6",
  algen: "#6ceb73",
  quallen: "#369e9e",
  salzpflanzen: "#92bf5c",
};

//   INFO CONTENT
const infoContent: Record<string, { title: string; content: string[] }[]> = {
  algen: [
    { title: "Warum Algen?", content: ["Wachsen sehr schnell", "Brauchen kaum Ackerland, Süßwasser oder Dünger", "Schonend für Umwelt und Klima"] },
    { title: "Wachstumsbedingungen", content: ["Benötigen Licht, Wasser und Nährstoffe", "Können kontrolliert gezüchtet werden"] },
    { title: "Wichtige Inhaltsstoffe", content: ["Enthalten Eiweiß, Vitamine und Omega-3-Fettsäuren", "Liefern wichtige Nährstoffe für den Menschen"] },
    { title: "Indoor-Kultivierung", content: ["Unabhängig von Wetter und Jahreszeiten", "Kein Ackerland notwendig", "Produktion fast überall möglich", "optimalen wachstum garantieren "] }, 
    { title: "Grünalgen im Fokus", content: ["Ca. 25 % Eiweiß", "Gute pflanzliche Proteinquelle"] },
    { title: "Besondere Vitamine", content: ["Enthalten Beta-Carotin", "Vorstufe von Vitamin A", "Wichtig für Augen, Haut und Immunsystem"] },
  ],
  grillen: [
    { title: "Warum Grillen?", content: ["Wachsen schnell", "Brauchen wenig Platz und Ressourcen", "Schonend für Umwelt und Klima"] },
    { title: "Stadtfreundlich", content: ["Brauchen nur wenig Platz und Futter", "Einfach in städtischen Umgebungen züchtbar"] },
    { title: "Proteinreich", content: ["Enthalten viel Eiweiß", "Gute pflanzliche Alternative zu Fleisch"] },
    { title: "Klimafreundlich", content: ["Stoßen deutlich weniger CO₂ aus als Rinder oder Schweine", "Effiziente Nahrungsquelle"] },
    { title: "Proteingehalt", content: ["Ca. 60 % Eiweiß", "Hohe Proteinqualität für menschliche Ernährung"] },
  ],
  kitchen: [
    { title: "Was ist Future Food?", content: ["Nachhaltig erzeugte Lebensmittel der Zukunft in der Stadt", "Neue Nahrungsquellen für wachsende Weltbevölkerung:", " Makroalgen, Quallen, Salzpflanzen, Grillen"] },
    { title: "Warum Insekten?", content: ["Proteinreich", "Umweltfreundlich und nachhaltig züchtbar", "Alternative zu Fleisch"] },
    { title: "Ziele nachhaltiger Ernährung", content: ["Gesunde Lebensmittel für alle Menschen", "Ressourcenschonend produzieren", "Weniger Lebensmittelverschwendung"] },
    { title: "Produktion in Städten", content: ["Kürzere Transportwege", "Weniger Ressourceneinsatz", "Effiziente Nutzung urbaner Räume"] },
    { title: "Queller-Pesto Zutaten:", content: ["100 g Queller", "80 g Cashewbruch", " 100 g Parmesan", " Olivenöl (nach Bedarf)", " Salz & Pfeffer (nach Geschmack)", " Frischer Zitronensaft"] },  
    { title: "Innerhalb planetarer Grenzen", content: ["Umwelt wird geschont", "Ressourcen werden nicht überlastet", "Produktion bleibt nachhaltig"] },
  ],
  salzpflanzen: [
    { title: "Was sind Salzpflanzen?", content: ["Halophyten: Pflanzen, die auf salzigen Böden wachsen können", "Anpassungsfähig an salzhaltige Umgebungen"] },
    { title: "Warum wichtig für die Zukunft?", content: ["Brauchen kein Frischwasser", "Können in Regionen wachsen, wo andere Pflanzen nicht gedeihen"] },
    { title: "Natürlicher Lebensraum", content: ["Küstenregionen", "Salzwiesen und Brackwassergebiete"] },
    { title: "Besondere Eigenschaften", content: ["Entziehen dem Boden Salz und machen ihn nutzbar", "Überleben auch in salzigen Böden"] },
    { title: "Bedeutung für Küstenregionen", content: ["Liefert Nahrung auf salzigem Boden", "Unterstützt nachhaltige Landwirtschaft"] },
  ],
  quallen: [
    { title: "Wichtige Nährstoffe", content: ["Liefert Proteine, Omega-3-Fettsäuren und Vitamine"] },
    { title: "Warum Mangrovenquallen?", content: ["Neue, nachhaltige Proteinquelle", "Einfach in modularen Indoor-Anlagen züchtbar"] },
    { title: "Rolle der Mikroalgen", content: ["Liefern Energie über Photosynthese", "Unterstützen das Wachstum der Quallen"] },
    { title: "Lebensraum und Bedingungen", content: ["Flache Gewässer mit Mikroalgen", "Ideal für Indoor-Kultivierung"] },
    { title: "Symbiose", content: ["Zusammenleben mit Mikroalgen", "Fördert effizientes Wachstum"] },
    { title: "Bedeutung für die Zukunft", content: ["Ressourcenschonende Lebensmittelproduktion", "Alternative zu herkömmlichen tierischen Proteinquellen"] },
  ],
};

//   BUTTON TEXTUREN
const buttonTextures: Record<string, string> = {
  quallen: "/static/textures/qualli.png",
  grillen: "/static/textures/grille.png",
  algen: "/static/textures/alge.png",
  kitchen: "/static/textures/kitchen.png",
  salzpflanzen: "/static/textures/salzpflanze.png",
};

// BILDER PRO STANDORT
const locationImages: Record<string, string[]> = {
  quallen: [
    "/static/images/Qualle/Qualle1.png",
    "/static/images/Qualle/Qualle2.png",
    "/static/images/Qualle/Qualle3.png",
    "/static/images/Qualle/Qualle4.png",
    "/static/images/Qualle/Qualle5.png",
    "/static/images/Qualle/Qualle6.png",
  ],
  salzpflanzen: [
    "/static/images/salzpflanzen/SP2.png",
    "/static/images/salzpflanzen/SP3.png",
    "/static/images/salzpflanzen/SP4.png",
    "/static/images/salzpflanzen/SP5.png",
    "/static/images/salzpflanzen/SP6.png",
  ],
  algen: [
    "/static/images/algen/alge1.png",
    "/static/images/algen/alge2.png",
    "/static/images/algen/alge3.png",
    "/static/images/algen/alge4.png",
    "/static/images/algen/alge5.png",
    "/static/images/algen/alge6.png",
  ],
  kitchen: [
    "/static/images/kitchen/k1.png",
    "/static/images/kitchen/k3.png",
    "/static/images/kitchen/k4.png",
    "/static/images/kitchen/k5.png",
    "/static/images/kitchen/k7.png",
    "/static/images/kitchen/k8.png",
  ],
  grillen: [
    "/static/images/grillen/grille1.png",
    "/static/images/grillen/grille2.png",
    "/static/images/grillen/grille3.png",
    "/static/images/grillen/grille4.png",
    "/static/images/grillen/grille5.png",
  ],
};

//   Pulsierende Bilder pro Standort 
const pulsatingImages: Record<string, number[]> = {
  quallen: [0,1, 2, 3, 4,5  ],
  algen: [0,1,2, 3,4, 5, ],
  grillen: [0, 1, 2,3, 4],
  kitchen: [0,1,2, 3, 4,5],
  salzpflanzen: [0, 1,2, 3,4 ],
};

//  Bildunterschriften pro Standort 
const locationCaptions: Record<string, string[]> = {
  quallen: [" Mangrovenqualle, Raimond Spekking", " Mangrovenqualle, iStock", " Mangrovenqualle, Sina Schuldt", " Mangrovenquallen, Ali Ghandtschi", "Mangrovenquallen,  Ali Ghandtschi", "Mangrovenquallen, Ali Ghandtschi",],
  salzpflanzen: ["Queller, M.Fitzner", "Halophyten, S.Baldermann", " Halophyten im Gewaechshaus, S.Baldermann", "Halophyten im Gewaechshaus, S.Baldermann", "Queller im Frühjahr, Ulrike Graeber",], 
  algen: ["Rinnensystem, S.Pophal", "Algen Tonneninhalt, Algen, S.Pophal", " Algen-Tanks, S.Pophal", "Probeentnahme Algen, S.Pophal", "Probeentnahme Algen, S.Pophal", "Erster Tag Algenkultivierung, f4f ",  ],
  kitchen: ["Algenkekse, Jette Berend ", "Grillen-Pancakes, Jette Berend ", "Salzpflanzen (Queller) Dip mit veganem Lax, Jette Berend", "Quallen-Avocado-Salat, Jette Berend", " Vollkornspaghetti Queller Pesto, Julia Vogt", " Dulse, Julia Vogt",],
  grillen: ["Grille, f4f ", "Grillen, Jonah Duderstädt", "Grille, Jonah Duderstädt", "Insektenkultivierung im Detail , Jonah Duderstädt", "Hausgrillen,  Martin Rücker "], 
};

//   Bild-Button (Billboard)
function ImageButton({ texturePath, onClick }: { texturePath: string; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const texture = useTexture(texturePath);

  useFrame(({ clock }) => {
    if (!ref.current) return;

    // Pulsierende Skalierung
    const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.1;
    ref.current.scale.set(scale, scale, 1);

    // Blick zur Kamera
    ref.current.lookAt(camera.position.x, ref.current.position.y, camera.position.z);
  });

  return (
    <mesh ref={ref} onPointerDown={onClick}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

//  InfoPlanes Component (feste Weltpositionen)
interface InfoPlanesProps extends GroupProps {
  locationId: string;
  showInfo: boolean;
  setShowInfo: (v: boolean) => void;
}

export default function InfoPlanes({
  locationId,
  showInfo,
  setShowInfo,
  ...props
}: InfoPlanesProps) {
  const planes = infoContent[locationId] || [];
  const texturePath = buttonTextures[locationId];
  const images = locationImages[locationId] || [];
  const textures = usePreloadTextures(images);
  const positions = useMemo(
    () => getSphericalImagePositions(textures.length),
    [textures.length]
  );

  const [activeInfoIndices, setActiveInfoIndices] = useState<number[]>([]);
  const imagePlaneRefs = useRef<THREE.Group[]>([]);
  const introPlaneRef = useRef<THREE.Group>(null);
  const imageOnlyRefs = useRef<THREE.Group[]>([]); // NUR Bild pulsiert


  const { camera } = useThree();

useFrame(() => {
  if (!introPlaneRef.current) return;

  introPlaneRef.current.lookAt(
    camera.position.x,
    introPlaneRef.current.position.y, // nur horizontal drehen
    camera.position.z
  );
});

useFrame(() => {
  imagePlaneRefs.current.forEach((plane) => {
    if (!plane) return;

    // Blick zur Kamera, nur horizontal
    plane.lookAt(camera.position.x, plane.position.y, camera.position.z);
  });
});

  // Pulsierende Animation für Bilder
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const active = pulsatingImages[locationId] || [];

    active.forEach((index) => {
      const card = imageOnlyRefs.current[index]; // nur bild pulsiert hier 
      if (!card) return;
      const pulse = 1 + Math.sin(time * 2) * 0.06;
      card.scale.set(pulse, pulse, 1);
    });
  });

  // Ladeanzeige, falls Texturen noch nicht fertig
  if (showInfo && textures.length !== images.length) {
    return (
      <group>
        <Text fontSize={0.45} color="white" anchorX="center" anchorY="middle">
          Bilder werden geladen...
        </Text>
      </group>
    );
  }


  return (
    <group {...props}>
      {/* ================= Standort Button  ================= */}
      {!showInfo && texturePath && (
        <group position={[0, 1.6, -2]}>
          <ImageButton texturePath={texturePath} onClick={() => setShowInfo(true)} />
        </group>
      )}


      {/* ================= InfoGalerie ================= */}
      {showInfo && (
  <group position={[0, -0.4, 0]} scale={GALLERY_SCALE}>
          {/* Intro Plane zur Kamera */}
          <group
  ref={introPlaneRef}
  position={[0, 2.5, -4.2]}>  

            <RoundedBox args={[2.5, 0.8, 0.06]} radius={0.05}>
              <meshStandardMaterial
                color={infoPlaneColors[locationId] || "#2B4E4C"}
                roughness={0.6}
                metalness={0.1}
              />
            </RoundedBox>

            <Text
              position={[0, 0.0, 0.04]}
              fontSize={0.09}
              color="white"
              anchorX="center"
              anchorY="middle"
              material-toneMapped={false}
              maxWidth={2.3}
              textAlign="center"
            >
              Lerne hier etwas Neues – tippe auf die Bilder und entdecke spannende Infos!
            </Text>

            {/* X-Button */}
            <group position={[1.15, 0.35, 0.04]}>
              <RoundedBox
                args={[0.4, 0.4, 0.06]}
                radius={0.05}
                onPointerDown={() => setShowInfo(false)}
              >
                <meshStandardMaterial color="#e86966" />
              </RoundedBox>
              <Text
                position={[0, 0, 0.07]}
                fontSize={0.14}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                X
              </Text>
            </group>
          </group>


          {/* ================= Bilder im Raum ================= */}
          {textures.map((tex, i) => {
            const pos = positions[i];
            const caption = locationCaptions[locationId]?.[i] || "AUTOR";
            const planeInfo = planes[i] || { title: "HINZUFÜGEN", content: [] };

            return (
    <group
      key={i}
      position={pos} // Sphärische Position
      ref={(el) => {
        if (!el) return;
        imagePlaneRefs.current[i] = el;
      }}
    >

{/* Diese Gruppe pulsiert (NUR Bild + Caption + Rahmen) */}
<group
  ref={(el) => {
    if (!el) return;
    imageOnlyRefs.current[i] = el; // ✅ nur diese Gruppe wird skaliert
  }}
  onPointerDown={() => {
    setActiveInfoIndices((prev) =>
      prev.includes(i)
        ? prev.filter((index) => index !== i)
        : [...prev, i]
    );
  }}
>
  {/* Hintergrundrahmen */}
  <RoundedBox args={[IMAGE_WIDTH + 0.08, IMAGE_HEIGHT + 0.08, 0.04]} radius={0.04}>
    <meshStandardMaterial
      color={infoPlaneColors[locationId] || "#2B4E4C"}
      roughness={0.6}
      metalness={0.1}
    />
  </RoundedBox>

  {/* Bild */}
  <mesh position={[0, 0, 0.03]}>
    <planeGeometry args={[IMAGE_WIDTH, IMAGE_HEIGHT]} />
    <meshStandardMaterial map={tex} transparent toneMapped={false} />
  </mesh>

  {/* Bildunterschrift */}
  <Text
    position={[0, -(IMAGE_HEIGHT / 2 + 0.08), 0.04]}
    fontSize={0.055}
    color="white"
    anchorX="center"
    anchorY="top"
    material-toneMapped={false}
    maxWidth={IMAGE_WIDTH}
    textAlign="center"
  >
    {caption}
  </Text>
</group>


                  {/* Info-Box */}
                  {activeInfoIndices.includes(i) && (
                   <group position={[INFO_PLANE_OFFSET_X, 0, 0]}>
                      <RoundedBox args={[IMAGE_WIDTH + 0.08, IMAGE_HEIGHT + 0.08, 0.06]} radius={0.04}>
                        <meshStandardMaterial
                          color={infoPlaneColors[locationId] || "#2B4E4C"}
                          roughness={0.6}
                          metalness={0.1}
                        />
                      </RoundedBox>

                      

                      <group position={[0, 0.36, 0.04]}>  
  <Text
    fontSize={0.08}
    color="white"
    anchorX="center"
    anchorY="top"
    material-toneMapped={false}
    maxWidth={1.2}
    textAlign="center"
  >
    {planeInfo.title}
  </Text>

  {/* Unterstreichung */}
  <mesh position={[0, -0.11, 0]}>
    <planeGeometry args={[1.1, 0.01]} /> 
    <meshBasicMaterial color="white" toneMapped={false} />
  </mesh>
</group>
                      

                      <Text
                        position={[0, 0.1, 0.04]}
                        fontSize={0.06} // content
                        color="white"
                        anchorX="center"
                        anchorY="top"
                        material-toneMapped={false}
                        maxWidth={1.2}
                        textAlign="center"
                        lineHeight={1.45}
                        >
                        {planeInfo.content.length > 0
                          ? planeInfo.content.map((line) => `• ${line}`).join("\n")
                          : "HINZUFÜGEN"}
                      </Text>
                    </group>
                  )}
                </group> 
              );
            })}
        </group> 
      )}
    </group> 
  );
}