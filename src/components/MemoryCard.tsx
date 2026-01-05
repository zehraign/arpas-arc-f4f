import { RoundedBox, Text } from "@react-three/drei";
import { MemoryCategory } from "../data/memoryCards";

interface MemoryCardProps {
  category: MemoryCategory;
  isFlipped: boolean;
  isMatched: boolean;
  position: [number, number, number];
  onClick: () => void;
}

const CATEGORY_EMOJI: Record<MemoryCategory, string> = {
  Grillen: "🦗",
  Algen: "🌱",
  Salzpflanzen: "🧂",
  Quallen: "🪼",
};

export default function MemoryCard({
  category,
  isFlipped,
  isMatched,
  position,
  onClick,
}: MemoryCardProps) {
  return (
    <group position={position}>
      <RoundedBox
        args={[0.25, 0.25, 0.04]}
        radius={0.04}
        onPointerDown={onClick}
      >
        <meshStandardMaterial
          color={
            isMatched
              ? "#75a839"
              : isFlipped
              ? "#ffffff"
              : "#1f3f2e"
          }
        />
      </RoundedBox>

      {isFlipped && (
        <Text
          position={[0, 0, 0.05]}
          fontSize={0.08}
          anchorX="center"
          anchorY="middle"
        >
          {CATEGORY_EMOJI[category]}
        </Text>
      )}
    </group>
  );
}

