"""
Monocular Vehicle Distance Estimation and Relative Position Classifier.
Uses ground-plane optical geometry and physical vehicle bounding box projection.
Calculates distance in meters and classifies relative position:
- Front Vehicle
- Front-Left Vehicle
- Front-Right Vehicle
- Left Rear Vehicle
- Right Rear Vehicle
"""

import math
import numpy as np

class MonocularDistanceEstimator:
    def __init__(self, camera_height_m=1.35, fov_horizontal_deg=55.0, horizon_ratio=0.285):
        """
        camera_height_m: Height of dashcam above ground plane (typically 1.2m - 1.4m)
        fov_horizontal_deg: Lens horizontal field of view
        horizon_ratio: Vertical position of road vanishing line / horizon (0.28 - 0.35)
        """
        self.H_cam = camera_height_m
        self.fov_h = math.radians(fov_horizontal_deg)
        self.horizon_ratio = horizon_ratio

        # Vehicle physical average widths (meters)
        self.vehicle_real_widths = {
            "car": 1.82,
            "truck": 2.50,
            "bus": 2.55,
            "motorcycle": 0.85
        }

        # Distance smoothing buffer per track ID: {track_id: smoothed_distance}
        self.track_distance_history = {}
        self.smooth_alpha = 0.65 # EMA filter weight

    def estimate(self, vehicle, frame_width, frame_height):
        """
        Estimates the metric distance (meters) and relative position of a detected vehicle.
        Returns:
            dict containing:
                distance_m (float or None)
                distance_str (str)
                position_label (str)
                status_color (str: 'RED', 'ORANGE', 'GREEN')
                lateral_x_m (float)
                is_available (bool)
        """
        W = frame_width
        H = frame_height

        # Dashcam Focal Lengths (pixels, calibrated for forward automotive perspective)
        f_x = 2400.0 * (W / 1024.0)
        f_y = 2650.0 * (H / 682.0)

        u_0 = W / 2.0
        v_horizon = self.horizon_ratio * H

        foot_x = vehicle.foot_x
        foot_y = vehicle.foot_y
        bbox_w = vehicle.width
        bbox_h = vehicle.height

        # Sanity Check: If vehicle footpoint is above or right at horizon, distance is unavailable
        delta_v = foot_y - v_horizon
        if delta_v <= 5.0 or bbox_w <= 6.0:
            return {
                "distance_m": None,
                "distance_str": "Distance unavailable",
                "position_label": "Nearby Vehicle",
                "status_color": "ORANGE",
                "lateral_x_m": 0.0,
                "is_available": False
            }

        # 1. Ground Plane Geometry Distance: Z = (H_cam * f_y) / delta_v
        Z_ground = (self.H_cam * f_y) / delta_v

        # 2. Bounding Box Physical Width Distance: Z = (W_real * f_x) / bbox_w
        is_side_perspective = (foot_y > 0.52 * H) or (abs(foot_x - u_0) > 0.28 * W)
        W_real = 2.45 if is_side_perspective else self.vehicle_real_widths.get(vehicle.class_name, 1.82)
        Z_width = (W_real * f_x) / bbox_w

        # 3. Robust Fusion:
        if foot_y > 0.52 * H:
            # Near vehicles alongside our car (side / blind spot / rear)
            raw_dist = 0.55 * Z_ground + 0.45 * Z_width
        else:
            # Forward vehicles (ground contact point dominant)
            ground_weight = min(0.85, max(0.40, delta_v / (0.35 * H)))
            raw_dist = (ground_weight * Z_ground) + ((1.0 - ground_weight) * Z_width)

        # 4. Temporal Smoothing (EMA) per track ID
        tid = vehicle.track_id
        if tid in self.track_distance_history:
            prev_dist = self.track_distance_history[tid]
            smoothed_dist = self.smooth_alpha * raw_dist + (1.0 - self.smooth_alpha) * prev_dist
        else:
            smoothed_dist = raw_dist

        self.track_distance_history[tid] = smoothed_dist
        dist_m = max(1.5, min(150.0, smoothed_dist))

        # 5. Lateral Road Offset in meters: X = ((foot_x - u_0) * dist_m) / f_x
        X_m = ((foot_x - u_0) * dist_m) / f_x

        # 6. Relative Position Classification
        # Center lane: |X_m| <= 1.85m
        # Left lane: X_m < -1.85m
        # Right lane: X_m > 1.85m
        if abs(X_m) <= 1.85:
            pos_label = "Front Vehicle"
        elif X_m < -1.85:
            if dist_m >= 22.0:
                pos_label = "Front-Left Vehicle"
            else:
                pos_label = "Left Rear Vehicle"
        else:
            if dist_m >= 22.0:
                pos_label = "Front-Right Vehicle"
            else:
                pos_label = "Right Rear Vehicle"

        # 7. ADAS Warning Color Coding
        # Red: Danger / Front vehicle within critical distance (<= 36m) or close side (< 12m)
        # Orange: Caution (Side vehicle in near blind spot <= 22m, or Front vehicle 36-48m)
        # Green: Safe (> 48m front, > 22m side)
        if pos_label == "Front Vehicle":
            if dist_m <= 38.0:
                status = "RED"
            elif dist_m <= 50.0:
                status = "ORANGE"
            else:
                status = "GREEN"
        else:
            # Side / Rear Vehicles
            if dist_m < 12.0:
                status = "RED"
            elif dist_m <= 22.0:
                status = "ORANGE"
            else:
                status = "GREEN"

        return {
            "distance_m": round(dist_m, 1),
            "distance_str": f"{int(round(dist_m))} m",
            "position_label": pos_label,
            "status_color": status,
            "lateral_x_m": round(X_m, 2),
            "is_available": True
        }
