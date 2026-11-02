# 🚗 SMARTDRIVE Suite — Real-Time Vehicle Distance Monitoring & OS Simulation

This workspace contains the complete suite of academic Operating Systems and Advanced Driver Assistance Systems (ADAS) projects.

---

## 📁 Workspace Organization

```
driver_project/
├── smartdrive-3d/            # [PRIMARY] SMARTDRIVE 3D — Real-Time 3D Vehicle Distance Monitoring & Collision Warning
│   ├── backend/              # Node.js + TypeScript authoritative RTOS calculation engine (10Hz)
│   ├── frontend/             # React Three Fiber + Drei + Vite 3D interactive ADAS cockpit (Port 5180)
│   ├── run_smartdrive.bat    # Windows batch runner for SMARTDRIVE 3D
│   ├── test_all.bat          # Complete test suite runner (39 tests)
│   └── README.md             # Detailed SMARTDRIVE 3D system architecture & faculty guide
│
├── run_smartdrive_3d.bat     # ⚡ 1-Click root launcher to start SMARTDRIVE 3D
├── test_all_smartdrive.bat   # ⚡ 1-Click root launcher to run all 39 automated tests
│
├── legacy_python_adas/       # [ARCHIVE] Computer vision & YOLOv8 monocular distance estimation
│   ├── adas_distance.py      # Isometric 3D collision avoidance radar
│   ├── live_dms.py           # Driver eye-tracking & PERCLOS fatigue monitoring
│   ├── vehicle_detection.py  # YOLOv8 multi-object vehicle tracker
│   ├── distance_estimator.py # Monocular camera geometry distance calculator
│   ├── highway_driving.mp4   # Dashcam test footage
│   └── yolov8n.pt            # YOLOv8 neural network weights
│
├── legacy_baremetal_os/      # [ARCHIVE] Bare-metal x86 uniprocessor operating system kernel
│   ├── driver_monitoring_os.iso # Bootable 32-bit x86 OS ISO image
│   ├── src/                  # Kernel C & Assembly sources (scheduler, IDT, IPC, memory)
│   ├── build/                # Kernel binary and object files
│   ├── os_l1.c               # Real-time task scheduler demonstration
│   └── Makefile              # OS build automation
│
└── docs/                     # [DOCS] Faculty presentation materials & research analyses
    ├── Driver_Monitoring_OS_Faculty_Presentation.pptx # Faculty demo PowerPoint slides
    ├── PIM_Research_Paper_Analysis_9_10_12_13.docx    # Research paper analysis
    └── presentation.html                              # Interactive HTML presentation deck
```

---

## 🚀 How to Run the Primary Project (SMARTDRIVE 3D)

### Option 1: 1-Click Windows Launcher
Double-click:
👉 **`run_smartdrive_3d.bat`**

This will automatically launch the backend calculation engine, start the Vite development server, and open your browser at:
🌐 **`http://localhost:5180`**

### Option 2: Command Line
```powershell
cd smartdrive-3d
npm run dev
```

---

## 🧪 Running the Full Automated Test Suite

To run all 39 unit and integration tests (35 backend tests + 4 frontend tests):

Double-click:
👉 **`test_all_smartdrive.bat`**

Or from terminal:
```powershell
cd smartdrive-3d
npm test
```

---

## 🎮 Driving & ADAS Keyboard Controls
- **Steer Lanes**: `A` / `D` or `←` / `→`
- **Direct Lane Select**: `1` through `5` (Lane 1: Far Left, Lane 2: Left, Lane 3: Center, Lane 4: Right, Lane 5: Far Right)
- **Throttle / Speed**: `W` / `S` or `↑` / `↓` (or use the toolbar slider)
- **Emergency Brake**: Hold `Space`
- **Camera Views**: Press `C` to cycle between **Chase**, **Cockpit**, and **Top-Down ADAS**
- **Mute Audio**: Press `M`
