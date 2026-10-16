"""
Real-Time Vehicle Distance Detection & Visualization System (ADAS).
Integrates YOLOv8 vehicle detection, multi-object tracking, calibrated monocular
distance estimation, driver-perspective visualization, and active audio alarm chimes.

Usage:
    py -3.12 run_vehicle_distance.py
    py -3.12 run_vehicle_distance.py --mode reference
    py -3.12 run_vehicle_distance.py --mode webcam --cam 0
    py -3.12 run_vehicle_distance.py --video path/to/video.mp4
"""

import sys
import os
import time
import argparse
import math
import cv2
import numpy as np

from vehicle_detection import VehicleDetectorTracker
from distance_estimator import MonocularDistanceEstimator
from vehicle_visualizer import VehicleADASVisualizer
from audio_alert import AudioAlarmSystem

# Default reference image path from workspace / conversation artifacts
REFERENCE_IMAGE_PATH = r"C:\Users\bored\.gemini\antigravity\brain\d73281d5-6a22-4ccb-948d-810bfeaa8702\.user_uploaded\media_1792169755736_855930e5.jpg"


class VehicleDistanceADASApp:
    def __init__(self, mode="reference", video_path=None, cam_index=0, muted=False):
        self.mode = mode.lower() # "webcam", "reference", "video"
        self.video_path = video_path
        self.cam_index = cam_index
        self.is_muted = muted
        self.is_paused = False

        # Core ADAS Modules
        print("[ADAS] Initializing YOLOv8 Vehicle Detector & Tracker...")
        self.detector = VehicleDetectorTracker(model_path="yolov8n.pt", conf_thresh=0.25)
        print("[ADAS] Initializing Calibrated Monocular Distance Estimator...")
        self.estimator = MonocularDistanceEstimator(camera_height_m=1.35, fov_horizontal_deg=55.0, horizon_ratio=0.285)
        print("[ADAS] Initializing ADAS Driver Perspective Visualizer...")
        self.visualizer = VehicleADASVisualizer()
        print("[ADAS] Initializing Automotive Acoustic Warning System...")
        self.audio = AudioAlarmSystem()
        if self.is_muted:
            self.audio.set_muted(True)

        # Video / Camera Capture Object
        self.cap = None
        self.ref_frame = None
        self._setup_input_source()

        # Metrics
        self.prev_time = time.time()
        self.fps = 30.0
        self.sim_frame_count = 0

    def _setup_input_source(self):
        """Initializes or switches the current video / camera input."""
        if self.cap is not None:
            self.cap.release()
            self.cap = None

        if self.mode == "webcam":
            print(f"[ADAS] Opening Webcam device #{self.cam_index}...")
            self.cap = cv2.VideoCapture(self.cam_index, cv2.CAP_DSHOW)
            if not self.cap.isOpened():
                print(f"[ADAS WARNING] Could not open webcam index {self.cam_index}. Falling back to default backend...")
                self.cap = cv2.VideoCapture(self.cam_index)
            if self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            else:
                print(f"[ADAS ERROR] Webcam #{self.cam_index} is unavailable or denied permission.")

        elif self.mode == "video":
            if self.video_path and os.path.exists(self.video_path):
                print(f"[ADAS] Opening video file: {self.video_path}")
                self.cap = cv2.VideoCapture(self.video_path)
            else:
                print(f"[ADAS ERROR] Video file not found: {self.video_path}. Switching to reference mode.")
                self.mode = "reference"
                self._load_reference_frame()

        else: # Reference mode
            self.mode = "reference"
            self._load_reference_frame()

    def _load_reference_frame(self):
        """Loads and verifies the reference dashcam image."""
        if os.path.exists(REFERENCE_IMAGE_PATH):
            self.ref_frame = cv2.imread(REFERENCE_IMAGE_PATH)
            print(f"[ADAS] Loaded reference dashcam image ({self.ref_frame.shape[1]}x{self.ref_frame.shape[0]}).")
        else:
            # Fallback synthetic dashcam frame if user moved artifact
            print(f"[ADAS WARNING] Reference image not found at {REFERENCE_IMAGE_PATH}. Creating test dashcam scene...")
            self.ref_frame = np.zeros((682, 1024, 3), dtype=np.uint8)
            cv2.rectangle(self.ref_frame, (0, 0), (1024, 200), (95, 75, 60), -1)
            cv2.rectangle(self.ref_frame, (0, 200), (1024, 682), (55, 55, 55), -1)

    def switch_mode(self, new_mode, video_path=None):
        """Switches between Webcam, Reference Dashcam, and Video modes."""
        print(f"[ADAS] Switching mode from '{self.mode}' -> '{new_mode}'")
        self.mode = new_mode
        if video_path:
            self.video_path = video_path
        self._setup_input_source()

    def run(self):
        """Main real-time ADAS processing and visualization loop."""
        window_title = "ADAS Real-Time Vehicle Distance Detection System"
        cv2.namedWindow(window_title, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(window_title, 1150, 750)

        print("\n" + "=" * 65)
        print(" ADAS VEHICLE DISTANCE DETECTION SYSTEM ACTIVE")
        print(" Controls:")
        print("   [1] : Live Webcam Mode")
        print("   [2] : Reference Dashcam Image Mode")
        print("   [3] : Highway Video File Mode")
        print("   [M] : Mute / Unmute Audio Alarms")
        print("   [B] : Toggle Bounding Boxes (Clean vs Diagnostic)")
        print("   [S] : Toggle Surrounding Vehicles Radar Table")
        print("   [L] : Toggle Color Distance Legend")
        print("   [SPACE] : Pause / Resume Video")
        print("   [Q] / [ESC] : Exit System")
        print("=" * 65 + "\n")

        while True:
            # 1. Fetch Input Frame
            frame = None
            if self.mode == "reference":
                # Create live highway dynamics with gentle road vibration
                frame = self.ref_frame.copy()
                self.sim_frame_count += 1
                # Optional tiny jitter (simulates vehicle road pitch/roll vibration at 30 fps)
                # Keep original coordinates pristine for exact ground truth alignment
            elif self.mode in ("webcam", "video"):
                if self.cap is not None and self.cap.isOpened():
                    ret, raw_frame = self.cap.read()
                    if ret and raw_frame is not None:
                        frame = raw_frame
                    else:
                        if self.mode == "video":
                            # Loop video
                            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                            ret, raw_frame = self.cap.read()
                            if ret:
                                frame = raw_frame
                        else:
                            frame = None
                else:
                    frame = None

            # Handle missing frame / Camera offline state
            if frame is None:
                frame = np.zeros((720, 1280, 3), dtype=np.uint8)
                cv2.putText(frame, "VIDEO FEED UNAVAILABLE / CAMERA OFFLINE", (340, 320),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 0, 240), 2, cv2.LINE_AA)
                cv2.putText(frame, "Press [2] for Reference Dashcam Mode or [1] to retry Webcam", (300, 370),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.60, (200, 220, 240), 1, cv2.LINE_AA)

            H, W, _ = frame.shape

            # 2. Process Detection & Tracking
            if not self.is_paused:
                tracked_vehicles = self.detector.process_frame(frame)
            else:
                tracked_vehicles = list(self.detector.tracked_vehicles.values())

            # 3. Monocular Distance Estimation & Relative Position Classification
            vehicle_data_list = []
            highest_threat_level = 0 # 0: None, 1: Caution (Orange), 2: Danger (Red)

            for vehicle in tracked_vehicles:
                est = self.estimator.estimate(vehicle, W, H)
                vehicle_data_list.append({
                    "vehicle": vehicle,
                    "estimate": est
                })

                # Threat level assessment for active acoustic alarm
                if est["status_color"] == "RED":
                    highest_threat_level = max(highest_threat_level, 2)
                elif est["status_color"] == "ORANGE":
                    highest_threat_level = max(highest_threat_level, 1)

            # 4. Trigger / Update Automotive Audio Warning
            if not self.is_paused:
                if highest_threat_level == 2:
                    self.audio.trigger_alarm(2) # Urgent red warning siren
                elif highest_threat_level == 1:
                    self.audio.trigger_alarm(1) # Amber caution chime
                else:
                    self.audio.stop_alarm()
            else:
                self.audio.stop_alarm()

            # 5. Measure FPS
            now = time.time()
            dt = now - self.prev_time
            self.prev_time = now
            if dt > 0:
                current_fps = 1.0 / dt
                self.fps = 0.85 * self.fps + 0.15 * current_fps

            # 6. Render ADAS Visualization
            mode_display = {
                "webcam": f"Webcam (Dev #{self.cam_index})",
                "reference": "Reference Dashcam",
                "video": "Highway Video File"
            }.get(self.mode, "Active")

            rendered_frame = self.visualizer.render(
                frame=frame,
                vehicle_data_list=vehicle_data_list,
                fps=self.fps,
                current_mode=mode_display,
                is_muted=self.audio.is_muted
            )

            # 7. Display Output
            cv2.imshow(window_title, rendered_frame)

            # 8. Keyboard Controls
            key = cv2.waitKey(20) & 0xFF
            if key in (ord('q'), ord('Q'), 27): # 'q' or ESC
                print("[ADAS] Shutting down...")
                break
            elif key == ord('1'):
                self.switch_mode("webcam")
            elif key == ord('2'):
                self.switch_mode("reference")
            elif key == ord('3'):
                # Check for highway video or prompt
                default_vids = ["highway.mp4", "dashcam.mp4", "test.mp4", "data/highway.mp4"]
                found_vid = None
                for v in default_vids:
                    if os.path.exists(v):
                        found_vid = v
                        break
                if found_vid:
                    self.switch_mode("video", found_vid)
                else:
                    print("[ADAS] No default video file found (highway.mp4). Staying in current mode.")
            elif key in (ord('m'), ord('M')):
                muted_state = self.audio.toggle_mute()
                print(f"[ADAS] Audio Warning System: {'MUTED' if muted_state else 'ACTIVE'}")
            elif key in (ord('b'), ord('B')):
                self.visualizer.show_boxes = not self.visualizer.show_boxes
                print(f"[ADAS] Bounding Boxes: {'SHOWN' if self.visualizer.show_boxes else 'HIDDEN'}")
            elif key in (ord('s'), ord('S')):
                self.visualizer.show_sidebar = not self.visualizer.show_sidebar
                print(f"[ADAS] Sidebar Radar: {'SHOWN' if self.visualizer.show_sidebar else 'HIDDEN'}")
            elif key in (ord('l'), ord('L')):
                self.visualizer.show_legend = not self.visualizer.show_legend
                print(f"[ADAS] Legend: {'SHOWN' if self.visualizer.show_legend else 'HIDDEN'}")
            elif key == ord(' '): # Space to pause
                self.is_paused = not self.is_paused
                print(f"[ADAS] {'PAUSED' if self.is_paused else 'RESUMED'}")

        # Cleanup
        if self.cap is not None:
            self.cap.release()
        cv2.destroyAllWindows()
        self.audio.shutdown()
        print("[ADAS] Application terminated cleanly.")


def main():
    parser = argparse.ArgumentParser(description="Real-Time Vehicle Distance Detection & ADAS Visualization")
    parser.add_argument("--mode", type=str, default="reference", choices=["reference", "webcam", "video"],
                        help="Input source mode: reference (default), webcam, or video")
    parser.add_argument("--video", type=str, default=None, help="Path to video file for video mode")
    parser.add_argument("--cam", type=int, default=0, help="Webcam device index (default: 0)")
    parser.add_argument("--muted", action="store_true", help="Start with audio alarms muted")

    args = parser.parse_args()

    # If --video is explicitly provided, set mode to video
    if args.video:
        args.mode = "video"

    app = VehicleDistanceADASApp(
        mode=args.mode,
        video_path=args.video,
        cam_index=args.cam,
        muted=args.muted
    )
    app.run()


if __name__ == "__main__":
    main()
