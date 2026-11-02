"""
Advanced ADAS Multi-Lane Highway Vehicle Radar & Distance System.
Full Vehicle Dynamics Control for OUR CAR:
- Gas (W), Smooth Brake (S), Lane Change Left (A), Lane Change Right (D), ABS Stop (Space).
- 3-Lane 3D Isometric Highway with moving dashed lines and roadside curbs.
- Multiple surrounding vehicles (Front, Rear, Left Lane, Right Lane).
- 3D Double-Ended Distance Arrows with exact metric tags (matching reference image).
- Forward Collision Warning (FCW) & Rear Tailgating Alert (RCW).
- Blind Spot Monitoring (BSM) on adjacent lanes.
- Concurrent Background Driver Eye-Tracking & Attentiveness PiP Fusion.
"""

import time
import math
import threading
import cv2
import numpy as np

from eye_tracker import EyeTracker, SyntheticDriverGenerator
from audio_alert import AudioAlarmSystem


# =====================================================================
# 1. Concurrent Background Driver Camera Worker
# =====================================================================
class DriverCameraWorker:
    """
    Runs in the background, continuously analyzing driver facial attentiveness,
    PERCLOS fatigue, and eye tracking without blocking the main ADAS graphics loop.
    """
    def __init__(self):
        self.tracker = EyeTracker()
        self.cap = cv2.VideoCapture(0)
        self.is_real_camera = True
        self.synthetic_gen = None

        if not self.cap.isOpened():
            self.is_real_camera = False
            self.synthetic_gen = SyntheticDriverGenerator(640, 480)
        else:
            ret, test_frame = self.cap.read()
            if not ret or test_frame is None:
                self.is_real_camera = False
                self.synthetic_gen = SyntheticDriverGenerator(640, 480)
                self.cap.release()

        self._stop_event = threading.Event()
        self._lock = threading.Lock()
        self.latest_data = {
            "face_detected": False,
            "status": "ALERT",
            "risk_level": 0,
            "perclos": 0.0,
            "distance_cm": 50.0,
            "closed_duration": 0.0,
            "blink_count": 0,
            "blink_rate_bpm": 15
        }
        self.latest_frame = None

        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def _run_loop(self):
        while not self._stop_event.is_set():
            if self.is_real_camera:
                ret, frame = self.cap.read()
                if not ret or frame is None:
                    time.sleep(0.03)
                    continue
                frame = cv2.flip(frame, 1)
            else:
                frame = self.synthetic_gen.get_frame()

            data = self.tracker.process_frame(frame)

            # Draw minimal annotations on PiP frame
            if data["face_detected"] and data["face_box"] is not None:
                fx, fy, fw, fh = data["face_box"]
                f_col = (0, 230, 255) if data["risk_level"] == 0 else (
                    (0, 165, 255) if data["risk_level"] == 1 else (0, 0, 255)
                )
                cv2.rectangle(frame, (fx, fy), (fx + fw, fy + fh), f_col, 2)
                for (ex, ey, ew, eh) in data.get("eye_boxes", []):
                    e_col = (0, 255, 100) if data["eyes_open"] else (0, 0, 255)
                    cv2.rectangle(frame, (ex, ey), (ex + ew, ey + eh), e_col, 1)

            with self._lock:
                self.latest_data = data
                self.latest_frame = frame

            time.sleep(0.02)

    def get_data(self):
        with self._lock:
            return dict(self.latest_data)

    def get_frame(self):
        with self._lock:
            return None if self.latest_frame is None else self.latest_frame.copy()

    def shutdown(self):
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        if self.is_real_camera and self.cap.isOpened():
            self.cap.release()


# =====================================================================
# 2. Isometric 3D Math & Highway Projection
# =====================================================================
def iso_project(x, y, z=0.0, origin=(520, 340), scale=2.7):
    """
    Standard 30-degree isometric projection:
    x: along road (top-left -> bottom-right)
    y: across lanes (left -> right)
    z: elevation (upwards)
    """
    cos30 = 0.866025
    sin30 = 0.500000
    ox, oy = origin
    sx = int(ox + (x - y) * cos30 * scale)
    sy = int(oy + (x + y) * sin30 * scale - z * scale)
    return (sx, sy)


