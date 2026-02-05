import * as THREE from "three";
import { RootState } from "@react-three/fiber";
import { ObjectData, VariantData } from "../types/objectData";
import { Position } from "../types/transform";

/**
 * Computes XR interaction and returns the first intersected scene object.
 *
 * @param {XRInputSourceEvent} event - XR input event from selectstart.
 * @param {RootState} state - R3F state with scene and XR renderer.
 * @param {Array<{ id: number }>} sceneObjects - List of tracked scene objects.
 * @returns {{ objectId: number; object: THREE.Object3D } | null} - The selected scene object hit or null if no valid object is found.
 */
export function getIntersectedSceneObject(event: XRInputSourceEvent, state: RootState, objects: ObjectData[]
): { objectId: number; object: THREE.Object3D } | null {
    const inputSource = event.inputSource;
    const referenceSpace = state.gl.xr.getReferenceSpace() as XRSpace;

    const pose = event.frame.getPose(inputSource.targetRaySpace, referenceSpace);
    if (!pose) return null;

    const { x, y, z } = pose.transform.position;
    const { x: qx, y: qy, z: qz, w: qw } = pose.transform.orientation;
    const origin = new THREE.Vector3(x, y, z);
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(qx, qy, qz, qw));

    const raycaster = new THREE.Raycaster(origin, direction);
    const intersects = raycaster.intersectObjects(state.scene.children, true);

    console.log("Intersects:", intersects);
    for (const hit of intersects) {
        let current: THREE.Object3D | null = hit.object;
        while (current && current.userData?.sceneObjectId === undefined) {
            current = current.parent;
        }
        const sceneObjectId = current?.userData?.sceneObjectId;
        if (sceneObjectId !== undefined) {
            const match = objects.find(obj => obj.id === sceneObjectId);
            if (match && current) {
                return { objectId: match.id, object: current };
            }
        }
    }

    return null;
}

export const getObjectPosition = (
    sceneObject: ObjectData,
    _variant: VariantData,
    getPosition: (latitude: number, longitude: number) => Position
): Position => {

    const [latitude, longitude] = sceneObject.coordinates;

    return getPosition(latitude, longitude);
};

export function getClosestObject(
    targetPosition: Position,
    sceneObjects: ObjectData[],
    selectedVariants: Record<number, number>,
    getPosition: (latitude: number, longitude: number) => Position
) {
    if (!sceneObjects || sceneObjects.length === 0) return null;

    let closest = null;
    let minDistance = Infinity;

    for (const sceneObject of sceneObjects) {
        if (!sceneObject || !sceneObject.variants) continue;
        const variantId = selectedVariants[sceneObject.id] ?? sceneObject.variants[0]?.id;
        const variant = sceneObject.variants.find((v) => v.id === variantId);
        if (!variant) continue;

        const position = getObjectPosition(sceneObject, variant, getPosition);
        const distance = targetPosition.distanceTo(position);
        if (distance < minDistance) {
            minDistance = distance;
            closest = { sceneObject, variant, position, distance };
        }
    }
    return closest;
}
