import { GroupProps, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { useState, useRef, useMemo } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";

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
    "/static/images/Qualle/Qualle1.jpg",
    "/static/images/Qualle/Qualle2.jpg",
    "/static/images/Qualle/Qualle3.png",
    "/static/images/Qualle/Qualle4.jpg",
    "/static/images/Qualle/Qualle5.jpg",
    "/static/images/Qualle/Qualle6.jpg",
  ],
  salzpflanzen: [
    "/static/images/salzpflanzen/SP2.jpeg",
    "/static/images/salzpflanzen/SP3.JPG",
    "/static/images/salzpflanzen/SP4.JPG",
    "/static/images/salzpflanzen/SP5.JPG",
    "/static/images/salzpflanzen/SP6.JPG",
  ],
  algen: [
    "/static/images/algen/alge1.jpg",
    "/static/images/algen/alge2.jpg",
    "/static/images/algen/alge3.jpg",
    "/static/images/algen/alge4.JPG",
    "/static/images/algen/alge5.JPG",
    "/static/images/algen/alge6.jpg",
  ],
  kitchen: [
    "/static/images/kitchen/k1.jpg",
    "/static/images/kitchen/k3.jpg",
    "/static/images/kitchen/k4.jpg",
    "/static/images/kitchen/k5.jpg",
    "/static/images/kitchen/k7.jpg",
    "/static/images/kitchen/k8.jpg",
  ],
  grillen: [
    "/static/images/grillen/grille1.jpg",
    "/static/images/grillen/grille2.jpg",
    "/static/images/grillen/grille3.jpg",
    "/static/images/grillen/grille4.jpg",
    "/static/images/grillen/grille5.jpg",
  ],
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
  const texture = useLoader(TextureLoader, texturePath);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.1;
    ref.current.scale.set(scale, scale, 1);
    ref.current.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.03;
    ref.current.lookAt(camera.position);
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
  const textures = useMemo(() => images.map((img) => new THREE.TextureLoader().load(img)), [images]);

  const groupRef = useRef<THREE.Group>(null);
  const itemRefs = useRef<THREE.Group[]>([]);
  const closeRef = useRef<THREE.Group>(null);

// Drehung zum Betrachter
useFrame(() => {
  if (closeRef.current) {
    closeRef.current.lookAt(camera.position);
  }
});

  useFrame(() => {
    if (groupRef.current) {
      // Gruppe immer am Nutzer positionieren
      groupRef.current.position.set(camera.position.x, camera.position.y, camera.position.z);
    }

    // Alle Items auf Kamera schauen lassen
    itemRefs.current.forEach((ref) => {
      if (ref) ref.lookAt(camera.position);
    });
  });

  const radius = 3;
  const N = textures.length;

  return (
    <group ref={groupRef} {...props}>
      {!showInfo && texturePath && (
  <ImageButton
    texturePath={texturePath}
    onClick={() => setShowInfo(true)}
  />
)}
      {showInfo && (
        <group>








{textures.map((tex, i) => {
  const total = textures.length;


// 🎯 Galerie-Bogen
const arc = Math.PI * 1.3;
const startAngle = -arc / 2;
const step = arc / Math.max(total - 1, 1);
const angle = startAngle + i * step;

// 🟢 GRÖSSERE, EINHEITLICHE SPHÄRE
const radius = 4.6; // vorher ~3.2–3.4 → jetzt weiter weg

// 👁️ Galerie-Höhe (deutlich runter)
const eyeLevel = 0.95;

// 🔁 Zickzack rechts: unten → oben
const verticalOffset = 0.3;
const y =
  i % 2 === 0
    ? eyeLevel - verticalOffset
    : eyeLevel + verticalOffset;

// 📍 Position auf Kugel
const x = Math.sin(angle) * radius;
const z = Math.cos(angle) * radius;





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
      <mesh position={[-0.85, 0, 0]}>
        <planeGeometry args={[1.3, 0.85]} />
        <meshStandardMaterial
  map={tex}
  transparent
/>
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



      {/* Info-Box */}
      <group position={[0.95, 0, 0]}>


       <RoundedBox args={[1.3, 0.9, 0.06]} radius={0.04}>
  <meshStandardMaterial
    color={infoPlaneColors[locationId] || "#2B4E4C"} // fallback
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
    </group>
  );
})}






{/* SCHLIESSEN BUTTON */}
<group ref={closeRef} position={[1.5, 0.6, 0]}>
  <RoundedBox
    args={[0.4, 0.4, 0.12]} // etwas größer
    radius={0.05}
    onPointerDown={() => setShowInfo(false)}
  >
    <meshStandardMaterial color="#e86966" /> {/* rot */}
  </RoundedBox>
  <Text
    position={[-0.05, 0, 0.07]} // nach links verschoben
    fontSize={0.14} // größer
    color="white"
    anchorX="center"
    anchorY="middle"
  >
    X
  </Text>
</group>
        </group>
      )}
    </group>
  );
}