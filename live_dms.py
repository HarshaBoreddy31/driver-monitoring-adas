"""
Context-Aware Driver Monitoring System (Live Vision + Realistic Vehicle Physics)
Features:
1. Real-Time Computer Vision Eye Tracking & PERCLOS Fatigue Detection
2. Synthesized Automotive Audio Chimes & Microsleep Sirens
3. Realistic Vehicle Dynamics Physics Engine (Smooth Throttle, Braking, Coasting, RPM & Gears)
4. Cyberpunk Automotive Head-Up Display (HUD)
"""

import time
import math
import cv2
import numpy as np

from eye_tracker import EyeTracker, SyntheticDriverGenerator
from audio_alert import AudioAlarmSystem

class VehicleDynamics:
    """
    Simulates realistic automotive powertrain, aerodynamics, braking, and transmission physics.
    """
    def __init__(self):
        self.speed = 0.0              # Current speed in km/h
        self.target_speed = 0.0       # Target cruising speed
        self.acceleration_g = 0.0     # Longitudinal acceleration in G-forces
        self.rpm = 800                # Engine RPM (idle: 800, max: 5500)
        self.gear = "P"               # P, D1, D2, D3, D4, D5
        self.throttle = 0.0           # 0.0 to 1.0 (Gas Pedal)
        self.brake = 0.0              # 0.0 to 1.0 (Brake Pedal)
        self.emergency_brake = False  # Hard ABS stop
        self.last_update = time.time()

        # Automotive Constants
        self.max_engine_accel = 12.0  # km/h per second under full throttle (~0.34g)
        self.normal_brake_decel = 22.0 # km/h per second under normal braking (~0.62g)
        self.emergency_brake_decel = 45.0 # km/h per second under hard braking (~1.25g)
        self.rolling_resistance = 1.2 # km/h per second natural coasting deceleration
        self.top_speed = 160.0        # km/h

    def apply_throttle(self, intensity=1.0):
        self.throttle = min(1.0, intensity)
        self.brake = 0.0
        self.emergency_brake = False

    def apply_brake(self, intensity=1.0):
        self.brake = min(1.0, intensity)
        self.throttle = 0.0
        self.emergency_brake = False

    def apply_emergency_brake(self):
        self.emergency_brake = True
        self.brake = 1.0
        self.throttle = 0.0

    def release_pedals(self):
        self.throttle = 0.0
        self.brake = 0.0
        self.emergency_brake = False

    def update(self):
        now = time.time()
        dt = min(now - self.last_update, 0.1) # Delta time in seconds
        self.last_update = now

        old_speed = self.speed

        # 1. Acceleration / Deceleration Calculation
        if self.emergency_brake:
            # Hard emergency deceleration
            decel_rate = self.emergency_brake_decel
            self.speed = max(0.0, self.speed - decel_rate * dt)
        elif self.brake > 0.0:
            # Smooth normal deceleration
            decel_rate = self.normal_brake_decel * self.brake
            self.speed = max(0.0, self.speed - decel_rate * dt)
        elif self.throttle > 0.0:
            # Smooth power curve: higher torque at lower speeds, lower at top speeds
            power_factor = max(0.3, 1.0 - (self.speed / self.top_speed) * 0.7)
            accel_rate = self.max_engine_accel * self.throttle * power_factor
            self.speed = min(self.top_speed, self.speed + accel_rate * dt)
        else:
            # Natural coasting / aerodynamic drag
            if self.speed > 0.0:
                drag = (self.speed / 100.0) ** 2 * 2.0
                coast_decel = self.rolling_resistance + drag
                self.speed = max(0.0, self.speed - coast_decel * dt)

        # 2. Compute Real-Time G-Force: a = (v_final - v_initial) / dt (converted from km/h/s to g's)
        # 1g = 9.80665 m/s^2 = 35.30394 km/h/s
        delta_v_per_sec = (self.speed - old_speed) / max(dt, 0.001)
        self.acceleration_g = delta_v_per_sec / 35.30394

        # 3. Automatic Transmission Gear & Engine RPM Dynamics
        if self.speed < 0.5:
            self.gear = "P" if self.throttle == 0 else "D1"
            self.rpm = 800 + int(self.throttle * 1200)
        elif self.speed < 25.0:
            self.gear = "D1"
            self.rpm = int(1000 + (self.speed / 25.0) * 3200)
        elif self.speed < 50.0:
            self.gear = "D2"
            self.rpm = int(1400 + ((self.speed - 25.0) / 25.0) * 2800)
        elif self.speed < 80.0:
            self.gear = "D3"
            self.rpm = int(1600 + ((self.speed - 50.0) / 30.0) * 2600)
        elif self.speed < 115.0:
            self.gear = "D4"
            self.rpm = int(1800 + ((self.speed - 80.0) / 35.0) * 2500)
        else:
            self.gear = "D5"
            self.rpm = int(2000 + ((self.speed - 115.0) / 45.0) * 2400)

        self.rpm = min(5500, max(800, self.rpm))


