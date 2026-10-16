# 🚗 Driver Monitoring Operating System & ADAS Radar Suite

An end-to-end Automotive Safety, Collision Avoidance, and Real-Time Driver Monitoring System featuring:
1. **ADAS Real-Time Vehicle Distance Detection & Visualization (`run_vehicle_distance.py`)**: Real-time YOLOv8 vehicle detection (cars, buses, trucks, motorcycles), multi-object tracking, calibrated monocular distance estimation (in meters), relative position classification (`Front Vehicle`, `Front-Left Vehicle`, `Front-Right Vehicle`, `Left Rear Vehicle`, `Right Rear Vehicle`), driver-perspective visualization matching automotive ADAS HUDs (directional dashed lines, bidirectional arrows, rounded color-coded callouts), and active acoustic alarm chimes.
2. **ADAS Isometric Vehicle Distance Radar & Collision Warning (`adas_distance.py`)**: 3D isometric bird's-eye roadway perspective showing our vehicle (yellow car), lead vehicle (red car), and trailing vehicle, calculating real-time distances with extruded 3D double-ended arrows (`XX m`), Forward Collision Warning (FCW), Rear Tailgating Alert (RCW), and Autonomous Emergency Braking (AEB).
3. **Concurrent Background Driver Eye-Tracking & PERCLOS PiP (`live_dms.py`)**: Background webcam worker monitoring driver attentiveness, PERCLOS fatigue, and face proximity. Dynamically expands safe following distance by 50% when driver fatigue is detected!
4. **Bare-Metal x86 Kernel (C & Assembly)**: A custom uniprocessor 32-bit operating system featuring an interrupt-driven task scheduler, bump memory manager, atomic spinlock-protected IPC queue, simulated telemetric sensor subsystems (accelerometer, gyroscope, barometric pressure), and an interactive PS/2 terminal shell.
5. **Context-Aware Driver Analytics Simulation (Python Pipeline)**: Signal-processing and sensor-fusion pipeline implementing Butterworth low-pass filtering, adaptive GPS/OBD/IMU weighted fusion based on HDOP dilution of precision, personalized driver baseline calibration, and event classification.

---

## 📁 Project Structure

```
driver_project/
├── run_vehicle_distance.py    # Main Application: Real-Time Vehicle Distance Detection & ADAS HUD
├── run_vehicle_distance.bat   # 1-Click Windows launcher for Vehicle Distance Detection
├── vehicle_detection.py       # YOLOv8 vehicle detector & multi-object tracker
├── distance_estimator.py      # Monocular ground-geometry & optical distance estimator
├── vehicle_visualizer.py      # ADAS driver-perspective overlay renderer & radar sidebar
├── audio_alert.py             # Non-blocking acoustic alarm buzzer (WAV synthesis)
├── adas_distance.py           # 3D Isometric Vehicle Distance & Collision Avoidance Radar
├── run_adas.bat               # 1-Click Windows launcher for ADAS Radar System
├── eye_tracker.py             # Computer Vision: Face/Eye detection, closest-face lock & PERCLOS
├── live_dms.py                # Standalone Live Camera Vision HUD Application
├── run_live_dms.bat           # 1-Click Windows launcher for Live Camera HUD
├── data/
│   └── sensor_data.csv        # Time-series vehicle & driver sensor telemetry
├── src/                       # x86 OS Kernel Source Code (C & Assembly)
├── driver_monitoring_os.iso   # Bootable x86 OS ISO image
├── baseline.py                # Driver personalized baseline calibration
├── classifier.py              # Driving behavior classification engine
├── preprocessing.py           # Butterworth low-pass filter (scipy)
├── sensor_fusion.py           # Dynamic HDOP-weighted speed fusion
├── main.py                    # Batch Python simulation runner
├── run_os.bat                 # Windows batch launcher for QEMU
└── run_simulation.bat         # Windows batch launcher for Python simulation
```

---

## 🚀 How to Run the System Modes

### Option 1: 🚘 Run Real-Time Vehicle Distance Detection & ADAS HUD (New)
Detects all surrounding vehicles from live webcam or dashcam video, estimates metric distance in meters via monocular camera geometry, classifies relative vehicle positions, renders driver-perspective directional arrows and floating callout pills, and sounds acoustic warnings.

#### 1-Click Launch:
Double-click:
👉 **`run_vehicle_distance.bat`**

