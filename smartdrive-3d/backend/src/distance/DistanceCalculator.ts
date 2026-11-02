/**
 * Authoritative Distance & Kinematics Calculation Module
 *
 * Requirements:
 * - Calculate true Euclidean distance: d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
 * - Calculate longitudinal separation along travel axis: |y2 - y1|
 * - Calculate lateral separation across lanes: |x2 - x1|
 * - Calculate relative velocity: v_rel = v_target - v_our
 * - Calculate Time-to-Collision (TTC) with zero/negative closing speed handling
 * - Classify relative position based on road geometry
 */

import { RelativePosition } from '../types';

export interface DistanceMetrics {
  euclideanDistance: number; // In meters, rounded to 2 decimal places
  longitudinalDistance: number; // Along road axis (m)
  lateralDistance: number; // Across road lanes (m)
  relativeVelocity: number; // m/s (negative means closing in ahead)
  relativePosition: RelativePosition;
  timeToCollision: number | null; // Seconds, or null if distance is not decreasing
}

export class DistanceCalculator {
  /**
   * Calculates comprehensive spatial and kinematic metrics between our vehicle and a target vehicle.
   *
   * @param ourX - Reference vehicle lateral position (meters, road center = 0)
   * @param ourY - Reference vehicle longitudinal position (meters)
   * @param ourSpeed - Reference vehicle speed in m/s
   * @param targetX - Target vehicle lateral position (meters)
   * @param targetY - Target vehicle longitudinal position (meters)
   * @param targetSpeed - Target vehicle speed in m/s
   * @param targetDirection - Travel direction ('same' or 'opposite')
   */
  public static calculate(
    ourX: number,
    ourY: number,
    ourSpeed: number,
    targetX: number,
    targetY: number,
    targetSpeed: number,
    targetDirection: 'same' | 'opposite' = 'same'
  ): DistanceMetrics {
    const dx = targetX - ourX;
    const dy = targetY - ourY;

    // 1. Authoritative Euclidean Distance: sqrt((x2 - x1)^2 + (y2 - y1)^2)
    const euclidean = Math.hypot(dx, dy);

    // 2. Separated longitudinal and lateral components
    const longitudinal = Math.abs(dy);
    const lateral = Math.abs(dx);

    // 3. Relative Velocity:
    // When travelling same direction:
    // - v_rel = targetSpeed - ourSpeed
    // - Negative relative velocity when target is ahead means we are closing in (closing speed > 0)
    let relativeVelocity = 0;
    if (targetDirection === 'same') {
      relativeVelocity = targetSpeed - ourSpeed;
    } else {
      // Opposite direction traffic (closing velocity is sum of both speeds)
      relativeVelocity = -(targetSpeed + ourSpeed);
    }

    // 4. Relative Position Classification
    const relativePosition = this.classifyPosition(dx, dy);

    // 5. Time-to-Collision (TTC) Calculation
    // Clearly documented assumptions:
    // - Assumes vehicles maintain current speeds along longitudinal axis
    // - Only valid when closing speed is positive (distance is shrinking)
    // - Handles zero closing speed and opening gaps gracefully by returning null
    const timeToCollision = this.calculateTTC(dy, relativeVelocity, targetDirection);

    return {
      euclideanDistance: Number(euclidean.toFixed(2)),
      longitudinalDistance: Number(longitudinal.toFixed(2)),
      lateralDistance: Number(lateral.toFixed(2)),
      relativeVelocity: Number(relativeVelocity.toFixed(2)),
      relativePosition,
      timeToCollision: timeToCollision !== null ? Number(timeToCollision.toFixed(2)) : null,
    };
  }

  /**
   * Classifies relative position according to lane geometry and longitudinal position.
   */
  public static classifyPosition(dx: number, dy: number): RelativePosition {
    const LANE_THRESHOLD = 1.8; // Half standard lane width (3.6m / 2)
    const ADJACENT_LONGITUDINAL = 3.5; // Vehicle body length overlap margin

    if (dy > ADJACENT_LONGITUDINAL) {
      // Ahead of our vehicle
      if (Math.abs(dx) <= LANE_THRESHOLD) return 'front';
      return dx < -LANE_THRESHOLD ? 'front-left' : 'front-right';
    } else if (dy < -ADJACENT_LONGITUDINAL) {
      // Behind our vehicle
      if (Math.abs(dx) <= LANE_THRESHOLD) return 'rear';
      return dx < -LANE_THRESHOLD ? 'rear-left' : 'rear-right';
    } else {
      // Alongside our vehicle (in blind spots or adjacent lanes)
      if (dx < -1.0) return 'adjacent-left';
      if (dx > 1.0) return 'adjacent-right';
      return 'front'; // Center proximity overlap
    }
  }

  /**
   * Computes Time-To-Collision (TTC) in seconds.
   *
   * Formula:
   * When target is ahead (dy > 0): closing rate is -relativeVelocity = ourSpeed - targetSpeed.
   * TTC = dy / (ourSpeed - targetSpeed).
   *
   * When target is behind (dy < 0): closing rate is relativeVelocity = targetSpeed - ourSpeed.
   * TTC = |dy| / (targetSpeed - ourSpeed).
   */
  public static calculateTTC(
    dy: number,
    relativeVelocity: number,
    direction: 'same' | 'opposite'
  ): number | null {
    if (direction === 'opposite') {
      const closingSpeed = Math.abs(relativeVelocity);
      if (closingSpeed > 0.1 && dy > 0) {
        return dy / closingSpeed;
      }
      return null;
    }

    if (dy > 0.5) {
      // Target is ahead: distance shrinks if relativeVelocity < 0 (ourSpeed > targetSpeed)
      const closingSpeed = -relativeVelocity;
      if (closingSpeed > 0.2) {
        const ttc = dy / closingSpeed;
        return ttc >= 0 && ttc <= 60.0 ? ttc : null;
      }
    } else if (dy < -0.5) {
      // Target is behind: distance shrinks if relativeVelocity > 0 (targetSpeed > ourSpeed)
      const closingSpeed = relativeVelocity;
      if (closingSpeed > 0.2) {
        const ttc = Math.abs(dy) / closingSpeed;
        return ttc >= 0 && ttc <= 60.0 ? ttc : null;
      }
    }

    // Opening gap or identical speeds -> No imminent collision
    return null;
  }
}
