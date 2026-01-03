import { GroupProps } from "@react-three/fiber";
import { Text, RoundedBox } from "@react-three/drei";
import { useState } from "react";

interface InfoPlanesProps extends GroupProps {
  locationId: string; // ID des aktuellen Standorts
}

/* Inhalte für alle Standorte */
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
    { title: "Stadtfreundlich", content: ["Brauch nur wenig Platz und Futter", "Einfach in städtischen Umgebungen züchtbar"] },
    { title: "Klimafreundlich", content: ["Stoßen deutlich weniger CO₂ aus als Rinder oder Schweine", "Effiziente Nahrungsquelle"] },
    { title: "Proteingehalt", content: ["Ca. 60 % Eiweiß", "Hohe Proteinqualität für menschliche Ernährung"] },
  ],
  kitchen: [
    { title: "Was ist Future Food?", content: ["Nachhaltig erzeugte Lebensmittel der Zukunft", "Neue Nahrungsquellen für wachsende Weltbevölkerung"] },
    { title: "Warum Insekten?", content: ["Proteinreich", "Umweltfreundlich und nachhaltig züchtbar", "Alternative zu Fleisch"] },
    { title: "Ziele nachhaltiger Ernährung", content: ["Gesunde Lebensmittel für alle Menschen", "Ressourcenschonend produzieren", "Weniger Lebensmittelverschwendung"] },
    { title: "Produktion in Städten", content: ["Kürzere Transportwege", "Weniger Energie- und Ressourceneinsatz", "Effiziente Nutzung urbaner Räume"] },
    { title: "Innerhalb planetarer Grenzen", content: ["Umwelt wird geschont", "Ressourcen werden nicht überlastet", "Produktion bleibt nachhaltig"] },
    { title: "Neue und alternative Nahrungsquellen", content: ["Makroalgen, Quallen, Salzpflanzen, Grillen", "Vielfältige, nachhaltige Ernährungsmöglichkeiten für die Zukunft"] },
  ],
  salzpflanzen: [
    { title: "Was sind Salzpflanzen?", content: ["Halophyten: Pflanzen, die auf salzigen Böden wachsen können", "Anpassungsfähig an salzhaltige Umgebungen"] },
    { title: "Warum wichtig für die Zukunft?", content: ["Brauchen kein Frischwasser", "Können in Regionen wachsen, wo andere Pflanzen nicht gedeihen"] },
    { title: "Natürlicher Lebensraum", content: ["Küstenregionen", "Salzwiesen und Brackwassergebiete"] },
    { title: "Besondere Eigenschaften", content: ["Entziehen dem Boden Salz und machen ihn nutzbar", "Überleben auch in salzigen Böden"] },
    { title: "Bedeutung für Küstenregionen", content: ["Liefert Nahrung auf salzigem Boden", "Unterstützt nachhaltige Landwirtschaft in schwierigen Umgebungen"] },
  ],
  quallen: [
    { title: "Wichtige Nährstoffe", content: ["Liefert Proteine, Omega-3-Fettsäuren und Vitamine", "Wertvolle Inhaltsstoffe für Ernährung und Gesundheit"] },
    { title: "Warum Mangrovenquallen?", content: ["Neue, nachhaltige Proteinquelle", "Einfach in modularen Indoor-Anlagen züchtbar"] },
    { title: "Rolle der Mikroalgen", content: ["Liefern Energie über Photosynthese", "Unterstützen das Wachstum der Quallen", "Grundlage der Nährstoffproduktion"] },
    { title: "Lebensraum und Bedingungen", content: ["Flache Gewässer mit Mikroalgen sind ihre Lebensgrundlage", "Ideal für kontrollierte Indoor-Kultivierung"] },
    { title: "Symbiose", content: ["Zusammenleben mit Mikroalgen zum Vorteil beider", "Fördert effiziente Nährstoffproduktion und Wachstum"] },
  ],
};

export default function InfoPlanes({ locationId, ...props }: InfoPlanesProps) {
  const [showInfo, setShowInfo] = useState(false);
  const planes = infoContent[locationId] || [];

  return (
    <group {...props}>
      {/* INFO BUTTON */}
      {!showInfo && (
        <group position={[0, 0, 0]}>
          <mesh onPointerDown={() => setShowInfo(true)}>
            <sphereGeometry args={[0.2, 32, 32]} />
            <meshStandardMaterial color="#2B4E4C" />
          </mesh>

          <Text
            position={[0, 0, 0.21]}
            fontSize={0.15}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            i
          </Text>
        </group>
      )}

      {/* INFO PANELS */}
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

          {/* SCHLIESSEN BUTTON */}
          <group position={[1.5, 0.6, 0]}>
            <RoundedBox
              args={[0.3, 0.3, 0.1]}
              radius={0.05}
              onPointerDown={() => setShowInfo(false)}
            >
              <meshStandardMaterial color="#E53935" />
            </RoundedBox>
            <Text
              position={[0, 0, 0.06]}
              fontSize={0.12}
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