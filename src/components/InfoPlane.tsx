import { GroupProps, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { useState, useRef } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";

/* =========================
   Props
========================= */
interface InfoPlanesProps extends GroupProps {
  locationId: string;
}

/* =========================
   INFO CONTENT (ORIGINAL)
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
  ],
};

/* =========================
   Wasserblasen Button
========================= */
function WaterBubbleButton({ onClick }: { onClick: () => void }) {
  const ref = useRef<THREE.Sprite>(null);
  const texture = useLoader(TextureLoader, "/static/textures/water-bubble.png");
  const { camera } = useThree();

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.04;
    const s = 0.55 + Math.sin(clock.elapsedTime * 2) * 0.04;
    ref.current.scale.set(s, s, 1);
    ref.current.quaternion.copy(camera.quaternion);
  });

  return (
    <sprite ref={ref} onPointerDown={onClick}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

/* =========================
   InfoPlanes
========================= */
export default function InfoPlanes({ locationId, ...props }: InfoPlanesProps) {
  const [showInfo, setShowInfo] = useState(false);
  const planes = infoContent[locationId] || [];

  return (
    <group {...props}>
      {/* INFO BUTTON */}
      {!showInfo && (
        <>
          {locationId === "quallen" ? (
            <WaterBubbleButton onClick={() => setShowInfo(true)} />
          ) : (
            <group>
              <mesh onPointerDown={() => setShowInfo(true)}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial color="#2B4E4C" />
              </mesh>
              <Text position={[0, 0, 0.21]} fontSize={0.15} color="white">
                i
              </Text>
            </group>
          )}
        </>
      )}

      {/* INFO PANELS (ORIGINAL LAYOUT) */}
      {showInfo && (
        <group>
          {planes.map((plane, idx) => {
            const xOffset = (idx % 3) * 0.95 - 0.95;
            const yOffset = -Math.floor(idx / 3) * 1.5;

            return (
              <group key={idx} position={[xOffset, yOffset, 0]}>
                <RoundedBox args={[0.9, 1.1, 0.05]} radius={0.03}>
                  <meshStandardMaterial color="#2B4E4C" />
                </RoundedBox>

                <Text
                  position={[0, 0.45, 0.03]}
                  fontSize={0.08}
                  color="white"
                  anchorX="center"
                  anchorY="top"
                  maxWidth={0.85}
                  textAlign="center"
                  fontWeight="bold"
                >
                  {plane.title}
                </Text>

                <Text
                  position={[0, 0.15, 0.03]}
                  fontSize={0.05}
                  color="white"
                  anchorX="center"
                  anchorY="top"
                  maxWidth={0.8}
                  textAlign="center"
                  lineHeight={1.4}
                >
                  {plane.content.map((line) => `• ${line}`).join("\n")}
                </Text>
              </group>
            );
          })}

          {/* CLOSE BUTTON */}
          <group position={[1.5, 0.6, 0]}>
            <RoundedBox
              args={[0.3, 0.3, 0.1]}
              radius={0.05}
              onPointerDown={() => setShowInfo(false)}
            >
              <meshStandardMaterial color="#E53935" />
            </RoundedBox>
            <Text position={[0, 0, 0.06]} fontSize={0.12} color="white">
              X
            </Text>
          </group>
        </group>
      )}
    </group>
  );
}