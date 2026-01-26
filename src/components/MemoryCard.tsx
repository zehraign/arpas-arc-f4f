

import { useRef } from "react";
import { useFrame, useThree, GroupProps } from "@react-three/fiber";
import { RoundedBox, Image } from "@react-three/drei";
import * as THREE from "three";

interface MemoryCardProps extends GroupProps {
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
}

export default function MemoryCard({
  image,
  isFlipped,
  isMatched,
  onClick,
  ...props
}: MemoryCardProps) {
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((state, delta) => {
    if (!outerRef.current || !innerRef.current) return;

    // 1. Billboard: Nur horizontal zur Kamera drehen
    outerRef.current.lookAt(
      camera.position.x,
      outerRef.current.position.y,
      camera.position.z
    );

    // 2. Flip-Animation: Ziel-Rotation (180 Grad wenn flipped, sonst 0)
    const targetRotation = isFlipped ? Math.PI : 0;
    
    // Smooth Drehung mit lerp
    innerRef.current.rotation.y = THREE.MathUtils.lerp(
      innerRef.current.rotation.y,
      targetRotation,
      delta * 10
    );
  });

  if (isMatched) return null;

  return (
    <group ref={outerRef} {...props}>
      {/* Die innere Gruppe wird gedreht */}
      <group 
        ref={innerRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (!isFlipped) onClick();
        }}
      >
        {/* Kartenrücken */}
        <RoundedBox args={[0.28, 0.38, 0.04]} radius={0.03}>
          <meshStandardMaterial color="#285883" />
        </RoundedBox>

        {/* Vorderseite (Bild) */}
        {/* Wir rendern das Bild jetzt immer, aber es ist auf der Rückseite montiert */}
        <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.021]}>
          <Image
            url={image}
            scale={[0.24, 0.34]}
            transparent
          />
        </group>
      </group>
    </group>
  );
}