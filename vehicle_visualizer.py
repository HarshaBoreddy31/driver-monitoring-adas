"""
ADAS Realistic Vehicle Distance & Relative Position Visualizer.
Recreates the exact driver-perspective ADAS visualization from the reference image:
- Directional dashed lines / arrows from the Reference Vehicle hood to each vehicle.
- Floating rounded callout pill badges with position title and metric distance (e.g. 'Front Vehicle — 35 m').
- Color-coded safety zones (Red = Danger, Orange = Caution / Nearby, Green = Safe).
- Bottom center 'Reference Vehicle (Your Car)' badge.
- Telemetry radar sidebar, live vehicle counter, and color legend.
"""

import math
import cv2
import numpy as np

# BGR Color Palette (Matching Reference Image)
COLORS = {
    "RED": {
        "bg": (18, 18, 90),           # Deep crimson fill
        "border": (43, 43, 220),       # Vibrant red border
        "arrow": (60, 60, 240),        # Red dashed line
        "text": (255, 255, 255)
    },
    "ORANGE": {
        "bg": (5, 38, 94),            # Dark amber-brown fill
        "border": (34, 126, 230),      # Vibrant orange border
        "arrow": (40, 140, 245),       # Orange dashed line
        "text": (255, 255, 255)
    },
    "GREEN": {
        "bg": (37, 59, 13),           # Deep forest green fill
        "border": (60, 185, 60),       # Vibrant emerald green border
        "arrow": (80, 215, 80),        # Green dashed line
        "text": (255, 255, 255)
    }
}


