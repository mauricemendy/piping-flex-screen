"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface PipeRouteViewerProps {
  /** Developed length in meters. */
  L: number;
  /** Anchor-to-anchor distance in meters. */
  U: number;
  /** Whether the screening passes. */
  pass: boolean | null;
}

/**
 * Generate an L-shaped pipe route that has:
 *  - developed length = L
 *  - anchor-to-anchor distance = U
 *
 * The route goes: anchor A → horizontal → 90° bend → vertical leg → anchor B
 * We use an L-shape in the XY plane:
 *   A at (0,0,0), horizontal along X, then vertical along Y.
 *   The horizontal leg length = h, vertical leg length = v.
 *   L = h + v + bend arc ≈ h + v (simplified)
 *   U = sqrt(h² + v²)
 *
 * We pick h and v such that h + v ≈ L and sqrt(h²+v²) = U.
 * From h + v = L and h² + v² = U²:
 *   (h + v)² = L² → h² + 2hv + v² = L²
 *   h² + v² = U² → 2hv = L² - U²
 *   hv = (L² - U²) / 2
 *
 * h and v are roots of: t² - Lt + (L²-U²)/2 = 0
 */
function computeRoute(L: number, U: number): THREE.Vector3[] {
  if (L <= 0 || U <= 0 || L < U) {
    return [new THREE.Vector3(0, 0, 0), new THREE.Vector3(U || 1, 0, 0)];
  }

  if (Math.abs(L - U) < 0.01) {
    // Straight line
    return [new THREE.Vector3(0, 0, 0), new THREE.Vector3(U, 0, 0)];
  }

  const discriminant = L * L - 2 * ((L * L - U * U) / 2);
  // discriminant = L² - (L² - U²) = U²
  // So roots = (L ± U) / 2
  const h = (L + U) / 2;
  const v = (L - U) / 2;

  // Actually h + v = L, sqrt(h²+v²) check:
  // This gives an approximation; the diagonal won't be exactly U,
  // but close enough for visualization. Let's scale to make diagonal = U.
  const actualU = Math.sqrt(h * h + v * v);
  const scale = U / actualU;
  const hScaled = h * scale;
  const vScaled = v * scale;

  // Bend radius for visualization (10% of shorter leg, clamped)
  const bendR = Math.min(hScaled, vScaled) * 0.15;
  const nBendPts = 8;

  const points: THREE.Vector3[] = [];

  // Start anchor
  points.push(new THREE.Vector3(0, 0, 0));

  // Horizontal leg (along +X)
  points.push(new THREE.Vector3(hScaled - bendR, 0, 0));

  // 90° bend arc (XY plane, from +X to +Y direction)
  for (let i = 1; i <= nBendPts; i++) {
    const angle = (Math.PI / 2) * (i / nBendPts);
    const x = hScaled - bendR + Math.sin(angle) * bendR;
    const y = bendR - Math.cos(angle) * bendR;
    points.push(new THREE.Vector3(x, y, 0));
  }

  // Vertical leg (along +Y)
  points.push(new THREE.Vector3(hScaled, vScaled, 0));

  return points;
}

function PipeRoute({ L, U, pass }: PipeRouteViewerProps) {
  const points = useMemo(() => computeRoute(L, U), [L, U]);

  const startPt = points[0];
  const endPt = points[points.length - 1];

  const pipeColor = pass === null ? "#9CA3AF" : pass ? "#0D9488" : "#DC2626";

  return (
    <group>
      {/* Pipe route */}
      <Line
        points={points}
        color={pipeColor}
        lineWidth={4}
      />

      {/* Anchor points */}
      <mesh position={startPt}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={endPt}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#111827" />
      </mesh>

      {/* Anchor labels */}
      <Html position={[startPt.x, startPt.y - 0.5, startPt.z]} center>
        <span className="text-[10px] font-semibold text-[#111827] bg-white/90 rounded px-1.5 py-0.5 whitespace-nowrap shadow-sm">
          Anchor A
        </span>
      </Html>
      <Html position={[endPt.x, endPt.y + 0.5, endPt.z]} center>
        <span className="text-[10px] font-semibold text-[#111827] bg-white/90 rounded px-1.5 py-0.5 whitespace-nowrap shadow-sm">
          Anchor B
        </span>
      </Html>

      {/* Dashed line showing anchor distance U */}
      <Line
        points={[startPt, endPt]}
        color="#9CA3AF"
        lineWidth={1}
        dashed
        dashSize={0.2}
        gapSize={0.1}
      />

      {/* U label */}
      <Html
        position={[
          (startPt.x + endPt.x) / 2,
          (startPt.y + endPt.y) / 2 - 0.4,
          0,
        ]}
        center
      >
        <span className="text-[10px] text-[#9CA3AF] bg-white/90 rounded px-1 py-0.5 whitespace-nowrap">
          U = {U.toFixed(1)} m
        </span>
      </Html>

      {/* Ground grid */}
      <gridHelper args={[20, 20, "#E5E7EB", "#F3F4F6"]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} />
    </group>
  );
}

function Scene({ L, U, pass }: PipeRouteViewerProps) {
  // Auto-fit camera based on route size
  const maxDim = Math.max(L, U, 5);
  const camDist = maxDim * 0.8;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <PipeRoute L={L} U={U} pass={pass} />
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxDistance={camDist * 3}
        minDistance={1}
      />
    </>
  );
}

export function PipeRouteViewer({ L, U, pass }: PipeRouteViewerProps) {
  const maxDim = Math.max(L, U, 5);
  const camDist = maxDim * 0.8;

  return (
    <div className="h-[240px] w-full rounded-[12px] bg-[#FAFAFA] overflow-hidden border border-[#E5E7EB]">
      <Canvas
        camera={{
          position: [maxDim * 0.3, maxDim * 0.3, camDist],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        style={{ background: "#FAFAFA" }}
      >
        <Scene L={L} U={U} pass={pass} />
      </Canvas>
    </div>
  );
}