#### Or via Terminal:
```powershell
# Reference Dashcam mode (matches reference scene)
py -3.12 run_vehicle_distance.py --mode reference

# Live Webcam mode
py -3.12 run_vehicle_distance.py --mode webcam --cam 0

# Highway Video file mode
py -3.12 run_vehicle_distance.py --video path/to/highway.mp4
```

* **Interactive Controls**:
  * `[1]`: Switch to Live Webcam Mode
  * `[2]`: Switch to Reference Dashcam Mode
  * `[3]`: Switch to Highway Video File Mode
  * `[B]`: Toggle Bounding Boxes (Pure Clean View vs Diagnostic Boxes)
  * `[S]`: Toggle Surrounding Vehicles Radar Table
  * `[L]`: Toggle Color Distance Legend
  * `[M]`: Mute / Unmute Audio Warnings (Sirens & Chimes)
  * `[Space]`: Pause / Resume video
  * `[Q] / [ESC]`: Exit System

---

### Option 2: 🛰️ Run ADAS Isometric Surrounding Vehicle Radar
Displays the 3D isometric roadway with our vehicle (yellow car), surrounding vehicles, 3D metric distance arrows, forward/rear collision warnings, and background driver eye tracking with Picture-in-Picture (PiP).

#### 1-Click Launch:
Double-click:
👉 **`run_adas.bat`**

#### Or via Terminal:
```powershell
py -3.12 adas_distance.py
```

* **Interactive Controls**:
  * `[W]`: Accelerate our vehicle (Gas)
  * `[S]`: Smooth brake
  * `[Space]`: Autonomous Emergency Braking (AEB)
  * `[Up] / [Down]`: Move front vehicle closer / farther
  * `[R]`: Toggle rear aggressive tailgating vehicle
  * `[A]`: Toggle dynamic auto-traffic AI
  * `[M]`: Mute / unmute audio alarm
  * `[Q]`: Quit

---

### Option 2: 👁️ Run Live Driver Eye-Tracking HUD (Standalone)
Tracks your eyes, calculates PERCLOS fatigue percentage, monitors blinks, and triggers acoustic alarms if eyes are closed $> 1.5$ seconds or if you are distracted.

#### 1-Click Launch:
Double-click:
👉 **`run_live_dms.bat`**
Double-click:
👉 **`run_live_dms.bat`**

#### Or via Terminal:
```bash
python live_dms.py
# or
py -3.12 live_dms.py
```

* **Controls while running**:
  * `[W] / [S]`: Increase / Decrease simulated vehicle speed.
  * `[M]`: Mute / Unmute audio alarm.
  * `[Space]`: Trigger emergency braking (drops speed to 0).
  * `[Q] / ESC`: Exit the application.
* *(Note: If no physical webcam is plugged in, it automatically switches to an animated synthetic driver simulation mode).*

---

### Option 2: 🖥️ Run the Bare-Metal OS Kernel in QEMU

#### 1-Click Launch:
Double-click:
👉 **`run_os.bat`**

#### Or via Terminal:
```powershell
& "C:\Program Files\qemu\qemu-system-i386.exe" -cdrom driver_monitoring_os.iso -m 128M
```

---

### Option 3: 📊 Run the Telemetric Sensor Fusion Simulation
Processes the CSV dataset, runs Butterworth low-pass filtering, calibrates driver baseline, and classifies events across different contexts (straight, curves, obstacles, potholes).

#### 1-Click Launch:
Double-click:
👉 **`run_simulation.bat`**

#### Or via Terminal:
```bash
python main.py
```

---

## ⌨️ OS Shell Command Reference

When the OS boots in QEMU, an interactive terminal is provided at the bottom (`OS> `):

| Command | Description |
| :--- | :--- |
| `help` | Lists all available shell commands and scroll navigation controls |
| `status` | Displays live driver awareness, focus index, and eye status |
| `speed` | Displays telemetry for vehicle speed, engine RPM, and current gear |
| `alert` | Simulates an emergency drowsiness warning alarm |
| `drowsy` | Displays PERCLOS critical eye closure alert |
| `eyes` | Displays PERCLOS percentage, blink rate, and gaze vector |
| `steer` | Displays steering angle, hands-on-wheel detection, and lane position |
| `brake` | Triggers autonomous emergency braking (AEB) diagnostic status |
| `tasks` | Lists current kernel tasks and their runnable states |
| `diag` | Shows system diagnostics (CPU mode, PIT frequency, IRQs, Heap size) |
| `clear` | Clears terminal history and repaints the telemetry dashboard |
| `reboot` | Performs hardware soft reboot via the 8042 PS/2 controller |
