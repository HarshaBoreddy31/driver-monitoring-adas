import { describe, it, expect } from 'vitest';
import { DistanceCalculator } from '../src/distance/DistanceCalculator';

describe('DistanceCalculator (Authoritative Kinematics & Spatial Math)', () => {
  it('calculates true Euclidean distance correctly: sqrt((x2 - x1)^2 + (y2 - y1)^2)', () => {
    // 3-4-5 right triangle: dx = 3, dy = 4 -> Euclidean distance = 5
    const metrics = DistanceCalculator.calculate(
      0, 0, 25.0, // our car at (0, 0)
      3, 4, 25.0  // target at (3, 4)
    );

    expect(metrics.euclideanDistance).toBe(5.0);
    expect(metrics.longitudinalDistance).toBe(4.0);
    expect(metrics.lateralDistance).toBe(3.0);
  });

  it('accurately calculates collinear straight-line distance along lane', () => {
    const metrics = DistanceCalculator.calculate(
      0, 0, 20.0,
      0, 35.0, 20.0
    );

    expect(metrics.euclideanDistance).toBe(35.0);
    expect(metrics.longitudinalDistance).toBe(35.0);
    expect(metrics.lateralDistance).toBe(0.0);
    expect(metrics.relativePosition).toBe('front');
  });

  it('classifies relative positions correctly around the vehicle', () => {
    // Front-Left (dx = -3.6m, dy = 30m)
    expect(DistanceCalculator.classifyPosition(-3.6, 30.0)).toBe('front-left');

    // Front-Right (dx = 3.6m, dy = 30m)
    expect(DistanceCalculator.classifyPosition(3.6, 30.0)).toBe('front-right');

    // Straight Ahead (dx = 0, dy = 25m)
    expect(DistanceCalculator.classifyPosition(0, 25.0)).toBe('front');

    // Directly Behind (dx = 0, dy = -20m)
    expect(DistanceCalculator.classifyPosition(0, -20.0)).toBe('rear');

    // Rear-Left (dx = -3.6m, dy = -25m)
    expect(DistanceCalculator.classifyPosition(-3.6, -25.0)).toBe('rear-left');

    // Rear-Right (dx = 3.6m, dy = -25m)
    expect(DistanceCalculator.classifyPosition(3.6, -25.0)).toBe('rear-right');

    // Adjacent Blindspot Left (dx = -3.6m, dy = 1.0m)
    expect(DistanceCalculator.classifyPosition(-3.6, 1.0)).toBe('adjacent-left');

    // Adjacent Blindspot Right (dx = 3.6m, dy = -1.0m)
    expect(DistanceCalculator.classifyPosition(3.6, -1.0)).toBe('adjacent-right');
  });

  it('computes relative velocity correctly', () => {
    // Our speed = 25 m/s, Target = 20 m/s -> Closing in from behind (v_rel = -5 m/s)
    const metrics = DistanceCalculator.calculate(
      0, 0, 25.0,
      0, 50.0, 20.0
    );

    expect(metrics.relativeVelocity).toBe(-5.0);
  });

  it('computes Time-to-Collision (TTC) accurately for approaching vehicles', () => {
    // Lead vehicle is 30m ahead. Our speed = 30 m/s, Lead = 20 m/s -> Closing speed = 10 m/s
    // Expected TTC = 30 / 10 = 3.0 seconds
    const ttc = DistanceCalculator.calculateTTC(30.0, -10.0, 'same');
    expect(ttc).toBe(3.0);
  });

  it('returns null TTC when vehicles are separating or moving at identical speeds', () => {
    // Opening gap: Target is faster than our car (relativeVelocity > 0)
    expect(DistanceCalculator.calculateTTC(30.0, 5.0, 'same')).toBeNull();

    // Zero relative velocity (identical speeds)
    expect(DistanceCalculator.calculateTTC(30.0, 0.0, 'same')).toBeNull();
  });
});
