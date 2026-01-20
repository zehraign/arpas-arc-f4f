import { GroupProps, useFrame, useThree } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { useState, useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";
import { useTexture } from "@react-three/drei";

const IMAGE_WIDTH = 1.4
const IMAGE_HEIGHT = 0.95

const GALLERY_RADIUS = 5.6
const GALLERY_Y_BASE = 0.2
const GALLERY_Y_OFFSET = 0.25

/* =========================
   PRELOAD HOOK
========================= */
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
  grillen: "#db8830",
  kitchen: "#2BB0A6",
  algen: "#5fcf65",
  quallen: "#369e9e",
  salzpflanzen: "#75a839",
};
interface InfoPlanesProps extends GroupProps {
  locationId: string;
  showInfo: boolean;
  setShowInfo: (val: boolean) => void;
}

/* =========================
   INFO CONTENT
========================= */
const infoContent: Record<string, { title: string; content: string[] }[]> = {
  algen: [
    { title: "Warum Algen?", content: ["Wachsen sehr schnell", "Brauchen kaum Ackerland, Süßwasser oder Dünger", "Schonend für Umwelt und Klima"] },
    { title: "Wichtige Inhaltsstoffe", content: ["Enthalten Eiweiß, Vitamine und Omega-3-Fettsäuren", "Liefern wichtige Nährstoffe für den Menschen"] },
    { title: "Wachstumsbedingungen", content: ["Benötigen Licht, Wasser und Nährstoffe", "Können kontrolliert gezüchtet werden"] },
    { title: "Indoor-Kultivierung", content: ["Unabhängig von Wetter und Jahreszeiten", "Kein Ackerland notwendig", "Produktion fast überall möglich"] },
    { title: "Grünalgen im Fokus", content: ["Ca. 25 % Eiweiß", "Gute pflanzliche Proteinquelle"] },
    { title: "Besondere Vitamine", content: ["Enthalten Beta-Carotin", "Vorstufe von Vitamin A", "Wichtig für Augen, Haut und Immunsystem"] },
  ],
  grillen: [
    { title: "Warum Grillen?", content: ["Wachsen schnell", "Brauchen wenig Platz und Ressourcen", "Schonend für Umwelt und Klima"] },
    { title: "Proteinreich", content: ["Enthalten viel Eiweiß", "Gute pflanzliche Alternative zu Fleisch"] },
    { title: "Stadtfreundlich", content: ["Brauchen nur wenig Platz und Futter", "Einfach in städtischen Umgebungen züchtbar"] },
    { title: "Klimafreundlich", content: ["Stoßen deutlich weniger CO₂ aus als Rinder oder Schweine", "Effiziente Nahrungsquelle"] },
    { title: "Proteingehalt", content: ["Ca. 60 % Eiweiß", "Hohe Proteinqualität für menschliche Ernährung"] },
  ],
  kitchen: [
    { title: "Was ist Future Food?", content: ["Nachhaltig erzeugte Lebensmittel der Zukunft", "Neue Nahrungsquellen für wachsende Weltbevölkerung"] },
    { title: "Warum Insekten?", content: ["Proteinreich", "Umweltfreundlich und nachhaltig züchtbar", "Alternative zu Fleisch"] },
    { title: "Ziele nachhaltiger Ernährung", content: ["Gesunde Lebensmittel für alle Menschen", "Ressourcenschonend produzieren", "Weniger Lebensmittelverschwendung"] },
    { title: "Produktion in Städten", content: ["Kürzere Transportwege", "Weniger Energie- und Ressourceneinsatz", "Effiziente Nutzung urbaner Räume"] },
    { title: "Innerhalb planetarer Grenzen", content: ["Umwelt wird geschont", "Ressourcen werden nicht überlastet", "Produktion bleibt nachhaltig"] },
    { title: "Neue und alternative Nahrungsquellen", content: ["Makroalgen, Quallen, Salzpflanzen, Grillen"] },
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
    { title: "Symbiose", content: ["Zusammenleben mit Mikroalgen", "Fördert effizientes Wachstum"] },
  ],
};

