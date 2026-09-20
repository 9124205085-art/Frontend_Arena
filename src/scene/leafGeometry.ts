import * as THREE from "three";

function mapleShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 1);
  s.bezierCurveTo(0.12, 0.92, 0.38, 0.78, 0.42, 0.5);
  s.bezierCurveTo(0.72, 0.55, 0.7, 0.28, 0.48, 0.22);
  s.bezierCurveTo(0.62, 0.02, 0.28, -0.05, 0.12, -0.28);
  s.lineTo(0.04, -0.55);
  s.lineTo(0, -0.72);
  s.lineTo(-0.04, -0.55);
  s.lineTo(-0.12, -0.28);
  s.bezierCurveTo(-0.28, -0.05, -0.62, 0.02, -0.48, 0.22);
  s.bezierCurveTo(-0.7, 0.28, -0.72, 0.55, -0.42, 0.5);
  s.bezierCurveTo(-0.38, 0.78, -0.12, 0.92, 0, 1);
  return s;
}

function oakShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 1);
  s.bezierCurveTo(0.35, 0.85, 0.45, 0.45, 0.32, 0.1);
  s.bezierCurveTo(0.4, -0.15, 0.12, -0.25, 0.05, -0.5);
  s.lineTo(0, -0.7);
  s.lineTo(-0.05, -0.5);
  s.bezierCurveTo(-0.12, -0.25, -0.4, -0.15, -0.32, 0.1);
  s.bezierCurveTo(-0.45, 0.45, -0.35, 0.85, 0, 1);
  return s;
}

function elmShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 1.05);
  s.bezierCurveTo(0.22, 0.7, 0.28, 0.25, 0.18, -0.15);
  s.bezierCurveTo(0.1, -0.4, 0.03, -0.52, 0, -0.75);
  s.bezierCurveTo(-0.03, -0.52, -0.1, -0.4, -0.18, -0.15);
  s.bezierCurveTo(-0.28, 0.25, -0.22, 0.7, 0, 1.05);
  return s;
}

export function createLeafGeometry(kind: 0 | 1 | 2 = 0): THREE.BufferGeometry {
  const shape = kind === 0 ? mapleShape() : kind === 1 ? oakShape() : elmShape();
  const g = new THREE.ShapeGeometry(shape, 6);
  g.computeVertexNormals();
  const s = kind === 2 ? 0.28 : 0.34;
  g.scale(s, s * 1.15, 1);
  g.center();
  return g;
}

export const LEAF_GEOMETRIES = [0, 1, 2] as const;
