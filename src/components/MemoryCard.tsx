import { useRef, useState, useEffect } from "react"; // useEffect & useState hinzugefügt
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
  
  // Lokaler State, um die Karte erst nach der Animation zu entfernen
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (isMatched) {
      //Animation dauert 800ms 
      const timer = setTimeout(() => setShouldRender(false), 800);
      return () => clearTimeout(timer);
    } else { // Falls nicht gematcht wieder normal anzeigen
      setShouldRender(true);
    }
  }, [isMatched]);

  useFrame((state, delta) => {
    if (!outerRef.current || !innerRef.current) return;

    //  Billboard: Karte dreht horizontal zur Kamera 
    outerRef.current.lookAt(
      camera.position.x,
      outerRef.current.position.y,
      camera.position.z
    );

    // Flip-Animation --> roation um pi (180 grad)
    const targetRotation = isFlipped ? Math.PI : 0;
    innerRef.current.rotation.y = THREE.MathUtils.lerp(
      innerRef.current.rotation.y,
      targetRotation,
      delta * 10
    );

    // Match Animation --> bei richtigen treffer
    if (isMatched) {
      // Lässt die Karte kurz größer werden und pulsieren
      const bounce = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.15;
      innerRef.current.scale.set(bounce, bounce, bounce);
    }
  });

  // Wenn die Animation vorbei ist, wird nichts mehr gerendert 
  if (!shouldRender) return null;

  return (
    <group ref={outerRef} {...props}>
      <group 
        ref={innerRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          // Klicken nur erlaubt, wenn nicht geflippt und nicht gematcht
          if (!isFlipped && !isMatched) onClick();
        }}
      >
        <RoundedBox args={[0.28, 0.38, 0.04]} radius={0.03}>
          <meshStandardMaterial color={isMatched ? "#75ed89" : "#285883"} /> 
          {/* Grün bei Treffer, sonst Blau */}
        </RoundedBox>

        <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.021]}>
          {/* Rückseite mit Bild um 180 grad gedreht */}
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