def draw_iso_box(img, x, y, z, dx, dy, dz, color_top, color_left, color_right, origin=(520, 340), scale=2.7):
    """Renders a 3D box with directional isometric lighting."""
    v1 = iso_project(x + dx, y, z, origin, scale)
    v2 = iso_project(x + dx, y + dy, z, origin, scale)
    v3 = iso_project(x, y + dy, z, origin, scale)
    v5 = iso_project(x + dx, y, z + dz, origin, scale)
    v6 = iso_project(x + dx, y + dy, z + dz, origin, scale)
    v7 = iso_project(x, y + dy, z + dz, origin, scale)

    # Left face (facing bottom-left)
    poly_left = np.array([v3, v2, v6, v7], dtype=np.int32)
    cv2.fillPoly(img, [poly_left], color_left)
    cv2.polylines(img, [poly_left], True, (25, 28, 32), 1)

    # Right face (facing bottom-right)
    poly_front = np.array([v1, v2, v6, v5], dtype=np.int32)
    cv2.fillPoly(img, [poly_front], color_right)
    cv2.polylines(img, [poly_front], True, (25, 28, 32), 1)

    # Top face
    poly_top = np.array([iso_project(x, y, z + dz, origin, scale), v5, v6, v7], dtype=np.int32)
    cv2.fillPoly(img, [poly_top], color_top)
    cv2.polylines(img, [poly_top], True, (25, 28, 32), 1)


