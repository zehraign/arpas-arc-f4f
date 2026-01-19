import { Text, RoundedBox } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";

interface ProgressBoardProps {
  collected: string[]; // z.B. ["algen", "quallen"]
}

export default function ProgressBoard({ collected }: ProgressBoardProps) {
  const [showInfoOverlay, setShowInfoOverlay] = useState(false);

  const locations = [
    { id: "algen", label: "🌱", name: "Algen" },
    { id: "grillen", label: "🦗", name: "Grillen" },
    { id: "kitchen", label: "🍽️", name: "f4f-Kitchen" },
    { id: "salzpflanzen", label: "🧂", name: "Salzpflanzen" },
    { id: "quallen", label: "🪼", name: "Quallen" },
  ];

  const [activeBadgeInfo, setActiveBadgeInfo] = useState<{
    id: string;
    label: string;
    collected: boolean;
  } | null>(null);

  const allCollected = collected.length === locations.length;
  const badgeInfoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <group position={[-0.9, 1.6, -1.2]}>
      {/* Hintergrund */}
      <RoundedBox args={[1.8, 0.7, 0.06]} radius={0.08}>
        <meshStandardMaterial color="#1f3f3c" />
      </RoundedBox>

      {/* Titel */}
      <Text
        position={[0, 0.22, 0.04]}
        fontSize={0.09}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Fortschritt
      </Text>

      {/* Info-Button */}
      <group position={[0.75, 0.22, 0.06]} onPointerDown={() => setShowInfoOverlay(!showInfoOverlay)}>
        
        <RoundedBox args={[0.24, 0.14, 0.051]} radius={0.035}>
  <meshStandardMaterial color="#162e2c" />
</RoundedBox>

        <Text fontSize={0.09} color="#fff" anchorX="center" anchorY="middle"  position={[0, 0, 0.03]}>
          i
        </Text>
      </group>

      {/* Info-Overlay */}
      {showInfoOverlay && (
        <group position={[0, -0.3, 0.08]}>
          <RoundedBox args={[1.7, 0.4, 0.05]} radius={0.05}>
            <meshStandardMaterial color="#caedea" />
          </RoundedBox>
          <Text
            fontSize={0.05}
            color="#326661"
            anchorX="center"
            anchorY="middle"
            maxWidth={1.6}
            textAlign="center"
            position={[0, 0, 0.03]} // etwas über die Plane
          >
            Hier sammelst du deine Badges! {"\n"}
            An jedem der fünf Standorte kannst du ein Badge erhalten, indem du Quiz, Puzzle oder Memory richtig löst. {"\n"}
            Deine gesammelten Badges färben sich dann grün.{"\n"}
            Sammle alle Badges um eine Überraschung zu erhalten! 🌟
          </Text>
        </group>
      )}

      {/* Badges */}
      {locations.map((loc, index) => {
  const isCollected = collected.includes(loc.id);

  return (
    <group
      key={loc.id}
      position={[-0.7 + index * 0.35, -0.05, 0.05]}
      onPointerDown={() => {
        // altes Timeout löschen
        if (badgeInfoTimeout.current) {
          clearTimeout(badgeInfoTimeout.current);
        }
      
        // neue Info setzen
        setActiveBadgeInfo({
          id: loc.id,
          label: loc.name,
          collected: isCollected,
        });
      
        // Auto-Close nach 6 Sekunden
        badgeInfoTimeout.current = setTimeout(() => {
          setActiveBadgeInfo(null);
        }, 5000);
      }}
    >
      <mesh>
        <circleGeometry args={[0.1, 32]} />
        <meshStandardMaterial
          color={isCollected ? "#4CAF50" : "#555"}
          emissive={isCollected ? new THREE.Color("#2e7d32") : undefined}
          emissiveIntensity={isCollected ? 0.6 : 0}
        />
      </mesh>

      <Text
        position={[0, 0, 0.03]}
        fontSize={0.1}
        anchorX="center"
        anchorY="middle"
      >
        {loc.label}
      </Text>
    </group>
  );
})}

{activeBadgeInfo && (
  <group position={[0, -0.55, 0.09]}>
    <RoundedBox args={[1.6, 0.32, 0.05]} radius={0.05}>
      <meshStandardMaterial color="#ffffff" />
    </RoundedBox>

    <Text
      fontSize={0.055}
      color="#1f3f3c"
      anchorX="center"
      anchorY="middle"
      maxWidth={1.45}
      textAlign="center"
      position={[0, 0, 0.03]}
    >
      {activeBadgeInfo.collected
        ? `🎉 Du hast erfolgreich das ${activeBadgeInfo.label}-Badge gesammelt!`
        : `🔒 Dieses Badge hast du noch nicht gesammelt.\nLöse Quiz, Puzzle oder Memory am Standort.`}
    </Text>
  </group>
)}

      {/* Spezial-Badge */}
      {allCollected && (
        <group position={[0, -0.35, 0.08]}>
          <Text
            fontSize={0.1}
            color="#FFD700"
            anchorX="center"
            anchorY="middle"
          >
            ⭐ Master Explorer!
          </Text>
        </group>
      )}
    </group>
  );
}