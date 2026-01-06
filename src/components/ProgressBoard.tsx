import { Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface ProgressBoardProps {
  collected: string[]; // z.B. ["algen", "quallen"]
}

/**
 * 3D Fortschrittsanzeige / Stempelkarte
 * Zeigt pro Standort ein Badge
 */
export default function ProgressBoard({ collected }: ProgressBoardProps) {
  const locations = [
    { id: "algen", label: "🌱" },
    { id: "grillen", label: "🦗" },
    { id: "kitchen", label: "🍽️" },
    { id: "salzpflanzen", label: "🧂" },
    { id: "quallen", label: "🪼" },
  ];

  const allCollected = collected.length === locations.length;

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

      {/* Badges */}
      {locations.map((loc, index) => {
        const isCollected = collected.includes(loc.id);

        return (
          <group
            key={loc.id}
            position={[-0.7 + index * 0.35, -0.05, 0.05]}
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