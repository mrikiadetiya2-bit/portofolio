/**
 * Pure mathematical utilities for the WebGL Spherical Lens Slider.
 * Mirrors the GLSL UV cover calculation, exponential sphere radius (maxRadius = 2.9),
 * 3D sphere normal z = sqrt(1 - r^2), dark optical glass liquid pinch refraction,
 * pow(1.0 - uProgress, 1.8) damping, and tight anti-ghosting chromatic aberration.
 */

export interface Dimensions {
  width: number;
  height: number;
}

export interface UV {
  u: number;
  v: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Computes object-fit: cover UV coordinates for a given screen resolution and texture resolution.
 */
export function computeCoverUv(uv: UV, screenRes: Dimensions, texRes: Dimensions): UV {
  const screenAspect = screenRes.width / Math.max(screenRes.height, 1);
  const texAspect = texRes.width / Math.max(texRes.height, 1);

  let scaleX = 1.0;
  let scaleY = 1.0;

  if (screenAspect > texAspect) {
    scaleY = texAspect / screenAspect;
  } else {
    scaleX = screenAspect / texAspect;
  }

  return {
    u: (uv.u - 0.5) * scaleX + 0.5,
    v: (uv.v - 0.5) * scaleY + 0.5,
  };
}

/**
 * Computes the global distortion damping factor pow(1.0 - uProgress, 1.8).
 */
export function computeDistortionDamp(progress: number): number {
  const p = Math.min(Math.max(progress, 0), 1);
  return Math.pow(1.0 - p, 1.8);
}

/**
 * Computes the exponential sphere radius (maxRadius >= 2.8) for a given progress in [0, 1].
 */
export function computeExponentialSphereRadius(progress: number, maxRadius = 2.9): number {
  const p = Math.min(Math.max(progress, 0), 1);
  const expProgress = Math.pow(p, 1.5);
  return 0.02 + (maxRadius - 0.02) * expProgress;
}

/**
 * Computes the 3D sphere surface normal at normalized radial coordinate (nx, ny) inside unit circle.
 */
export function computeSphereNormal(nx: number, ny: number): Vector3D {
  const r2 = Math.min(nx * nx + ny * ny, 1.0);
  const z = Math.sqrt(Math.max(0.0, 1.0 - r2));
  const len = Math.hypot(nx, ny, Math.max(z, 0.001));
  return {
    x: nx / len,
    y: ny / len,
    z: Math.max(z, 0.001) / len,
  };
}

/**
 * Computes bounded chromatic aberration offset (max <= 0.02 at rim) damped by pow(1.0 - uProgress, 1.8).
 */
export function computeChromaticOffset(normRadius: number, progress: number): number {
  const r = Math.min(Math.max(normRadius, 0), 1);
  const z = Math.sqrt(Math.max(0.0, 1.0 - r * r));
  const fresnel = Math.pow(1.0 - z, 2.0);
  const damp = computeDistortionDamp(progress);
  return (0.002 + 0.015 * fresnel) * damp;
}

/**
 * Mirrors out-of-range UVs and clamps safely to [0.001, 0.999] to prevent black border pixels.
 */
export function safeLensUv(uv: UV): UV {
  const mod2 = (val: number) => Math.abs(val) % 2.0;
  const mirror = (val: number) => 1.0 - Math.abs(1.0 - mod2(val));
  const clamp = (val: number) => Math.min(Math.max(val, 0.001), 0.999);
  return {
    u: clamp(mirror(uv.u)),
    v: clamp(mirror(uv.v)),
  };
}

/**
 * Returns the next slide index in a circular slide deck.
 */
export function getNextSlideIndex(currentIndex: number, totalSlides = 2): number {
  if (totalSlides <= 0) return 0;
  return (currentIndex + 1) % totalSlides;
}