def draw_iso_car(img, cx, cy, car_color, label="", is_ego=False, brake_lights_on=False,
                 steer_angle=0.0, origin=(520, 340), scale=2.7):
    """
    Renders an isometric car with detailed bodywork, wheels, windshield,
    functional headlights, and functional brake lights.
    """
    length = 22.0
    width = 9.4

    x = cx - length / 2.0
    y = cy - width / 2.0

    # Ground Drop Shadow
    s1 = iso_project(x - 2, y - 2, 0, origin, scale)
    s2 = iso_project(x + length + 2, y - 2, 0, origin, scale)
    s3 = iso_project(x + length + 2, y + width + 2, 0, origin, scale)
    s4 = iso_project(x - 2, y + width + 2, 0, origin, scale)
    cv2.fillPoly(img, [np.array([s1, s2, s3, s4], dtype=np.int32)], (48, 52, 60))

    cb, cg, cr = car_color
    col_top = (int(cb), int(cg), int(cr))
    col_left = (int(cb * 0.78), int(cg * 0.78), int(cr * 0.78))
    col_front = (int(cb * 0.58), int(cg * 0.58), int(cr * 0.58))

    # 1. Lower Body Chassis (z=0.8 to 5.2)
    draw_iso_box(img, x, y, 0.8, length, width, 4.4, col_top, col_left, col_front, origin, scale)

    # 2. Cabin / Roof (z=5.2 to 8.8)
    roof_len = 12.0
    roof_w = 7.8
    rx = x + 3.8
    ry = y + 0.8
    glass_left = (120, 150, 175)
    glass_front = (90, 120, 145)
    draw_iso_box(img, rx, ry, 5.2, roof_len, roof_w, 3.6, col_top, glass_left, glass_front, origin, scale)

    # 3. Functional Headlights (Front face of car)
    hl_color = (230, 255, 255)
    hl1 = iso_project(x + length + 0.1, y + 1.0, 2.2, origin, scale)
    hl2 = iso_project(x + length + 0.1, y + 3.0, 2.2, origin, scale)
    hl3 = iso_project(x + length + 0.1, y + 3.0, 3.8, origin, scale)
    hl4 = iso_project(x + length + 0.1, y + 1.0, 3.8, origin, scale)
    cv2.fillPoly(img, [np.array([hl1, hl2, hl3, hl4], dtype=np.int32)], hl_color)

    hl5 = iso_project(x + length + 0.1, y + width - 3.0, 2.2, origin, scale)
    hl6 = iso_project(x + length + 0.1, y + width - 1.0, 2.2, origin, scale)
    hl7 = iso_project(x + length + 0.1, y + width - 1.0, 3.8, origin, scale)
    hl8 = iso_project(x + length + 0.1, y + width - 3.0, 3.8, origin, scale)
    cv2.fillPoly(img, [np.array([hl5, hl6, hl7, hl8], dtype=np.int32)], hl_color)

    # 4. Functional Taillights / Brake Lights (Rear face of car)
    tl_color = (0, 0, 255) if brake_lights_on else (0, 0, 160)
    tl1 = iso_project(x - 0.1, y + 1.0, 2.4, origin, scale)
    tl2 = iso_project(x - 0.1, y + 3.0, 2.4, origin, scale)
    tl3 = iso_project(x - 0.1, y + 3.0, 3.8, origin, scale)
    tl4 = iso_project(x - 0.1, y + 1.0, 3.8, origin, scale)
    cv2.fillPoly(img, [np.array([tl1, tl2, tl3, tl4], dtype=np.int32)], tl_color)

    tl5 = iso_project(x - 0.1, y + width - 3.0, 2.4, origin, scale)
    tl6 = iso_project(x - 0.1, y + width - 1.0, 2.4, origin, scale)
    tl7 = iso_project(x - 0.1, y + width - 1.0, 3.8, origin, scale)
    tl8 = iso_project(x - 0.1, y + width - 3.0, 3.8, origin, scale)
    cv2.fillPoly(img, [np.array([tl5, tl6, tl7, tl8], dtype=np.int32)], tl_color)

    if brake_lights_on:
        # Taillight bloom / halo when braking
        cv2.circle(img, tl2, 8, (0, 0, 240), -1)
        cv2.circle(img, tl6, 8, (0, 0, 240), -1)

    # 5. Label Badge
    lbl_pos = iso_project(cx, cy, 14.5, origin, scale)
    if label:
        (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.40, 1)
        bx, by = lbl_pos[0] - lw // 2, lbl_pos[1]
        cv2.rectangle(img, (bx - 5, by - lh - 4), (bx + lw + 5, by + 4), (18, 22, 28), -1)
        lbl_border = (56, 189, 248) if is_ego else (200, 210, 225)
        cv2.rectangle(img, (bx - 5, by - lh - 4), (bx + lw + 5, by + 4), lbl_border, 1)
        cv2.putText(img, label, (bx, by - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.40, lbl_border, 1)


def draw_3d_double_arrow(img, x1, x2, y=0.0, distance_m=70.0, alert_level=0, origin=(520, 340), scale=2.7):
    """
    Renders an extruded 3D double-ended arrow on the roadway with metric distance text.
    Matches the user's reference image!
    """
    x_min = min(x1, x2)
    x_max = max(x1, x2)
    gap = x_max - x_min
    if gap < 8.0:
        return

    head_len = min(5.5, gap * 0.28)
    shaft_half_w = 1.6
    head_half_w = 4.2

    if alert_level == 2:
        col_top = (0, 0, 240)       # Red
        col_side = (0, 0, 140)
        border_col = (255, 255, 255)
    elif alert_level == 1:
        col_top = (0, 160, 245)     # Amber
        col_side = (0, 100, 160)
        border_col = (255, 255, 255)
    else:
        col_top = (165, 115, 60)    # Slate Blue / Dark Cyan (as in reference pic)
        col_side = (100, 70, 35)
        border_col = (220, 235, 255)

    poly_2d = [
        (x_min, y),
        (x_min + head_len, y - head_half_w),
        (x_min + head_len, y - shaft_half_w),
        (x_max - head_len, y - shaft_half_w),
        (x_max - head_len, y - head_half_w),
        (x_max, y),
        (x_max - head_len, y + head_half_w),
        (x_max - head_len, y + shaft_half_w),
        (x_min + head_len, y + shaft_half_w),
        (x_min + head_len, y + head_half_w)
    ]

    # Shadow
    shadow_pts = np.array([iso_project(px, py, 0.0, origin, scale) for px, py in poly_2d], dtype=np.int32)
    cv2.fillPoly(img, [shadow_pts], (45, 50, 56))

    # 3D Extrusion
    z_bot = 0.2
    z_top = 1.6
    for i in range(len(poly_2d)):
        p_curr = poly_2d[i]
        p_next = poly_2d[(i + 1) % len(poly_2d)]
        if (p_next[1] - p_curr[1]) >= -0.01 or (p_next[0] - p_curr[0]) >= -0.01:
            b1 = iso_project(p_curr[0], p_curr[1], z_bot, origin, scale)
            b2 = iso_project(p_next[0], p_next[1], z_bot, origin, scale)
            t2 = iso_project(p_next[0], p_next[1], z_top, origin, scale)
            t1 = iso_project(p_curr[0], p_curr[1], z_top, origin, scale)
            cv2.fillPoly(img, [np.array([b1, b2, t2, t1], dtype=np.int32)], col_side)

    # Top surface
    top_pts = np.array([iso_project(px, py, z_top, origin, scale) for px, py in poly_2d], dtype=np.int32)
    cv2.fillPoly(img, [top_pts], col_top)
    cv2.polylines(img, [top_pts], True, border_col, 1)

    # Bold 3D Metric Text (e.g. "70 m")
    dist_str = f"{int(distance_m)} m"
    mid_x = (x_min + x_max) / 2.0
    text_pos = iso_project(mid_x, y, z_top + 2.0, origin, scale)

    (tw, th), _ = cv2.getTextSize(dist_str, cv2.FONT_HERSHEY_DUPLEX, 0.78, 2)
    tx, ty = text_pos[0] - tw // 2, text_pos[1]

    cv2.rectangle(img, (tx - 6, ty - th - 6), (tx + tw + 6, ty + 6), (18, 22, 28), -1)
    cv2.rectangle(img, (tx - 6, ty - th - 6), (tx + tw + 6, ty + 6), border_col, 1)
    cv2.putText(img, dist_str, (tx, ty), cv2.FONT_HERSHEY_DUPLEX, 0.78, (255, 255, 255), 2)


# =====================================================================
# 3. Advanced ADAS Highway Radar System Engine
# =====================================================================
def run_adas():
    print("\n" + "=" * 70)
    print("  ADVANCED ADAS HIGHWAY RADAR & COLLISION AVOIDANCE SYSTEM")
    print("  Full Vehicle Dynamics Control | 3-Lane Highway | Multi-Car Radar")
    print("=" * 70)

    # Subsystems
    cam_worker = DriverCameraWorker()
    alarm = AudioAlarmSystem()

    window_name = "ADAS Surrounding Vehicle Radar & Distance System"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 1140, 740)

    # -------------------------------------------------------------
    # OUR VEHICLE (EGO CAR - YELLOW) DYNAMICS STATE
    # -------------------------------------------------------------
    ego_speed = 70.0               # km/h
    ego_lane_index = 1             # 0: Left Lane (-13.0), 1: Center Lane (0.0), 2: Right Lane (+13.0)
    lane_y_positions = [-13.0, 0.0, 13.0]
    ego_current_y = 0.0            # Smooth interpolated lateral position
    ego_steer_angle = 0.0          # Current steering angle
    is_braking = False             # Controls brake lights & deceleration
    emergency_brake = False        # ABS hard stop

    # -------------------------------------------------------------
    # SURROUNDING TRAFFIC FLEET
    # -------------------------------------------------------------
    # 1. Lead Vehicle in Center Lane (Ahead of us)
    lead_dist = 70.0               # meters
    lead_speed = 68.0              # km/h
    lead_lane = 1

    # 2. Trailing Vehicle in Center Lane (Behind us)
    trail_dist = 45.0              # meters
    trail_speed = 68.0             # km/h
    trail_lane = 1

    # 3. Left Lane Passing Car (White Sports Car)
    left_car_dist = 20.0           # meters ahead in left lane
    left_car_speed = 85.0          # faster cruising speed

    # 4. Right Lane Slow Car (Green Compact Truck)
    right_car_dist = -15.0         # meters behind in right lane
    right_car_speed = 55.0         # slower truck

    # Simulation State
    lane_stripe_offset = 0.0
    auto_traffic = True
    tailgate_hazard = False
    last_time = time.time()
    flash_toggle = False
    flash_timer = time.time()

    print("\nVehicle Controls (OUR CAR):")
    print("  [W] / [Up]    : Accelerate Our Car forward (Gas Pedal)")
    print("  [S] / [Down]  : Brake Our Car (Illuminates Red Brake Lights)")
    print("  [A] / [Left]  : Change Lane Left (Steer Left)")
    print("  [D] / [Right] : Change Lane Right (Steer Right)")
    print("  [Space]       : Autonomous Emergency Braking (AEB Hard Stop)")
    print("  [R]           : Trigger Rear Aggressive Tailgater Hazard")
    print("  [T]           : Toggle Auto-Traffic Behavior Mode")
    print("  [M]           : Mute / Unmute Audio Safety Sirens")
    print("  [Q] / [ESC]   : Exit Application")
    print("-" * 70 + "\n")

    try:
        while True:
            now = time.time()
            dt = min(now - last_time, 0.1)
            last_time = now

            # ---------------------------------------------------------
            # 1. OUR VEHICLE DYNAMICS PHYSICS (EGO VEHICLE)
            # ---------------------------------------------------------
            # Natural speed deceleration / coasting when no pedals pressed
            if emergency_brake:
                ego_speed = max(0.0, ego_speed - 50.0 * dt)
                is_braking = True
                if ego_speed <= 0.5:
                    emergency_brake = False
            elif is_braking:
                ego_speed = max(0.0, ego_speed - 24.0 * dt)
            else:
                # Drag & coasting
                if ego_speed > 40.0:
                    ego_speed = max(40.0, ego_speed - 1.5 * dt)

            # Smooth lateral steering interpolation towards target lane
            target_y = lane_y_positions[ego_lane_index]
            y_diff = target_y - ego_current_y
            ego_current_y += y_diff * min(1.0, 7.0 * dt)
            ego_steer_angle = float(np.clip(y_diff * 4.0, -25.0, 25.0))

            # Move road stripes at ego vehicle speed
            lane_stripe_offset = (lane_stripe_offset + (ego_speed / 3.6) * dt * 2.8) % 24.0

            # ---------------------------------------------------------
            # 2. SURROUNDING TRAFFIC BEHAVIOR SIMULATION
            # ---------------------------------------------------------
            if auto_traffic:
                # Lead car natural speed variation (cruises ~65km/h, occasionally slows down)
                cycle = (now * 0.35) % 12.0
                if 4.0 <= cycle <= 7.0:
                    lead_speed = max(38.0, lead_speed - 10.0 * dt)
                else:
                    lead_speed = min(72.0, lead_speed + 6.0 * dt)

                # Trailing car
                if tailgate_hazard:
                    trail_speed = min(100.0, trail_speed + 16.0 * dt) # Closes in fast from behind!
                else:
                    trail_speed = ego_speed + math.sin(now * 0.7) * 3.5

            # Relative distance kinematics (m/s)
            delta_v_lead = (ego_speed - lead_speed) / 3.6
            lead_dist = max(3.0, min(140.0, lead_dist - delta_v_lead * dt))

            delta_v_trail = (trail_speed - ego_speed) / 3.6
            trail_dist = max(3.0, min(130.0, trail_dist - delta_v_trail * dt))

            # Adjacent traffic movement
            delta_v_left = (left_car_speed - ego_speed) / 3.6
            left_car_dist += delta_v_left * dt
            if left_car_dist > 120.0: left_car_dist = -90.0
            if left_car_dist < -100.0: left_car_dist = 110.0

            delta_v_right = (right_car_speed - ego_speed) / 3.6
            right_car_dist += delta_v_right * dt
            if right_car_dist > 120.0: right_car_dist = -90.0
            if right_car_dist < -100.0: right_car_dist = 110.0

            # ---------------------------------------------------------
            # 3. BACKGROUND DRIVER MONITORING FUSION
            # ---------------------------------------------------------
            driver_data = cam_worker.get_data()
            driver_frame = cam_worker.get_frame()
            is_driver_impaired = (driver_data.get("risk_level", 0) >= 1)

            # ---------------------------------------------------------
            # 4. ADAS SAFETY & COLLISION WARNING METRICS
            # ---------------------------------------------------------
            # Expand safe distance margin by 50% if driver is drowsy/distracted
            crit_dist_thresh = 40.0 if is_driver_impaired else 25.0
            caut_dist_thresh = 65.0 if is_driver_impaired else 45.0

            # Front Time-To-Collision (TTC)
            if delta_v_lead > 0.4 and ego_lane_index == lead_lane:
                ttc_lead = max(0.1, (lead_dist - 4.5) / delta_v_lead)
            else:
                ttc_lead = 99.9

            # Forward Collision Warning (FCW)
            lead_alert_level = 0
            if ego_lane_index == lead_lane:
                if lead_dist < crit_dist_thresh or ttc_lead < 2.4:
                    lead_alert_level = 2 # Critical
                elif lead_dist < caut_dist_thresh or ttc_lead < 4.5:
                    lead_alert_level = 1 # Caution

            # Rear Collision Warning (RCW / Tailgating Alert)
            trail_alert_level = 0
            if ego_lane_index == trail_lane:
                if trail_dist < 18.0 and delta_v_trail > 0:
                    trail_alert_level = 2
                elif trail_dist < 32.0:
                    trail_alert_level = 1

            # Blind Spot Monitoring (BSM) for adjacent lanes
            bsm_left = False
            bsm_right = False
            if abs(left_car_dist) < 18.0:
                bsm_left = True
            if abs(right_car_dist) < 18.0:
                bsm_right = True

            # Automatic Emergency Braking (AEB)
            if ego_lane_index == lead_lane and (lead_dist < 11.5 or ttc_lead < 1.2) and ego_speed > 10.0:
                emergency_brake = True

            # Trigger Acoustic Safety Chimes
            if lead_alert_level == 2:
                alarm.trigger_alarm(2) # Urgent siren
            elif trail_alert_level == 2:
                alarm.trigger_alarm(1) # Caution chime
            elif lead_alert_level == 1:
                alarm.trigger_alarm(1)
            else:
                alarm.stop_alarm()

            # ---------------------------------------------------------
            # 5. RENDER 3D ISOMETRIC HIGHWAY (MATCHING REFERENCE IMAGE)
            # ---------------------------------------------------------
            screen = np.full((740, 1140, 3), (32, 35, 42), dtype=np.uint8)

            # 3-Lane Road Plane (x: -180 to 180, y: -24 to 24)
            r_p1 = iso_project(-175, -24, 0)
            r_p2 = iso_project(175, -24, 0)
            r_p3 = iso_project(175, 24, 0)
            r_p4 = iso_project(-175, 24, 0)
            cv2.fillPoly(screen, [np.array([r_p1, r_p2, r_p3, r_p4], dtype=np.int32)], (115, 120, 128))

            # Left & Right 3D Concrete Curbs
            curb_l1 = iso_project(-175, -26, 0)
            curb_l2 = iso_project(175, -26, 0)
            curb_l3 = iso_project(175, -24, 0)
            curb_l4 = iso_project(-175, -24, 0)
            cv2.fillPoly(screen, [np.array([curb_l1, curb_l2, curb_l3, curb_l4], dtype=np.int32)], (180, 185, 192))
            cv2.polylines(screen, [np.array([curb_l1, curb_l2, curb_l3, curb_l4], dtype=np.int32)], True, (135, 140, 146), 1)

            curb_r1 = iso_project(-175, 24, 0)
            curb_r2 = iso_project(175, 24, 0)
            curb_r3 = iso_project(175, 26, 0)
            curb_r4 = iso_project(-175, 26, 0)
            cv2.fillPoly(screen, [np.array([curb_r1, curb_r2, curb_r3, curb_r4], dtype=np.int32)], (180, 185, 192))
            cv2.polylines(screen, [np.array([curb_r1, curb_r2, curb_r3, curb_r4], dtype=np.int32)], True, (135, 140, 146), 1)

            # Dashed White Lane Dividers (at y = -6.5 and y = +6.5)
            stripe_len = 12.0
            stripe_gap = 12.0
            period = stripe_len + stripe_gap
            for lane_divider_y in [-6.5, 6.5]:
                for sx in np.arange(-170, 170, period):
                    s_start = sx + lane_stripe_offset
                    s_end = s_start + stripe_len
                    sp1 = iso_project(s_start, lane_divider_y - 0.7, 0.1)
                    sp2 = iso_project(s_end, lane_divider_y - 0.7, 0.1)
                    sp3 = iso_project(s_end, lane_divider_y + 0.7, 0.1)
                    sp4 = iso_project(s_start, lane_divider_y + 0.7, 0.1)
                    cv2.fillPoly(screen, [np.array([sp1, sp2, sp3, sp4], dtype=np.int32)], (240, 245, 255))

            # ---------------------------------------------------------
            # 6. RENDER 3D VEHICLES & EXTRUDED DISTANCE ARROWS
            # ---------------------------------------------------------
            # Coordinates in 3D scene (1 meter = 0.85 road units)
            ego_x = 0.0
            front_x = ego_x + (lead_dist * 0.85)
            rear_x = ego_x - (trail_dist * 0.85)
            left_x = ego_x + (left_car_dist * 0.85)
            right_x = ego_x + (right_car_dist * 0.85)

            # A. 3D Double-Ended Distance Arrow to Lead Car (if in same lane)
            if ego_lane_index == lead_lane and lead_dist > 6.0:
                draw_3d_double_arrow(screen, ego_x + 11.5, front_x - 11.5, y=lane_y_positions[lead_lane],
                                     distance_m=lead_dist, alert_level=lead_alert_level)

            # B. 3D Double-Ended Distance Arrow to Trailing Car (if in same lane)
            if ego_lane_index == trail_lane and trail_dist > 6.0 and rear_x > -155.0:
                draw_3d_double_arrow(screen, rear_x + 11.5, ego_x - 11.5, y=lane_y_positions[trail_lane],
                                     distance_m=trail_dist, alert_level=trail_alert_level)

            # C. Render Traffic Vehicles in Proper Depth Order
            # 1. Trailing Car (Center Lane Behind - Blue Sedan)
            if rear_x > -155.0:
                draw_iso_car(screen, rear_x, lane_y_positions[trail_lane], (180, 130, 80),
                             label="REAR VEHICLE", is_ego=False)

            # 2. Right Lane Vehicle (Green Compact)
            if -150.0 < right_x < 150.0:
                draw_iso_car(screen, right_x, lane_y_positions[2], (80, 175, 90),
                             label="RIGHT LANE", is_ego=False)

            # 3. OUR VEHICLE (EGO CAR - VIBRANT YELLOW, CONTROLLED BY USER!)
            draw_iso_car(screen, ego_x, ego_current_y, (30, 210, 245),
                         label="OUR CAR (YOU)", is_ego=True, brake_lights_on=is_braking,
                         steer_angle=ego_steer_angle)

            # 4. Left Lane Vehicle (White Sports Coupe)
            if -150.0 < left_x < 150.0:
                draw_iso_car(screen, left_x, lane_y_positions[0], (225, 230, 240),
                             label="LEFT LANE", is_ego=False)

            # 5. Lead Vehicle (Center Lane Ahead - Red Sedan)
            draw_iso_car(screen, front_x, lane_y_positions[lead_lane], (40, 40, 230),
                         label="LEAD VEHICLE", is_ego=False)

            # ---------------------------------------------------------
            # 7. TELEMETRY COCKPIT & CONTROLS HUD
            # ---------------------------------------------------------
            # Top Status Bar
            cv2.rectangle(screen, (10, 10), (1130, 44), (18, 22, 28), -1)
            cv2.rectangle(screen, (10, 10), (1130, 44), (45, 55, 70), 1)
            cv2.putText(screen, "ADVANCED ADAS RADAR & SURROUNDING VEHICLE PROXIMITY SYSTEM",
                        (25, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (56, 189, 248), 2)
            cv2.putText(screen, "[RADAR: 360 ACTIVE]", (760, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 230, 100), 1)

            # Left Panel: Our Vehicle Dynamics
            cv2.rectangle(screen, (10, 55), (250, 335), (18, 22, 28), -1)
            cv2.rectangle(screen, (10, 55), (250, 335), (45, 55, 70), 1)
            cv2.putText(screen, "OUR CAR TELEMETRY", (20, 78), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (56, 189, 248), 1)

            # Speedometer
            spd_col = (0, 230, 100) if ego_speed <= 80 else ((0, 165, 255) if ego_speed <= 100 else (0, 0, 255))
            cv2.putText(screen, f"{int(ego_speed)}", (20, 122), cv2.FONT_HERSHEY_SIMPLEX, 1.3, spd_col, 3)
            cv2.putText(screen, "km/h", (105, 122), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 195, 215), 1)

            lane_names = ["LEFT LANE", "CENTER LANE", "RIGHT LANE"]
            cv2.putText(screen, f"Lane : {lane_names[ego_lane_index]}", (20, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (220, 230, 245), 1)

            # Pedal States
            if emergency_brake:
                p_text = "[ABS EMERGENCY BRAKE]"
                p_col = (0, 0, 255)
            elif is_braking:
                p_text = "[BRAKE ENGAGED]"
                p_col = (0, 80, 255)
            else:
                p_text = "[GAS / ACCELERATING]" if ego_speed > 45 else "[COASTING]"
                p_col = (0, 230, 100) if ego_speed > 45 else (56, 189, 248)
            cv2.putText(screen, p_text, (20, 178), cv2.FONT_HERSHEY_SIMPLEX, 0.42, p_col, 1)

            # Proximity Gaps
            cv2.line(screen, (20, 192), (240, 192), (40, 48, 60), 1)
            f_col = (0, 230, 100) if lead_alert_level == 0 else ((0, 165, 255) if lead_alert_level == 1 else (0, 0, 255))
            cv2.putText(screen, f"Front Gap : {int(lead_dist)} m", (20, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.45, f_col, 2)
            
            ttc_str = f"{ttc_lead:.1f}s" if ttc_lead < 90 else "--"
            cv2.putText(screen, f"Front TTC : {ttc_str}", (20, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 195, 215), 1)

            r_col = (0, 230, 100) if trail_alert_level == 0 else ((0, 165, 255) if trail_alert_level == 1 else (0, 0, 255))
            cv2.putText(screen, f"Rear Gap  : {int(trail_dist)} m", (20, 268), cv2.FONT_HERSHEY_SIMPLEX, 0.44, r_col, 1)

            # Blind Spot Monitoring (BSM) Indicators
            bsm_l_col = (0, 0, 255) if bsm_left else (60, 70, 85)
            bsm_r_col = (0, 0, 255) if bsm_right else (60, 70, 85)
            cv2.rectangle(screen, (20, 288), (115, 318), bsm_l_col, -1)
            cv2.putText(screen, "BSM LEFT", (28, 308), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (255, 255, 255), 1)
            cv2.rectangle(screen, (135, 288), (235, 318), bsm_r_col, -1)
            cv2.putText(screen, "BSM RIGHT", (140, 308), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (255, 255, 255), 1)

            # ---------------------------------------------------------
            # 8. BACKGROUND DRIVER EYE MONITORING PICTURE-IN-PICTURE (PiP)
            # ---------------------------------------------------------
            pip_w, pip_h = 220, 165
            pip_x = 1140 - pip_w - 15
            pip_y = 55

            cv2.rectangle(screen, (pip_x - 3, pip_y - 22), (pip_x + pip_w + 3, pip_y + pip_h + 38), (18, 22, 28), -1)
            cv2.rectangle(screen, (pip_x - 3, pip_y - 22), (pip_x + pip_w + 3, pip_y + pip_h + 38), (56, 189, 248), 1)
            cv2.putText(screen, "DRIVER CAMERA (BACKGROUND)", (pip_x, pip_y - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (56, 189, 248), 1)

            if driver_frame is not None:
                resized_pip = cv2.resize(driver_frame, (pip_w, pip_h))
                screen[pip_y:pip_y + pip_h, pip_x:pip_x + pip_w] = resized_pip

            d_stat = driver_data.get("status", "ALERT")
            d_col = (0, 230, 100) if driver_data.get("risk_level", 0) == 0 else (
                (0, 165, 255) if driver_data.get("risk_level", 0) == 1 else (0, 0, 255)
            )
            cv2.putText(screen, f"Driver : {d_stat}", (pip_x + 5, pip_y + pip_h + 16), cv2.FONT_HERSHEY_SIMPLEX, 0.38, d_col, 1)
            cv2.putText(screen, f"PERCLOS: {int(driver_data.get('perclos', 0))}%  |  Face: {int(driver_data.get('distance_cm', 50))}cm",
                        (pip_x + 5, pip_y + pip_h + 32), cv2.FONT_HERSHEY_SIMPLEX, 0.33, (180, 195, 215), 1)

            # Driver Fatigue Safety Notification
            if is_driver_impaired:
                cv2.rectangle(screen, (10, 345), (250, 385), (0, 80, 220), -1)
                cv2.putText(screen, "! DRIVER FATIGUE DETECTED", (18, 362), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (255, 255, 255), 1)
                cv2.putText(screen, "Safe Distance Zone +50%", (18, 378), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (255, 255, 255), 1)

            # ---------------------------------------------------------
            # 9. CENTER EMERGENCY WARNING BANNERS
            # ---------------------------------------------------------
            if now - flash_timer > 0.28:
                flash_toggle = not flash_toggle
                flash_timer = now

            if emergency_brake and flash_toggle:
                bw, bh = 560, 48
                bx = (1140 - bw) // 2
                by = 630
                cv2.rectangle(screen, (bx, by), (bx + bw, by + bh), (0, 0, 220), -1)
                cv2.rectangle(screen, (bx, by), (bx + bw, by + bh), (255, 255, 255), 2)
                cv2.putText(screen, "AEB ACTIVE: EMERGENCY BRAKING ENGAGED!", (bx + 16, by + 32),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.58, (255, 255, 255), 2)

            elif lead_alert_level == 2 and flash_toggle:
                bw, bh = 550, 48
                bx = (1140 - bw) // 2
                by = 630
                cv2.rectangle(screen, (bx, by), (bx + bw, by + bh), (0, 0, 220), -1)
                cv2.rectangle(screen, (bx, by), (bx + bw, by + bh), (255, 255, 255), 2)
                cv2.putText(screen, f"FORWARD COLLISION WARNING: {int(lead_dist)}m (BRAKE NOW!)",
                            (bx + 14, by + 32), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

            elif trail_alert_level == 2 and flash_toggle:
                bw, bh = 550, 48
                bx = (1140 - bw) // 2
                by = 630
                cv2.rectangle(screen, (bx, by), (bx + bw, by + bh), (0, 100, 230), -1)
                cv2.rectangle(screen, (bx, by), (bx + bw, by + bh), (255, 255, 255), 2)
                cv2.putText(screen, f"REAR TAILGATING HAZARD: {int(trail_dist)}m (VEHICLE CLOSING IN!)",
                            (bx + 12, by + 32), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 2)

            # Bottom Controls Bar
            cv2.rectangle(screen, (10, 695), (1130, 728), (18, 22, 28), -1)
            cv2.rectangle(screen, (10, 695), (1130, 728), (45, 55, 70), 1)
            cv2.putText(screen,
                        "[W/Up]: Gas Our Car  |  [S/Dn]: Brake  |  [A/Left]: Lane Left  |  [D/Right]: Lane Right  |  [Space]: AEB Stop  |  [R]: Rear Hazard  |  [Q]: Quit",
                        (18, 716), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (160, 175, 195), 1)

            # Render Window
            cv2.imshow(window_name, screen)

            # ---------------------------------------------------------
            # 10. REAL-TIME USER KEYBOARD CONTROLS FOR OUR CAR
            # ---------------------------------------------------------
            key = cv2.waitKey(1) & 0xFF
            is_braking = False

            if key == ord('q') or key == 27:
                break
            elif key == ord('w') or key == 0 or key == 2490368: # W or UP ARROW: Accelerate OUR CAR
                ego_speed = min(150.0, ego_speed + 5.0)
            elif key == ord('s') or key == 1 or key == 2621440: # S or DOWN ARROW: Brake OUR CAR
                is_braking = True
            elif key == ord('a') or key == 2 or key == 2424832: # A or LEFT ARROW: Steer Left
                ego_lane_index = max(0, ego_lane_index - 1)
            elif key == ord('d') or key == 3 or key == 2555904: # D or RIGHT ARROW: Steer Right
                ego_lane_index = min(2, ego_lane_index + 1)
            elif key == ord(' '): # Space: AEB Stop
                emergency_brake = True
            elif key == ord('r'): # Toggle rear tailgater hazard
                tailgate_hazard = not tailgate_hazard
            elif key == ord('t'): # Toggle auto traffic
                auto_traffic = not auto_traffic
            elif key == ord('m'): # Mute / unmute
                alarm.toggle_mute()

    finally:
        alarm.shutdown()
        cam_worker.shutdown()
        cv2.destroyAllWindows()
        print("\n[ADAS] System shutdown cleanly.")

if __name__ == '__main__':
    run_adas()
