"""
Computer Vision Eye Tracking & Fatigue Detection Engine.
Prioritizes the face closest to the camera (Primary Driver) using optical
proximity modeling and spatial hysteresis tracking.
Calculates PERCLOS, distance (cm), closure duration, and blink rates.
"""

import time
import collections
import cv2
import numpy as np

def calculate_iou(boxA, boxB):
    """Compute Intersection over Union (IoU) between two bounding boxes (x, y, w, h)."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = boxA[2] * boxA[3]
    boxBArea = boxB[2] * boxB[3]
    denom = float(boxAArea + boxBArea - interArea)
    return interArea / denom if denom > 0 else 0.0

def estimate_distance_cm(face_width_px, focal_length_px=550.0, real_face_width_cm=14.5):
    """
    Estimate physical distance from camera sensor using pinhole camera projection:
    Distance (cm) = (real_width_cm * focal_length_px) / pixel_width
    """
    if face_width_px <= 0:
        return 999.0
    return round((real_face_width_cm * focal_length_px) / float(face_width_px), 1)


class EyeTracker:
    def __init__(self):
        # Load OpenCV pre-trained Haar Cascades
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye_tree_eyeglasses.xml"
        )
        if self.eye_cascade.empty():
            self.eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + "haarcascade_eye.xml"
            )

        # Primary Driver Tracking state (Closest Face)
        self.face_detected = False
        self.primary_box = None         # Smoothed (x, y, w, h)
        self.primary_distance_cm = 0.0
        self.primary_proximity_status = "NONE" # "OPTIMAL", "TOO CLOSE", "FAR"
        self.all_faces = []             # List of all detected faces with role and distance
        
        # Tracking memory & Hysteresis
        self.last_seen_time = None
        self.coast_duration_limit = 0.35  # Coast for 0.35s before declaring face lost
        self.smooth_alpha = 0.65         # Exponential Moving Average weight

        # Eye tracking & Metrics (only computed on closest primary face)
        self.eye_boxes = []
        self.eyes_open = True
        self.closed_start_time = None
        self.consecutive_closed_duration = 0.0
        
        # PERCLOS rolling buffer (stores boolean: True for closed, False for open)
        self.history_window_size = 90    # ~3 seconds at 30fps
        self.closure_history = collections.deque(maxlen=self.history_window_size)
        
        # Blink tracking
        self.blink_count = 0
        self.last_blink_time = time.time()
        self.blink_timestamps = collections.deque(maxlen=60)
        self._was_closed = False

        # Distraction / Gaze lost tracking
        self.no_face_start_time = None
        self.no_face_duration = 0.0

    def process_frame(self, frame):
        """
        Process a single BGR image frame from the camera.
        Identifies all faces, locks onto the face closest to the camera,
        and analyzes eye fatigue exclusively on that primary driver.
        """
        now = time.time()
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)  # Lighting normalization

        # Detect all candidate faces
        raw_faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.12,
            minNeighbors=5,
            minSize=(50, 50),
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        candidates = []
        for (fx, fy, fw, fh) in raw_faces:
            dist = estimate_distance_cm(fw)
            area = fw * fh
            candidates.append({
                "box": (int(fx), int(fy), int(fw), int(fh)),
                "area": area,
                "distance_cm": dist
            })

        # Sort candidates strictly by proximity: largest area (closest to camera) first
        candidates.sort(key=lambda c: c["area"], reverse=True)

        chosen_target = None
        if len(candidates) > 0:
            # Multi-face target selection with Hysteresis
            if self.primary_box is not None:
                # Find if previous driver still matches one of the candidates
                best_match = None
                best_iou = 0.0
                for c in candidates:
                    iou = calculate_iou(self.primary_box, c["box"])
                    if iou > best_iou:
                        best_iou = iou
                        best_match = c

                # If previously locked driver is still visible and candidate 0 isn't
                # dramatically closer (at least 20% closer/larger), stay locked on driver
                if best_match is not None and best_iou > 0.25:
                    if candidates[0]["area"] < best_match["area"] * 1.25:
                        chosen_target = best_match
                    else:
                        chosen_target = candidates[0]
                else:
                    chosen_target = candidates[0]
            else:
                # No previous lock: Pick the closest face (candidate 0)
                chosen_target = candidates[0]

        # Handle Face Acquisition / Coasting
        if chosen_target is not None:
            self.face_detected = True
            self.last_seen_time = now
            self.no_face_start_time = None
            self.no_face_duration = 0.0

            # Apply Exponential Moving Average (EMA) smoothing to eliminate bounding box jitter
            target_box = chosen_target["box"]
            if self.primary_box is None:
                self.primary_box = target_box
            else:
                px, py, pw, ph = self.primary_box
                tx, ty, tw, th = target_box
                self.primary_box = (
                    int(self.smooth_alpha * tx + (1.0 - self.smooth_alpha) * px),
                    int(self.smooth_alpha * ty + (1.0 - self.smooth_alpha) * py),
                    int(self.smooth_alpha * tw + (1.0 - self.smooth_alpha) * pw),
                    int(self.smooth_alpha * th + (1.0 - self.smooth_alpha) * ph),
                )

            self.primary_distance_cm = estimate_distance_cm(self.primary_box[2])

            if self.primary_distance_cm < 35.0:
                self.primary_proximity_status = "TOO CLOSE"
            elif self.primary_distance_cm <= 80.0:
                self.primary_proximity_status = "OPTIMAL"
            else:
                self.primary_proximity_status = "FAR"

        else:
            # No face detected in this frame: check if we can coast
            if self.primary_box is not None and self.last_seen_time is not None:
                if (now - self.last_seen_time) < self.coast_duration_limit:
                    # Coasting (brief glance away / detector flicker)
                    self.face_detected = True
                else:
                    # Target genuinely lost
                    self.face_detected = False
                    self.primary_box = None
                    if self.no_face_start_time is None:
                        self.no_face_start_time = now
                    self.no_face_duration = now - self.no_face_start_time
            else:
                self.face_detected = False
                self.primary_box = None
                if self.no_face_start_time is None:
                    self.no_face_start_time = now
                self.no_face_duration = now - self.no_face_start_time

        # Compile all faces list for HUD visualization (closest marked as PRIMARY)
        self.all_faces = []
        for c in candidates:
            is_primary = False
            if self.primary_box is not None:
                # Match candidate to smoothed primary box
                if calculate_iou(self.primary_box, c["box"]) > 0.35:
                    is_primary = True
            elif chosen_target is not None and c == chosen_target:
                is_primary = True

            self.all_faces.append({
                "box": c["box"],
                "distance_cm": c["distance_cm"],
                "is_primary": is_primary,
                "role": "PRIMARY DRIVER (CLOSEST)" if is_primary else "PASSENGER (IGNORED)"
            })

        # -------------------------------------------------------------
        # Eye Tracking & Fatigue (Computed ONLY for Primary Driver)
        # -------------------------------------------------------------
        self.eye_boxes = []

        if self.face_detected and self.primary_box is not None:
            fx, fy, fw, fh = self.primary_box
            # Ensure ROI stays within frame boundaries
            img_h, img_w = gray.shape
            rx = max(0, fx)
            ry = max(0, fy)
            rw = min(fw, img_w - rx)
            rh = min(int(fh * 0.58), img_h - ry)

            if rw > 20 and rh > 20:
                roi_gray = gray[ry:ry + rh, rx:rx + rw]
                eyes = self.eye_cascade.detectMultiScale(
                    roi_gray,
                    scaleFactor=1.12,
                    minNeighbors=4,
                    minSize=(max(16, int(fw * 0.12)), max(16, int(fh * 0.12))),
                    maxSize=(int(fw * 0.45), int(fh * 0.38))
                )

                for (ex, ey, ew, eh) in eyes:
                    self.eye_boxes.append((rx + ex, ry + ey, ew, eh))

            # Eye state logic
            if len(self.eye_boxes) >= 1:
                self.eyes_open = True
                if self._was_closed:
                    self.blink_count += 1
                    self.blink_timestamps.append(now)
                    self._was_closed = False
                
                self.closed_start_time = None
                self.consecutive_closed_duration = 0.0
                self.closure_history.append(False)
            else:
                self.eyes_open = False
                self._was_closed = True
                if self.closed_start_time is None:
                    self.closed_start_time = now
                self.consecutive_closed_duration = now - self.closed_start_time
                self.closure_history.append(True)
        else:
            # No face detected
            self.eyes_open = False
            self.closure_history.append(True)
            self.consecutive_closed_duration = 0.0
            self.closed_start_time = None

        # Compute PERCLOS (Percentage of Eye Closure)
        if len(self.closure_history) > 0:
            closed_samples = sum(1 for is_c in self.closure_history if is_c)
            perclos = (closed_samples / len(self.closure_history)) * 100.0
        else:
            perclos = 0.0

        # Compute Blink Rate (Blinks per Minute over last 60 seconds)
        one_min_ago = now - 60.0
        blink_rate_bpm = sum(1 for ts in self.blink_timestamps if ts >= one_min_ago)

        # Safety State Evaluation
        if not self.face_detected and self.no_face_duration > 1.8:
            status = "DISTRACTED / NO FACE"
            risk_level = 2
        elif self.consecutive_closed_duration >= 1.5 or perclos >= 65.0:
            status = "CRITICAL MICROSLEEP"
            risk_level = 2
        elif self.consecutive_closed_duration >= 0.75 or perclos >= 35.0:
            status = "DROWSY / FATIGUE"
            risk_level = 1
        else:
            status = "ALERT"
            risk_level = 0

        return {
            "face_detected": self.face_detected,
            "face_box": self.primary_box,
            "all_faces": self.all_faces,
            "total_faces": len(self.all_faces),
            "distance_cm": self.primary_distance_cm,
            "proximity_status": self.primary_proximity_status,
            "eye_boxes": self.eye_boxes,
            "eyes_open": self.eyes_open,
            "closed_duration": self.consecutive_closed_duration,
            "perclos": perclos,
            "blink_count": self.blink_count,
            "blink_rate_bpm": blink_rate_bpm,
            "status": status,
            "risk_level": risk_level,
            "no_face_duration": self.no_face_duration
        }


class SyntheticDriverGenerator:
    """
    Generates realistic simulated camera frames with:
    1. A Primary Driver Avatar (Large, closer to camera: ~45cm)
    2. An optional Passenger Avatar in the background (Smaller, farther away: ~90cm)
    This allows testing closest-face detection without physical cameras!
    """
    def __init__(self, width=640, height=480):
        self.width = width
        self.height = height
        self.start_time = time.time()

    def get_frame(self):
        t = time.time() - self.start_time
        frame = np.full((self.height, self.width, 3), 25, dtype=np.uint8)

        # Background cabin styling
        cv2.rectangle(frame, (0, 0), (self.width, 100), (38, 32, 28), -1)
        cv2.line(frame, (0, 100), (self.width, 100), (60, 55, 50), 2)

        # -------------------------------------------------------------
        # 1. Passenger in Background (Smaller, farther from camera)
        # -------------------------------------------------------------
        p_cx = int(self.width * 0.82)
        p_cy = int(self.height * 0.45)
        # Smaller face: radius 45x60 (appears ~95cm away)
        cv2.ellipse(frame, (p_cx, p_cy), (45, 60), 0, 0, 360, (150, 130, 115), -1)
        cv2.ellipse(frame, (p_cx, p_cy), (45, 60), 0, 0, 360, (180, 160, 140), 1)
        # Passenger eyes
        cv2.circle(frame, (p_cx - 16, p_cy - 10), 6, (230, 230, 230), -1)
        cv2.circle(frame, (p_cx + 16, p_cy - 10), 6, (230, 230, 230), -1)
        cv2.circle(frame, (p_cx - 16, p_cy - 10), 3, (40, 40, 40), -1)
        cv2.circle(frame, (p_cx + 16, p_cy - 10), 3, (40, 40, 40), -1)

        # -------------------------------------------------------------
        # 2. Primary Driver (Large, closer to camera: ~45cm)
        # -------------------------------------------------------------
        cx = int(self.width * 0.42)
        cy = self.height // 2 + 25
        cy += int(np.sin(t * 1.5) * 4)  # Natural breathing motion

        # Head Oval (Radius 95x125, large bounding box)
        cv2.ellipse(frame, (cx, cy), (95, 125), 0, 0, 360, (180, 150, 130), -1)
        cv2.ellipse(frame, (cx, cy), (95, 125), 0, 0, 360, (220, 190, 170), 2)

        # Cycle states (Alert -> Blink -> Microsleep)
        cycle = t % 15.0
        eyes_closed = False
        if 4.0 <= cycle <= 4.3:
            eyes_closed = True
        elif 9.0 <= cycle <= 11.2:
            eyes_closed = True

        left_eye = (cx - 36, cy - 20)
        right_eye = (cx + 36, cy - 20)

        if eyes_closed:
            cv2.line(frame, (left_eye[0] - 16, left_eye[1]), (left_eye[0] + 16, left_eye[1]), (50, 30, 20), 3)
            cv2.line(frame, (right_eye[0] - 16, right_eye[1]), (right_eye[0] + 16, right_eye[1]), (50, 30, 20), 3)
        else:
            for eye in (left_eye, right_eye):
                cv2.circle(frame, eye, 15, (240, 240, 240), -1)
                cv2.circle(frame, eye, 7, (40, 80, 140), -1)
                cv2.circle(frame, (eye[0] + 2, eye[1] - 2), 2, (255, 255, 255), -1)

        # Mouth
        if 9.0 <= cycle <= 11.2:
            cv2.ellipse(frame, (cx, cy + 52), (16, 22), 0, 0, 360, (40, 30, 30), -1)
        else:
            cv2.ellipse(frame, (cx, cy + 46), (22, 9), 0, 0, 180, (40, 30, 30), 2)

        return frame