def draw_hud_panel(frame, x, y, w, h, bg_color=(15, 20, 30), border_color=(45, 60, 80)):
    """Draw a semi-transparent HUD container."""
    overlay = frame.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), bg_color, -1)
    cv2.addWeighted(overlay, 0.80, frame, 0.20, 0, frame)
    cv2.rectangle(frame, (x, y), (x + w, y + h), border_color, 1)


def draw_progress_bar(frame, x, y, w, h, percent, label="", color=(50, 200, 50)):
    """Draw a styled progress bar with percentage."""
    cv2.rectangle(frame, (x, y), (x + w, y + h), (35, 40, 50), -1)
    fill_w = int((w * min(max(percent, 0), 100)) / 100.0)
    cv2.rectangle(frame, (x, y), (x + fill_w, y + h), color, -1)
    cv2.rectangle(frame, (x, y), (x + w, y + h), (70, 80, 100), 1)
    
    text = f"{label}: {int(percent)}%" if label else f"{int(percent)}%"
    cv2.putText(frame, text, (x, y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (220, 230, 240), 1)


def run_dms():
    print("\n" + "=" * 60)
    print("  CONTEXT-AWARE DRIVER MONITORING SYSTEM (LIVE VISION & HUD)")
    print("=" * 60)
    print("Initializing Camera, Audio Synthesizer, & Vehicle Physics...")

    # Subsystems
    vehicle = VehicleDynamics()
    tracker = EyeTracker()
    alarm = AudioAlarmSystem()

    # Camera Acquisition
    cap = cv2.VideoCapture(0)
    is_real_camera = True
    synthetic_gen = None

    if not cap.isOpened():
        print("[NOTICE] Physical webcam not detected. Launching Synthetic Simulation Mode...")
        is_real_camera = False
        synthetic_gen = SyntheticDriverGenerator(640, 480)
    else:
        ret, test_frame = cap.read()
        if not ret or test_frame is None:
            print("[NOTICE] Webcam read failed. Using Synthetic Simulation Mode...")
            is_real_camera = False
            synthetic_gen = SyntheticDriverGenerator(640, 480)
            cap.release()
        else:
            print("[SUCCESS] Physical Webcam connected (640x480).")

    # Initial Cruising Speed
    vehicle.speed = 45.0

    print("\n" + "-" * 60)
    print("Automotive Controls (Hold keys for continuous action):")
    print("  [W]       : Press/Hold to Accelerate (Gas Pedal)")
    print("  [S]       : Press/Hold to Brake (Smooth Deceleration)")
    print("  [Space]   : Emergency Braking (Hard ABS Stop)")
    print("  [M]       : Mute / Unmute Audio Safety Alarm")
    print("  [Q] / ESC : Exit Application")
    print("-" * 60 + "\n")

    window_name = "Driver Monitoring System - Automotive HUD"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 880, 620)

    last_key_press_time = time.time()
    last_key = None
    flash_toggle = False
    flash_timer = time.time()
    fps_time = time.time()

    try:
        while True:
            # 1. Video Ingestion
            if is_real_camera:
                ret, frame = cap.read()
                if not ret:
                    break
                frame = cv2.flip(frame, 1) # Mirror image for driver POV
            else:
                frame = synthetic_gen.get_frame()

            h, w, _ = frame.shape
            now = time.time()
            fps = 1.0 / max(now - fps_time, 0.001)
            fps_time = now

            # 2. Update Vehicle Physics
            # Check if throttle/brake should be released if no key pressed in last 0.15s
            if now - last_key_press_time > 0.15:
                vehicle.release_pedals()

            vehicle.update()

            # 3. Computer Vision Eye Tracking
            vision_data = tracker.process_frame(frame)

            # 4. Context & Fatigue Risk Scoring
            risk_score = 0
            if vision_data["risk_level"] == 2: # Critical Microsleep / Gaze Distraction
                # Microsleep risk scales with vehicle speed
                speed_risk_multiplier = 60 if vehicle.speed > 30 else 35
                risk_score += speed_risk_multiplier
                alarm.trigger_alarm(2) # Loud pulsating siren
            elif vision_data["risk_level"] == 1: # Drowsy
                risk_score += 25
                alarm.trigger_alarm(1) # Gentle caution chime
            elif vehicle.emergency_brake:
                risk_score += 30
                alarm.trigger_alarm(3) # Emergency brake sound
            else:
                alarm.stop_alarm()

            # Speed limit penalty (above 60 km/h)
            if vehicle.speed > 60.0:
                risk_score += min(35, int((vehicle.speed - 60.0) * 1.2))

            # Harsh G-force penalty
            if abs(vehicle.acceleration_g) > 0.6:
                risk_score += 25

            risk_score = min(100, risk_score)
            safety_score = 100 - risk_score

            # 5. Draw Multi-Face & Primary Driver Bounding Boxes
            for f_info in vision_data.get("all_faces", []):
                bx, by, bw, bh = f_info["box"]
                f_dist = f_info["distance_cm"]
                
                if f_info["is_primary"]:
                    # Closest Face (Primary Driver)
                    face_color = (0, 230, 255) if vision_data["risk_level"] == 0 else (
                        (0, 165, 255) if vision_data["risk_level"] == 1 else (0, 0, 255)
                    )
                    # High-tech corners
                    c_len = min(16, bw // 4)
                    cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), face_color, 1)
                    cv2.line(frame, (bx, by), (bx + c_len, by), face_color, 3)
                    cv2.line(frame, (bx, by), (bx, by + c_len), face_color, 3)
                    cv2.line(frame, (bx + bw, by), (bx + bw - c_len, by), face_color, 3)
                    cv2.line(frame, (bx + bw, by), (bx + bw, by + c_len), face_color, 3)
                    cv2.line(frame, (bx, by + bh), (bx + c_len, by + bh), face_color, 3)
                    cv2.line(frame, (bx, by + bh), (bx, by + bh - c_len), face_color, 3)
                    cv2.line(frame, (bx + bw, by + bh), (bx + bw - c_len, by + bh), face_color, 3)
                    cv2.line(frame, (bx + bw, by + bh), (bx + bw, by + bh - c_len), face_color, 3)

                    tag = f"DRIVER [CLOSEST: {int(f_dist)}cm]"
                    cv2.putText(frame, tag, (bx, max(14, by - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.40, face_color, 1)

                    # Draw Eye Boxes strictly on Primary Driver
                    for (ex, ey, ew, eh) in vision_data["eye_boxes"]:
                        eye_color = (0, 255, 100) if vision_data["eyes_open"] else (0, 0, 255)
                        cv2.rectangle(frame, (ex, ey), (ex + ew, ey + eh), eye_color, 1)
                else:
                    # Secondary / Passenger Face (Farther away - Ignored)
                    pass_color = (130, 140, 155)
                    cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), pass_color, 1)
                    pass_tag = f"PASSENGER [{int(f_dist)}cm - IGNORED]"
                    cv2.putText(frame, pass_tag, (bx, max(14, by - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.34, pass_color, 1)

            # 6. Render Compact Automotive HUD Overlay
            # Top Status Bar (Slim)
            draw_hud_panel(frame, 8, 8, w - 16, 26, (15, 20, 30), (45, 60, 80))
            cv2.putText(frame, "DRIVER MONITORING OS - HUD", (18, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (56, 189, 248), 1)
            
            mute_text = "[AUDIO: MUTED]" if alarm.is_muted else "[AUDIO: ON]"
            mute_color = (0, 100, 255) if alarm.is_muted else (0, 220, 100)
            cv2.putText(frame, mute_text, (w - 200, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.36, mute_color, 1)
            cv2.putText(frame, f"FPS: {int(fps)}", (w - 75, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (160, 175, 195), 1)

            # Left Panel: Compact Vehicle Dynamics
            draw_hud_panel(frame, 8, 40, 155, 195, (15, 20, 30), (45, 60, 80))
            cv2.putText(frame, "TELEMETRY", (16, 56), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (56, 189, 248), 1)

            # Speed
            spd_color = (0, 230, 100) if vehicle.speed <= 60 else ((0, 165, 255) if vehicle.speed <= 80 else (0, 0, 255))
            cv2.putText(frame, f"{int(vehicle.speed)}", (16, 92), cv2.FONT_HERSHEY_SIMPLEX, 0.95, spd_color, 2)
            cv2.putText(frame, "km/h", (78, 92), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 190, 210), 1)

            # Gear & RPM
            cv2.putText(frame, f"Gear: {vehicle.gear}  |  {vehicle.rpm} RPM", (16, 115), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (220, 230, 245), 1)
            
            # G-Force Acceleration Bar (-1.0g to +1.0g)
            g_val = vehicle.acceleration_g
            cv2.putText(frame, f"Accel: {g_val:+.2f} g", (16, 138), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (200, 210, 230), 1)
            cv2.rectangle(frame, (16, 145), (145, 153), (35, 40, 50), -1)
            cv2.line(frame, (80, 143), (80, 155), (120, 130, 150), 1)
            bar_offset = int(g_val * 60)
            if bar_offset > 0:
                cv2.rectangle(frame, (80, 145), (min(145, 80 + bar_offset), 153), (0, 220, 100), -1)
            elif bar_offset < 0:
                cv2.rectangle(frame, (max(16, 80 + bar_offset), 145), (80, 153), (0, 80, 255), -1)

            # Pedal State
            if vehicle.emergency_brake:
                pedal_str = "[ABS BRAKE]"
                p_col = (0, 0, 255)
            elif vehicle.brake > 0:
                pedal_str = f"[BRAKE {int(vehicle.brake * 100)}%]"
                p_col = (0, 140, 255)
            elif vehicle.throttle > 0:
                pedal_str = f"[GAS {int(vehicle.throttle * 100)}%]"
                p_col = (0, 220, 100)
            else:
                pedal_str = "[COASTING]"
                p_col = (56, 189, 248)
            cv2.putText(frame, pedal_str, (16, 178), cv2.FONT_HERSHEY_SIMPLEX, 0.35, p_col, 1)
            cv2.putText(frame, "Limit: 60 km/h", (16, 202), cv2.FONT_HERSHEY_SIMPLEX, 0.33, (160, 170, 190), 1)

            # Right Panel: Compact Driver Health & Proximity
            draw_hud_panel(frame, w - 170, 40, 162, 222, (15, 20, 30), (45, 60, 80))
            cv2.putText(frame, "DRIVER HEALTH", (w - 162, 56), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (56, 189, 248), 1)

            # Proximity / Closest Face Distance
            d_val = vision_data.get("distance_cm", 0.0)
            d_status = vision_data.get("proximity_status", "NONE")
            d_col = (0, 220, 100) if d_status == "OPTIMAL" else ((0, 165, 255) if d_status == "TOO CLOSE" else (180, 190, 210))
            cv2.putText(frame, f"Dist: {int(d_val)}cm ({d_status[:7]})", (w - 162, 76), cv2.FONT_HERSHEY_SIMPLEX, 0.34, d_col, 1)

            # Multi-Face Target Counter
            tot_faces = vision_data.get("total_faces", 0)
            cv2.putText(frame, f"Faces: {tot_faces} (Lock: Closest)", (w - 162, 94), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (180, 190, 210), 1)

            # State
            st_color = (0, 230, 100) if vision_data["risk_level"] == 0 else (
                (0, 165, 255) if vision_data["risk_level"] == 1 else (0, 0, 255)
            )
            cv2.putText(frame, f"State: {vision_data['status'][:13]}", (w - 162, 114), cv2.FONT_HERSHEY_SIMPLEX, 0.37, st_color, 1)

            # Eye Closure Duration
            cdur = vision_data['closed_duration']
            cd_color = (0, 0, 255) if cdur >= 1.5 else ((0, 165, 255) if cdur >= 0.8 else (180, 190, 210))
            cv2.putText(frame, f"Closed: {cdur:.1f}s", (w - 162, 134), cv2.FONT_HERSHEY_SIMPLEX, 0.35, cd_color, 1)

            # PERCLOS Bar (Compact)
            p_bar_color = (0, 220, 100) if vision_data['perclos'] < 35 else ((0, 165, 255) if vision_data['perclos'] < 65 else (0, 0, 255))
            draw_progress_bar(frame, w - 162, 158, 145, 8, vision_data['perclos'], "PERCLOS", p_bar_color)

            # Blinks
            cv2.putText(frame, f"Blinks: {vision_data['blink_count']} ({vision_data['blink_rate_bpm']} bpm)",
                        (w - 162, 185), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (180, 190, 210), 1)

            # Safety Score Bar (Compact)
            score_bar_color = (0, 220, 100) if safety_score >= 70 else ((0, 165, 255) if safety_score >= 40 else (0, 0, 255))
            draw_progress_bar(frame, w - 162, 214, 145, 10, safety_score, "Safety Score", score_bar_color)

            # Center Flashing Emergency Warning Banner (Compact)
            if now - flash_timer > 0.30:
                flash_toggle = not flash_toggle
                flash_timer = now

            if vision_data["risk_level"] == 2 and flash_toggle:
                banner_w = 380
                banner_h = 38
                bx = (w - banner_w) // 2
                by = h - 75
                cv2.rectangle(frame, (bx, by), (bx + banner_w, by + banner_h), (0, 0, 220), -1)
                cv2.rectangle(frame, (bx, by), (bx + banner_w, by + banner_h), (255, 255, 255), 1)
                
                msg = "CRITICAL: MICROSLEEP DETECTED!" if vision_data["face_detected"] else "DISTRACTION: EYES ON ROAD!"
                cv2.putText(frame, msg, (bx + 16, by + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (255, 255, 255), 1)
            elif vision_data["risk_level"] == 1:
                banner_w = 320
                banner_h = 32
                bx = (w - banner_w) // 2
                by = h - 70
                cv2.rectangle(frame, (bx, by), (bx + banner_w, by + banner_h), (0, 140, 230), -1)
                cv2.rectangle(frame, (bx, by), (bx + banner_w, by + banner_h), (255, 255, 255), 1)
                cv2.putText(frame, "CAUTION: DROWSINESS DETECTED", (bx + 15, by + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 255, 255), 1)
            elif vehicle.emergency_brake and flash_toggle:
                banner_w = 340
                banner_h = 34
                bx = (w - banner_w) // 2
                by = h - 70
                cv2.rectangle(frame, (bx, by), (bx + banner_w, by + banner_h), (0, 50, 220), -1)
                cv2.rectangle(frame, (bx, by), (bx + banner_w, by + banner_h), (255, 255, 255), 1)
                cv2.putText(frame, "EMERGENCY BRAKING / ABS ACTIVE", (bx + 15, by + 23), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1)

            # Bottom Control Bar (Slim)
            draw_hud_panel(frame, 8, h - 30, w - 16, 22, (15, 20, 30), (45, 60, 80))
            cv2.putText(frame, "[W]: Gas  |  [S]: Brake  |  [Space]: Emergency Brake  |  [M]: Mute  |  [Q]: Quit",
                        (18, h - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.33, (150, 165, 185), 1)

            # 7. Render Window
            cv2.imshow(window_name, frame)

            # 8. Real-Time Keyboard Input Handling
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == 27:
                break
            elif key == ord('w'): # Throttle / Accelerate
                vehicle.apply_throttle(1.0)
                last_key_press_time = now
            elif key == ord('s'): # Brake / Decelerate
                vehicle.apply_brake(1.0)
                last_key_press_time = now
            elif key == ord(' '): # Emergency Stop
                vehicle.apply_emergency_brake()
                last_key_press_time = now
            elif key == ord('m'): # Mute / Unmute Alarm
                alarm.toggle_mute()

    finally:
        alarm.shutdown()
        if is_real_camera:
            cap.release()
        cv2.destroyAllWindows()
        print("\n[DMS] Application shutdown cleanly.")

if __name__ == '__main__':
    run_dms()
