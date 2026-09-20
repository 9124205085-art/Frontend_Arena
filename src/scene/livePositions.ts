import * as THREE from "three";

/** Live positions, written by each leaf, read by connection threads. */
export const livePositions = new Map<string, THREE.Vector3>();
