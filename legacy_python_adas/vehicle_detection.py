"""
Real-Time Vehicle Detection and Multi-Object Tracking Engine.
Uses YOLOv8 (nano) for high-speed vehicle detection (cars, trucks, buses, motorcycles)
and an IoU + Centroid Kalman-style tracker for persistent vehicle IDs across frames.
"""

import time
import numpy as np
from ultralytics import YOLO

class DetectedVehicle:
    def __init__(self, track_id, class_name, confidence, bbox):
        self.track_id = track_id
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = [int(v) for v in bbox] # [x1, y1, x2, y2]
        self.cx = (self.bbox[0] + self.bbox[2]) / 2.0
        self.cy = (self.bbox[1] + self.bbox[3]) / 2.0
        self.width = self.bbox[2] - self.bbox[0]
        self.height = self.bbox[3] - self.bbox[1]
        self.foot_x = self.cx
        self.foot_y = float(self.bbox[3]) # Ground contact point
        self.disappeared_frames = 0
        self.history = [(self.cx, self.cy)]

    def update(self, class_name, confidence, bbox):
        self.class_name = class_name
        self.confidence = confidence
        self.bbox = [int(v) for v in bbox]
        self.cx = (self.bbox[0] + self.bbox[2]) / 2.0
        self.cy = (self.bbox[1] + self.bbox[3]) / 2.0
        self.width = self.bbox[2] - self.bbox[0]
        self.height = self.bbox[3] - self.bbox[1]
        self.foot_x = self.cx
        self.foot_y = float(self.bbox[3])
        self.disappeared_frames = 0
        self.history.append((self.cx, self.cy))
        if len(self.history) > 30:
            self.history.pop(0)


class VehicleDetectorTracker:
    def __init__(self, model_path="yolov8n.pt", conf_thresh=0.25, iou_thresh=0.35, max_disappeared=8):
        self.model = YOLO(model_path)
        # COCO Vehicle Classes: 2: car, 3: motorcycle, 5: bus, 7: truck
        self.vehicle_classes = [2, 3, 5, 7]
        self.conf_thresh = conf_thresh
        self.iou_thresh = iou_thresh
        self.max_disappeared = max_disappeared

        self.next_track_id = 1
        self.tracked_vehicles = {} # track_id -> DetectedVehicle

    @staticmethod
    def _compute_iou(boxA, boxB):
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        inter_w = max(0, xB - xA)
        inter_h = max(0, yB - yA)
        inter_area = inter_w * inter_h
        areaA = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        areaB = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        denom = float(areaA + areaB - inter_area)
        return inter_area / denom if denom > 0 else 0.0

    def process_frame(self, frame):
        """
        Runs YOLOv8 detection on the frame and updates persistent vehicle tracks.
        Filters out the reference vehicle's hood if it appears at the bottom center.
        Returns: list of DetectedVehicle objects
        """
        H, W, _ = frame.shape

        # Run YOLO inference
        results = self.model(frame, classes=self.vehicle_classes, conf=self.conf_thresh, verbose=False)

        raw_detections = []
        for r in results:
            for b in r.boxes:
                cls_id = int(b.cls[0])
                cls_name = self.model.names.get(cls_id, "car")
                conf = float(b.conf[0])
                x1, y1, x2, y2 = b.xyxy[0].tolist()

                # Filter out our own car hood if detected (large box at bottom center)
                bw = x2 - x1
                bh = y2 - y1
                if y2 > 0.90 * H and bw > 0.55 * W and y1 > 0.60 * H:
                    continue # This is the Reference Vehicle hood, not another vehicle!

                # Minimum size sanity check
                if bw < 14 or bh < 14:
                    continue

                raw_detections.append({
                    "class": cls_name,
                    "conf": conf,
                    "bbox": [x1, y1, x2, y2]
                })

        # Match raw detections with existing tracks using greedy IoU matching
        matched_tracks = set()
        unmatched_dets = list(range(len(raw_detections)))

        if len(self.tracked_vehicles) > 0 and len(raw_detections) > 0:
            track_ids = list(self.tracked_vehicles.keys())
            iou_matrix = np.zeros((len(track_ids), len(raw_detections)), dtype=np.float32)

            for i, tid in enumerate(track_ids):
                for j, det in enumerate(raw_detections):
                    iou_matrix[i, j] = self._compute_iou(self.tracked_vehicles[tid].bbox, det["bbox"])

            # Greedy assignment
            while True:
                max_iou = np.max(iou_matrix)
                if max_iou < self.iou_thresh:
                    break

                i, j = np.unravel_index(np.argmax(iou_matrix), iou_matrix.shape)
                tid = track_ids[i]
                det = raw_detections[j]

                self.tracked_vehicles[tid].update(det["class"], det["conf"], det["bbox"])
                matched_tracks.add(tid)
                if j in unmatched_dets:
                    unmatched_dets.remove(j)

                # Invalidate matched row and column
                iou_matrix[i, :] = -1.0
                iou_matrix[:, j] = -1.0

        # Create new tracks for unmatched detections
        for j in unmatched_dets:
            det = raw_detections[j]
            new_vehicle = DetectedVehicle(self.next_track_id, det["class"], det["conf"], det["bbox"])
            self.tracked_vehicles[self.next_track_id] = new_vehicle
            self.next_track_id += 1

        # Mark unmatched tracks as disappeared
        dead_tracks = []
        for tid, vehicle in self.tracked_vehicles.items():
            if tid not in matched_tracks and tid not in [self.next_track_id - 1 - k for k in range(len(unmatched_dets))]:
                vehicle.disappeared_frames += 1
                if vehicle.disappeared_frames > self.max_disappeared:
                    dead_tracks.append(tid)

        for tid in dead_tracks:
            del self.tracked_vehicles[tid]

        # Return active tracks sorted by ground y-coordinate (closer vehicles last for clean rendering)
        active_list = [v for v in self.tracked_vehicles.values() if v.disappeared_frames == 0]
        active_list.sort(key=lambda v: v.foot_y)
        return active_list