/* =========================
   BUTTON TEXTUREN
========================= */
const buttonTextures: Record<string, string> = {
  quallen: "/static/textures/qualli.png",
  grillen: "/static/textures/grille.png",
  algen: "/static/textures/alge.png",
  kitchen: "/static/textures/kitchen.png",
  salzpflanzen: "/static/textures/salzpflanze.png",
};

/* =========================
   BILDER PRO STANDORT
========================= */
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


/* =========================
   Pulsierende Bilder pro Standort (Index)
========================= */
const pulsatingImages: Record<string, number[]> = {
  quallen: [0,1, 2, 3, 4,5  ],
  algen: [0,1,2, 3,4, 5, ],
  grillen: [0, 1, 2,3, 4],
  kitchen: [0,1,2, 3, 4,5],
  salzpflanzen: [0, 1,2, 3,4 ],
};
/* =========================
   Bildunterschriften pro Standort (Platzhalter)
========================= */
const locationCaptions: Record<string, string[]> = {
  quallen: ["AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR"],
  salzpflanzen: ["AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR"],
  algen: ["AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR"],
  kitchen: ["AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR"],
  grillen: ["AUTOR", "AUTOR", "AUTOR", "AUTOR", "AUTOR"],
};
/* =========================
   Bild-Button (Billboard)
========================= */
function ImageButton({ texturePath, onClick }: { texturePath: string; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const texture = useTexture(texturePath);

  useFrame(({ clock }) => {
    if (!ref.current) return;
  
    const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.1;
    ref.current.scale.set(scale, scale, 1);
  
    ref.current.lookAt(
      camera.position.x,
      ref.current.position.y,
      camera.position.z
    );
  });

  return (
    <mesh ref={ref} onPointerDown={onClick}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}
/* =========================
   InfoPlanes Component (AR sphärisch verteilt)
========================= */

export default function InfoPlanes({
  locationId,
  showInfo,
  setShowInfo,
  ...props
}: InfoPlanesProps) {

  const planes = infoContent[locationId] || [];
  const texturePath = buttonTextures[locationId];
  const { camera } = useThree();

  const images = locationImages[locationId] || [];
  // ✅ Preload Textures asynchron
  const textures = usePreloadTextures(images);

 
  const itemRefs = useRef<THREE.Group[]>([]);
  const closeRef = useRef<THREE.Group>(null);
  const imageRefs = useRef<THREE.Mesh[]>([]);
  const [activeInfoIndices, setActiveInfoIndices] = useState<number[]>([]);
  

  // Close-Button schaut zur Kamera
  useFrame(() => {
    if (!closeRef.current) return;
  
    closeRef.current.lookAt(
      camera.position.x,
      closeRef.current.position.y,
      camera.position.z
    );
  });

  // Gruppe und Items schauen zur Kamera
  useFrame(() => {
    imageRefs.current.forEach((mesh) => {
      if (!mesh) return
  
      mesh.lookAt(
        camera.position.x,
        mesh.position.y,
        camera.position.z
      )
    })
  })
  
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const active = pulsatingImages[locationId] || [];
  
    active.forEach((index) => {
      const mesh = imageRefs.current[index];
      if (!mesh) return;
  
      const pulse = 1 + Math.sin(time * 2) * 0.08;
      mesh.scale.set(pulse, pulse, 1);
      mesh.position.y = Math.sin(time * 1.5) * 0.04;
    });
  });

  const radius = 3;

  // ⚠️ Ladeanzeige, falls Texturen noch nicht fertig
  if (showInfo && textures.length !== images.length) {
    return (
      <group >
        <Text fontSize={0.1} color="white" anchorX="center" anchorY="middle">
          Bilder werden geladen...
        </Text>
      </group>
    );
  }

  return (
    <group >
      {!showInfo && texturePath && (
        <ImageButton texturePath={texturePath} onClick={() => setShowInfo(true)} />
      )}
{showInfo && (
  <group>
    {/* =========================
        INTRO-PLANE MIT HINWEIS
    ========================= */}
    <group
  ref={(ref) => {
    if (ref) ref.lookAt(camera.position);
  }}
  position={[0, 1.4, -2.5]} // 🔥 fester Abstand im Raum
>
      {/* Hintergrund-Plane */}
      <RoundedBox args={[2.5, 0.8, 0.06]} radius={0.05}>
        <meshStandardMaterial
          color={infoPlaneColors[locationId] || "#2B4E4C"}
          roughness={0.6}
          metalness={0.1}
        />
      </RoundedBox>

      {/* Hinweis-Text */}
      <Text
        position={[0, 0, 0.04]} // leicht vor der Plane
        fontSize={0.09} // größer
        color="white"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        maxWidth={2.3}
        textAlign="center"
      >
        Lerne was neues – sieh dir die Infos & Bilder an!
      </Text>

      {/* X BUTTON oben rechts auf der Plane */}
      <group position={[1.15, 0.35, 0.04]}> {/* rechts oben relativ zur Plane */}
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

    {/* =========================
        GALERIE MIT BILDERN UND INFO-BOXEN
    ========================= */}
    {textures.map((tex, i) => {
      const total = textures.length;

      // 🎯 Galerie-Bogen
      const arc = Math.PI * 1.3;
      const startAngle = -arc / 2;
      const step = arc / Math.max(total - 1, 1);
      const angle = startAngle + i * step;

    
      // 👁️ Galerie-Höhe
      const eyeLevel = 0.2;

      const y =
      i % 2 === 0
        ? GALLERY_Y_BASE - GALLERY_Y_OFFSET
        : GALLERY_Y_BASE + GALLERY_Y_OFFSET
    
    const x = Math.sin(angle) * GALLERY_RADIUS
    const z = Math.cos(angle) * GALLERY_RADIUS

      const caption = locationCaptions[locationId]?.[i] || "AUTOR";
      const planeInfo = planes[i] || { title: "HINZUFÜGEN", content: [] };

      return (
        <group
          key={i}
          ref={(el) => {
            if (!el) return;
            itemRefs.current[i] = el;
            el.lookAt(0, eyeLevel, 0);
            el.rotation.y += (i - total / 2) * 0.02;
          }}
          position={[x, y, z]}
        >
          {/* Bild */}
          <mesh
  ref={(el) => {
    if (!el) return
    imageRefs.current[i] = el
  }}
  position={[-0.85, 0, 0]}
  onPointerDown={() => {
    setActiveInfoIndices((prev) =>
      prev.includes(i)
        ? prev.filter((index) => index !== i)
        : [...prev, i]
    )
  }}
>
  <planeGeometry args={[IMAGE_WIDTH, IMAGE_HEIGHT]} />
  <meshStandardMaterial map={tex} transparent />
</mesh>

          {/* Bildunterschrift */}
          <Text
            position={[-0.85, -0.55, 0.03]}
            fontSize={0.055}
            color="white"
            anchorX="center"
            anchorY="top"
            material-toneMapped={false}
            maxWidth={1.3}
            textAlign="center"
          >
            {caption}
          </Text>

          {/* Info-Box: näher ans Bild gerückt */}
          {activeInfoIndices.includes(i) && (
  <group
    position={[0.48, 0, 0]}
    ref={(ref) => {
      if (!ref) return
      ref.lookAt(
        camera.position.x,
        ref.position.y,
        camera.position.z
      )
    }}
  >
            <RoundedBox args={[1.3, 0.9, 0.06]} radius={0.04}>
              <meshStandardMaterial
                color={infoPlaneColors[locationId] || "#2B4E4C"}
                roughness={0.6}
                metalness={0.1}
              />
            </RoundedBox>


            <Text
              position={[0, 0.32, 0.04]}
              fontSize={0.065}
              color="white"
              anchorX="center"
              anchorY="top"
              material-toneMapped={false}
              maxWidth={1.2}
              textAlign="center"
            >
              {planeInfo.title}
            </Text>

            <Text
              position={[0, -0.05, 0.04]}
              fontSize={0.048}
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