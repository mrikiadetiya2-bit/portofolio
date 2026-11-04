import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCoverUv,
  computeDistortionDamp,
  computeExponentialSphereRadius,
  computeSphereNormal,
  computeChromaticOffset,
  safeLensUv,
  getNextSlideIndex,
} from './sliderMath';

test('computeCoverUv preserves UV on matching 16:9 aspect ratio', () => {
  const uv = computeCoverUv(
    { u: 0.25, v: 0.75 },
    { width: 1920, height: 1080 },
    { width: 1600, height: 900 }
  );
  assert.ok(Math.abs(uv.u - 0.25) < 1e-6);
  assert.ok(Math.abs(uv.v - 0.75) < 1e-6);
});

test('computeDistortionDamp follows pow(1 - uProgress, 1.8) and reaches 0 at completion', () => {
  assert.equal(computeDistortionDamp(0.0), 1.0);
  assert.ok(computeDistortionDamp(0.6) < 0.25);
  assert.equal(computeDistortionDamp(1.0), 0.0);
});

test('computeChromaticOffset stays within anti-ghosting bound <= 0.02 and decays to 0', () => {
  const rimStartCA = computeChromaticOffset(1.0, 0.0);
  assert.ok(rimStartCA >= 0.012 && rimStartCA <= 0.02);
  assert.equal(computeChromaticOffset(1.0, 1.0), 0.0);
});

test('computeExponentialSphereRadius reaches maxRadius >= 2.8 at progress 1.0', () => {
  const endRadius = computeExponentialSphereRadius(1.0);
  assert.ok(endRadius >= 2.8);
});

test('computeSphereNormal returns z = 1 at center and z -> 0 at rim', () => {
  const centerNormal = computeSphereNormal(0, 0);
  assert.ok(Math.abs(centerNormal.z - 1.0) < 1e-5);

  const rimNormal = computeSphereNormal(1, 0);
  assert.ok(rimNormal.x > 0.99);
  assert.ok(rimNormal.z < 0.01);
});

test('safeLensUv clamps and mirrors out-of-bounds UVs inside [0.001, 0.999]', () => {
  const clamped = safeLensUv({ u: -0.25, v: 1.35 });
  assert.ok(clamped.u >= 0.001 && clamped.u <= 0.999);
  assert.ok(clamped.v >= 0.001 && clamped.v <= 0.999);
});

test('getNextSlideIndex cycles cleanly between 0 and 1', () => {
  assert.equal(getNextSlideIndex(0, 2), 1);
  assert.equal(getNextSlideIndex(1, 2), 0);
});