def draw_rounded_pill(img, x1, y1, x2, y2, color_bg, color_border, radius=7, thickness=2):
    """Renders a smooth antialiased rounded pill badge."""
    w = x2 - x1
    h = y2 - y1
    r = min(radius, w // 2, h // 2)

    # Fill
    cv2.rectangle(img, (x1 + r, y1), (x2 - r, y2), color_bg, -1)
    cv2.rectangle(img, (x1, y1 + r), (x2, y2 - r), color_bg, -1)
    cv2.circle(img, (x1 + r, y1 + r), r, color_bg, -1)
    cv2.circle(img, (x2 - r, y1 + r), r, color_bg, -1)
    cv2.circle(img, (x1 + r, y2 - r), r, color_bg, -1)
    cv2.circle(img, (x2 - r, y2 - r), r, color_bg, -1)

    # Border
    if thickness > 0:
        cv2.line(img, (x1 + r, y1), (x2 - r, y1), color_border, thickness, cv2.LINE_AA)
        cv2.line(img, (x1 + r, y2), (x2 - r, y2), color_border, thickness, cv2.LINE_AA)
        cv2.line(img, (x1, y1 + r), (x1, y2 - r), color_border, thickness, cv2.LINE_AA)
        cv2.line(img, (x2, y1 + r), (x2, y2 - r), color_border, thickness, cv2.LINE_AA)
        cv2.ellipse(img, (x1 + r, y1 + r), (r, r), 180, 0, 90, color_border, thickness, cv2.LINE_AA)
        cv2.ellipse(img, (x2 - r, y1 + r), (r, r), 270, 0, 90, color_border, thickness, cv2.LINE_AA)
        cv2.ellipse(img, (x1 + r, y2 - r), (r, r), 90, 0, 90, color_border, thickness, cv2.LINE_AA)
        cv2.ellipse(img, (x2 - r, y2 - r), (r, r), 0, 0, 90, color_border, thickness, cv2.LINE_AA)


def draw_dashed_line(img, pt1, pt2, color, thickness=2, dash_len=14, gap_len=9):
    """Draws an antialiased dashed line between two points."""
    dist = math.hypot(pt2[0] - pt1[0], pt2[1] - pt1[1])
    if dist < 2.0:
        return
    dx = (pt2[0] - pt1[0]) / dist
    dy = (pt2[1] - pt1[1]) / dist

    curr = 0.0
    while curr < dist:
        sx = int(pt1[0] + dx * curr)
        sy = int(pt1[1] + dy * curr)
        ed = min(curr + dash_len, dist)
        ex = int(pt1[0] + dx * ed)
        ey = int(pt1[1] + dy * ed)
        cv2.line(img, (sx, sy), (ex, ey), color, thickness, cv2.LINE_AA)
        curr += dash_len + gap_len


def draw_arrow_head(img, pt1, pt2, color, size=11):
    """Draws a crisp triangular arrowhead at pt2 pointing in direction pt1 -> pt2."""
    dist = math.hypot(pt2[0] - pt1[0], pt2[1] - pt1[1])
    if dist < 2.0:
        return
    dx = (pt2[0] - pt1[0]) / dist
    dy = (pt2[1] - pt1[1]) / dist
    nx = -dy
    ny = dx
    bx = pt2[0] - dx * size
    by = pt2[1] - dy * size
    p_left = (int(bx + nx * (size * 0.65)), int(by + ny * (size * 0.65)))
    p_right = (int(bx - nx * (size * 0.65)), int(by - ny * (size * 0.65)))
    pts = np.array([pt2, p_left, p_right], dtype=np.int32)
    cv2.fillPoly(img, [pts], color, cv2.LINE_AA)


class VehicleADASVisualizer:
    def __init__(self):
        self.show_sidebar = True
        self.show_legend = True
        self.show_boxes = True

    def render(self, frame, vehicle_data_list, fps=30.0, current_mode="Webcam", is_muted=False):
        """
        Renders the full driver-perspective ADAS distance overlay onto the frame.
        vehicle_data_list: list of dicts with keys:
            vehicle: DetectedVehicle
            estimate: dict from MonocularDistanceEstimator
        """
        output = frame.copy()
        H, W, _ = output.shape

        # Reference Vehicle Hood Origin (where the reference badge sits on hood)
        hood_x = int(W * 0.50)
        hood_y = int(H * 0.79)
        ref_h = 44
        arrow_origin = (hood_x, hood_y - ref_h // 2 - 2)

        # -------------------------------------------------------------
        # 1. Draw Directional Dashed Lines / Arrows to Vehicles
        # -------------------------------------------------------------
        for item in vehicle_data_list:
            v = item["vehicle"]
            est = item["estimate"]
            col_cfg = COLORS.get(est["status_color"], COLORS["GREEN"])

            target_x = int(v.foot_x)
            target_y = int(v.foot_y)

            # Draw dashed directional line between reference badge and vehicle
            draw_dashed_line(output, arrow_origin, (target_x, target_y), col_cfg["arrow"], thickness=2)
            # Arrowhead pointing to detected vehicle
            draw_arrow_head(output, arrow_origin, (target_x, target_y), col_cfg["arrow"], size=12)
            # Arrowhead pointing towards reference vehicle (bidirectional indicator)
            draw_arrow_head(output, (target_x, target_y), arrow_origin, col_cfg["arrow"], size=12)

        # -------------------------------------------------------------
        # 2. Draw Bounding Boxes with Corner Accents (if enabled)
        # -------------------------------------------------------------
        if self.show_boxes:
            for item in vehicle_data_list:
                v = item["vehicle"]
                est = item["estimate"]
                col_cfg = COLORS.get(est["status_color"], COLORS["GREEN"])
                x1, y1, x2, y2 = v.bbox

                # Subtle box outline
                cv2.rectangle(output, (x1, y1), (x2, y2), col_cfg["border"], 1, cv2.LINE_AA)

                # High-tech corner brackets
                clen = min(14, (x2 - x1) // 4, (y2 - y1) // 4)
                cv2.line(output, (x1, y1), (x1 + clen, y1), col_cfg["border"], 2, cv2.LINE_AA)
                cv2.line(output, (x1, y1), (x1, y1 + clen), col_cfg["border"], 2, cv2.LINE_AA)
                cv2.line(output, (x2, y1), (x2 - clen, y1), col_cfg["border"], 2, cv2.LINE_AA)
                cv2.line(output, (x2, y1), (x2, y1 + clen), col_cfg["border"], 2, cv2.LINE_AA)
                cv2.line(output, (x1, y2), (x1 + clen, y2), col_cfg["border"], 2, cv2.LINE_AA)
                cv2.line(output, (x1, y2), (x1, y2 - clen), col_cfg["border"], 2, cv2.LINE_AA)
                cv2.line(output, (x2, y2), (x2 - clen, y2), col_cfg["border"], 2, cv2.LINE_AA)
                cv2.line(output, (x2, y2), (x2, y2 - clen), col_cfg["border"], 2, cv2.LINE_AA)

        # -------------------------------------------------------------
        # 3. Floating Rounded Callout Labels (Matching Reference Image)
        # -------------------------------------------------------------
        # Format:
        # ┌────────────────────────┐
        # │   Front-Left Vehicle   │
        # │          42 m          │
        # └────────────────────────┘
        for item in vehicle_data_list:
            v = item["vehicle"]
            est = item["estimate"]
            col_cfg = COLORS.get(est["status_color"], COLORS["GREEN"])

            # If tiny distant vehicle in horizon, don't occlude scene with giant pill
            if v.width < 38 and (est["distance_m"] is None or est["distance_m"] > 55.0):
                continue

            title_text = est["position_label"]
            dist_text = est["distance_str"]

            font = cv2.FONT_HERSHEY_DUPLEX
            t_scale = 0.44
            t_thick = 1

            (tw1, th1), _ = cv2.getTextSize(title_text, font, t_scale, t_thick)
            (tw2, th2), _ = cv2.getTextSize(dist_text, font, t_scale + 0.08, t_thick + 1)

            pill_w = max(tw1, tw2) + 26
            pill_h = th1 + th2 + 20

            # Position pill above vehicle box (or slightly inside if near top boundary)
            pill_cx = int(v.cx)
            pill_cy = max(pill_h + 8, int(v.bbox[1]) - pill_h // 2 - 8)

            px1 = int(pill_cx - pill_w // 2)
            py1 = int(pill_cy - pill_h // 2)
            px2 = px1 + pill_w
            py2 = py1 + pill_h

            # Keep inside image horizontal bounds
            if px1 < 8:
                px1 = 8
                px2 = px1 + pill_w
            elif px2 > W - 8:
                px2 = W - 8
                px1 = px2 - pill_w

            # Draw Callout Pill
            draw_rounded_pill(output, px1, py1, px2, py2, col_cfg["bg"], col_cfg["border"], radius=8, thickness=2)

            # Text: Title (Line 1)
            tx1 = px1 + (pill_w - tw1) // 2
            ty1 = py1 + th1 + 7
            cv2.putText(output, title_text, (tx1, ty1), font, t_scale, col_cfg["text"], t_thick, cv2.LINE_AA)

            # Text: Distance (Line 2)
            tx2 = px1 + (pill_w - tw2) // 2
            ty2 = ty1 + th2 + 6
            cv2.putText(output, dist_text, (tx2, ty2), font, t_scale + 0.08, col_cfg["text"], t_thick + 1, cv2.LINE_AA)

        # -------------------------------------------------------------
        # 4. Reference Vehicle (Your Car) Badge at Bottom Center
        # -------------------------------------------------------------
        ref_title = "Reference Vehicle"
        ref_sub = "(Your Car)"
        font = cv2.FONT_HERSHEY_DUPLEX
        (rw1, rh1), _ = cv2.getTextSize(ref_title, font, 0.48, 1)
        (rw2, rh2), _ = cv2.getTextSize(ref_sub, font, 0.42, 1)

        ref_w = max(rw1, rw2) + 32
        ref_h = rh1 + rh2 + 22
        rx1 = int(hood_x - ref_w // 2)
        ry1 = int(hood_y - ref_h // 2)
        rx2 = rx1 + ref_w
        ry2 = ry1 + ref_h

        # Modern Dark Blue Reference Pill with Cyan border
        draw_rounded_pill(output, rx1, ry1, rx2, ry2, (18, 25, 36), (56, 189, 248), radius=8, thickness=2)
        cv2.putText(output, ref_title, (rx1 + (ref_w - rw1) // 2, ry1 + rh1 + 7), font, 0.48, (255, 255, 255), 1, cv2.LINE_AA)
        cv2.putText(output, ref_sub, (rx1 + (ref_w - rw2) // 2, ry1 + rh1 + rh2 + 13), font, 0.42, (200, 220, 245), 1, cv2.LINE_AA)

        # -------------------------------------------------------------
        # 5. Top ADAS Status Header Bar
        # -------------------------------------------------------------
        cv2.rectangle(output, (8, 8), (W - 8, 40), (14, 18, 24), -1)
        cv2.rectangle(output, (8, 8), (W - 8, 40), (45, 55, 70), 1)

        cv2.putText(output, "ADAS VEHICLE DISTANCE DETECTION SYSTEM", (20, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.48, (56, 189, 248), 1, cv2.LINE_AA)

        num_vehicles = len(vehicle_data_list)
        cv2.putText(output, f"Vehicles: {num_vehicles}", (410, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.44, (240, 245, 255), 1, cv2.LINE_AA)

        cv2.putText(output, f"Mode: {current_mode}", (560, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 195, 215), 1, cv2.LINE_AA)

        audio_text = "MUTED [M]" if is_muted else "ALARM: ON [M]"
        audio_col = (100, 100, 240) if is_muted else (0, 225, 100)
        cv2.putText(output, audio_text, (730, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.40, audio_col, 1, cv2.LINE_AA)

        cv2.putText(output, f"FPS: {int(fps)}", (W - 95, 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 225, 100), 1, cv2.LINE_AA)

        # -------------------------------------------------------------
        # 6. Side Telemetry Radar Table (Top-Left)
        # -------------------------------------------------------------
        if self.show_sidebar and len(vehicle_data_list) > 0:
            panel_w = 260
            panel_h = min(220, 36 + len(vehicle_data_list) * 26)
            cv2.rectangle(output, (10, 48), (10 + panel_w, 48 + panel_h), (14, 18, 24), -1)
            cv2.rectangle(output, (10, 48), (10 + panel_w, 48 + panel_h), (45, 55, 70), 1)

            cv2.putText(output, "SURROUNDING VEHICLES RADAR", (20, 68),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, (56, 189, 248), 1, cv2.LINE_AA)

            y_row = 92
            for item in vehicle_data_list[:6]: # Display up to 6 in table
                v = item["vehicle"]
                est = item["estimate"]
                col_cfg = COLORS.get(est["status_color"], COLORS["GREEN"])

                row_str = f"#{v.track_id:02d} {v.class_name.capitalize()[:4]} | {est['position_label'][:10]} : {est['distance_str']}"
                cv2.circle(output, (22, y_row - 4), 4, col_cfg["border"], -1)
                cv2.putText(output, row_str, (32, y_row), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (225, 235, 245), 1, cv2.LINE_AA)
                y_row += 24

        # -------------------------------------------------------------
        # 7. Color Legend (Bottom-Right)
        # -------------------------------------------------------------
        if self.show_legend:
            leg_w = 280
            leg_h = 76
            lx1 = W - leg_w - 12
            ly1 = H - leg_h - 32
            cv2.rectangle(output, (lx1, ly1), (lx1 + leg_w, ly1 + leg_h), (14, 18, 24), -1)
            cv2.rectangle(output, (lx1, ly1), (lx1 + leg_w, ly1 + leg_h), (45, 55, 70), 1)

            cv2.putText(output, "DISTANCE COLOR LEGEND", (lx1 + 12, ly1 + 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.34, (56, 189, 248), 1, cv2.LINE_AA)

            # Red bullet
            cv2.circle(output, (lx1 + 20, ly1 + 38), 5, COLORS["RED"]["border"], -1)
            cv2.putText(output, "Danger / Close (<=38m)", (lx1 + 32, ly1 + 41), cv2.FONT_HERSHEY_SIMPLEX, 0.31, (220, 230, 240), 1, cv2.LINE_AA)

            # Orange bullet
            cv2.circle(output, (lx1 + 20, ly1 + 59), 5, COLORS["ORANGE"]["border"], -1)
            cv2.putText(output, "Caution / Nearby", (lx1 + 32, ly1 + 62), cv2.FONT_HERSHEY_SIMPLEX, 0.31, (220, 230, 240), 1, cv2.LINE_AA)

            # Green bullet
            cv2.circle(output, (lx1 + 172, ly1 + 38), 5, COLORS["GREEN"]["border"], -1)
            cv2.putText(output, "Safe (>48m)", (lx1 + 184, ly1 + 41), cv2.FONT_HERSHEY_SIMPLEX, 0.31, (220, 230, 240), 1, cv2.LINE_AA)

        # -------------------------------------------------------------
        # 8. Bottom Control Prompt
        # -------------------------------------------------------------
        cv2.rectangle(output, (8, H - 26), (W - 8, H - 6), (14, 18, 24), -1)
        cv2.putText(output, "[1]: Webcam  |  [2]: Reference Image  |  [3]: Highway Video / Stream  |  [M]: Mute  |  [Q]: Quit",
                    (18, H - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.33, (160, 175, 195), 1, cv2.LINE_AA)

        return output
