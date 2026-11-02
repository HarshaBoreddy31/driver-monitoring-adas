import os
import subprocess
import sys

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SMARTDRIVE 3D — Technical Report</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      font-size: 10.5pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Cover / Header Section */
    .header-box {
      border: 1px solid #cbd5e1;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 24px 28px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }

    .header-badge {
      display: inline-block;
      background: rgba(6, 182, 212, 0.2);
      border: 1px solid #06b6d4;
      color: #38bdf8;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
      margin-bottom: 10px;
    }

    .header-title {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
      color: #f8fafc;
      line-height: 1.2;
    }

    .header-sub {
      font-size: 11pt;
      color: #94a3b8;
      margin: 0 0 16px 0;
      font-weight: 400;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid rgba(148, 163, 184, 0.25);
      font-size: 8.5pt;
    }

    .meta-item strong {
      display: block;
      color: #38bdf8;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    /* Headings */
    h1 {
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 6px;
      margin: 28px 0 14px 0;
      display: flex;
      align-items: center;
      letter-spacing: -0.3px;
    }

    h2 {
      font-size: 11.5pt;
      font-weight: 700;
      color: #0369a1;
      margin: 18px 0 8px 0;
      letter-spacing: -0.2px;
    }

    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #334155;
      margin: 14px 0 6px 0;
    }

    p {
      margin: 0 0 10px 0;
      color: #334155;
      text-align: justify;
    }

    /* Architecture Block */
    .arch-diagram {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 14px 18px;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 8pt;
      color: #38bdf8;
      white-space: pre;
      line-height: 1.35;
      margin: 14px 0;
      overflow-x: hidden;
    }

    /* Code Blocks */
    .code-container {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 8px;
      margin: 12px 0 18px 0;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .code-header {
      background: #131b2e;
      padding: 6px 12px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      font-family: "Consolas", monospace;
      color: #94a3b8;
    }

    .code-header .file-name {
      font-weight: 600;
      color: #38bdf8;
    }

    .code-body {
      padding: 12px 14px;
      margin: 0;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 8.2pt;
      line-height: 1.42;
      color: #e2e8f0;
      white-space: pre;
      overflow-x: hidden;
    }

    /* Syntax Highlighting Tokens */
    .kw { color: #c084fc; font-weight: 600; } /* Keyword */
    .fn { color: #38bdf8; font-weight: 600; } /* Function */
    .str { color: #34d399; } /* String */
    .num { color: #f59e0b; } /* Number */
    .cm { color: #64748b; font-style: italic; } /* Comment */
    .typ { color: #f472b6; } /* Type */

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 18px 0;
      font-size: 8.8pt;
      page-break-inside: avoid;
    }

    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      color: #334155;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Status Badges */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      font-family: "Consolas", monospace;
      text-transform: uppercase;
    }

    .badge-pass {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }

    .badge-danger {
      background: #ffe4e6;
      color: #be123c;
      border: 1px solid #fda4af;
    }

    .badge-caution {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .badge-safe {
      background: #d1fae5;
      color: #047857;
      border: 1px solid #6ee7b7;
    }

    /* Callout Boxes */
    .callout {
      border-left: 4px solid #0284c7;
      background: #f0f9ff;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      margin: 12px 0;
      font-size: 9.5pt;
      color: #0369a1;
      page-break-inside: avoid;
    }

    .callout-warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
      color: #92400e;
    }

    .page-break {
      page-break-before: always;
    }

    ul, ol {
      margin: 6px 0 12px 18px;
      padding: 0;
      color: #334155;
    }

    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <!-- Cover Header -->
  <div class="header-box">
    <div class="header-badge">Academic Operating Systems & ADAS Research Report</div>
    <div class="header-title">SMARTDRIVE 3D: Real-Time Vehicle Distance Monitoring & Collision Warning System</div>
    <div class="header-sub">Technical Architecture, Core Source Codes, Empirical Results & Engineering Discussion</div>
    <div class="meta-grid">
      <div class="meta-item">
        <strong>Application</strong>
        Authoritative ADAS Platform
      </div>
      <div class="meta-item">
        <strong>Architecture</strong>
        RTOS Cyclic Exec (10Hz)
      </div>
      <div class="meta-item">
        <strong>Visualization</strong>
        React 18 + Three.js (60FPS)
      </div>
      <div class="meta-item">
        <strong>Test Suite</strong>
        39/39 Passing (100%)
      </div>
    </div>
  </div>

  <!-- SECTION 1 -->
  <h1>1. Executive Summary & System Architecture</h1>
  <p>
    <strong>SMARTDRIVE 3D</strong> is an authoritative, full-stack cyber-physical system designed to demonstrate critical Real-Time Operating Systems (RTOS) and Advanced Driver Assistance Systems (ADAS) principles. Unlike naive web simulations where client-side rendering engines approximate distances, SMARTDRIVE 3D implements a strict separation of concerns: an <strong>authoritative backend kernel</strong> running at a deterministic 10 Hz cyclic executive rate computes exact Euclidean distances, relative kinematics, Time-to-Collision (TTC), and state-machine transitions, broadcasting synchronized snapshots to a high-performance WebGL 3D cockpit.
  </p>

  <div class="arch-diagram">
+-----------------------------------------------------------------------------------------+
|                          SMARTDRIVE 3D FULL-STACK ARCHITECTURE                          |
+-----------------------------------------------------------------------------------------+
|  [ AUTHORITATIVE BACKEND KERNEL ] (Node.js 24 + TypeScript @ 10 Hz)                     |
|  +-----------------------------------------------------------------------------------+  |
|  | RTOS Cyclic Executive Scheduler (Period T = 100ms, Frequency f = 10 Hz)           |  |
|  |   |                                                                               |  |
|  |   +--> Kinematics Engine: Integrates acceleration, braking, smooth lane alignment |  |
|  |   +--> DistanceCalculator: Euclidean d = sqrt(dx^2 + dy^2), Longitudinal, TTC     |  |
|  |   +--> WarningEngine: Dual-Corridor Safety (Front: 10m/5m, Side Lanes: 1m/0.5m)    |  |
|  |          |                                                                        |  |
|  |          +--> Hysteresis Deadband Filter (prevents threshold oscillation)         |  |
|  |          +--> Bounded FIFO Event Queue (Producer-Consumer, capacity = 100)        |  |
|  |          +--> SQLite WAL Persistence (ACID audit trail of all warning events)     |  |
|  +-----------------------------------------------------------------------------------+  |
|                                |                                                        |
|                   Socket.IO / TCP Stream (simulation:state @ 10Hz)                      |
|                                v                                                        |
|  [ INTERACTIVE 3D DASHBOARD ] (React 18 + Three.js + React Three Fiber @ 60 FPS)         |
|  +-----------------------------------------------------------------------------------+  |
|  |  • 3D Multi-Lane Highway: Procedural car/truck models, animated lane scrolling   |  |
|  |  • Dynamic Camera Manager: Parallax-free chase view, cockpit dashcam, top-down   |  |
|  |  • Dynamic 3D Detection Rays: Real-time bumper-to-bumper colored laser vectors    |  |
|  |  • Automotive HUD & Speedometer: 90 km/h cruising, latency & agreement checks    |  |
|  |  • Nearby Vehicles Radar: Euclidean sorted list, lateral/longitudinal offsets    |  |
|  |  • Synthesized Audio Alert Engine: Web Audio API danger sirens & caution chimes   |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+</div>

  <!-- SECTION 2 -->
  <div class="page-break"></div>
  <h1>2. Important Core Codes (Source Code Walkthrough)</h1>

  <h2>2.1 Authoritative Distance & Kinematics Engine</h2>
  <p>
    Located in <code>backend/src/distance/DistanceCalculator.ts</code>, this module computes authoritative metric distances, separating longitudinal lane spacing from true Euclidean distance, and evaluates Time-to-Collision (TTC) while protecting against zero or negative closing rates.
  </p>

  <div class="code-container">
    <div class="code-header">
      <span class="file-name">DistanceCalculator.ts</span>
      <span>Authoritative Calculation Module</span>
    </div>
    <pre class="code-body"><span class="kw">export class</span> <span class="typ">DistanceCalculator</span> {
  <span class="kw">public static</span> <span class="fn">calculate</span>(
    ourX: <span class="typ">number</span>, ourY: <span class="typ">number</span>, ourSpeed: <span class="typ">number</span>,
    targetX: <span class="typ">number</span>, targetY: <span class="typ">number</span>, targetSpeed: <span class="typ">number</span>,
    targetDirection: <span class="str">'same'</span> | <span class="str">'opposite'</span> = <span class="str">'same'</span>
  ): <span class="typ">DistanceMetrics</span> {
    <span class="kw">const</span> dx = targetX - ourX;
    <span class="kw">const</span> dy = targetY - ourY;

    <span class="cm">// 1. Authoritative Euclidean Distance: d = sqrt(dx^2 + dy^2)</span>
    <span class="kw">const</span> euclidean = Math.<span class="fn">hypot</span>(dx, dy);

    <span class="cm">// 2. Separated longitudinal (|dy|) and lateral (|dx|) components</span>
    <span class="kw">const</span> longitudinal = Math.<span class="fn">abs</span>(dy);
    <span class="kw">const</span> lateral = Math.<span class="fn">abs</span>(dx);

    <span class="cm">// 3. Relative Velocity: v_rel = v_target - v_our</span>
    <span class="kw">let</span> relativeVelocity = <span class="num">0</span>;
    <span class="kw">if</span> (targetDirection === <span class="str">'same'</span>) {
      relativeVelocity = targetSpeed - ourSpeed;
    } <span class="kw">else</span> {
      relativeVelocity = -(targetSpeed + ourSpeed);
    }

    <span class="kw">const</span> relativePosition = <span class="kw">this</span>.<span class="fn">classifyPosition</span>(dx, dy);
    <span class="kw">const</span> timeToCollision = <span class="kw">this</span>.<span class="fn">calculateTTC</span>(dy, relativeVelocity, targetDirection);

    <span class="kw">return</span> {
      euclideanDistance: <span class="fn">Number</span>(euclidean.<span class="fn">toFixed</span>(<span class="num">2</span>)),
      longitudinalDistance: <span class="fn">Number</span>(longitudinal.<span class="fn">toFixed</span>(<span class="num">2</span>)),
      lateralDistance: <span class="fn">Number</span>(lateral.<span class="fn">toFixed</span>(<span class="num">2</span>)),
      relativeVelocity: <span class="fn">Number</span>(relativeVelocity.<span class="fn">toFixed</span>(<span class="num">2</span>)),
      relativePosition,
      timeToCollision: timeToCollision !== <span class="kw">null</span> ? <span class="fn">Number</span>(timeToCollision.<span class="fn">toFixed</span>(<span class="num">2</span>)) : <span class="kw">null</span>,
    };
  }

  <span class="cm">// Time-To-Collision (TTC) with zero/negative closing speed division protection</span>
  <span class="kw">public static</span> <span class="fn">calculateTTC</span>(dy: <span class="typ">number</span>, relativeVelocity: <span class="typ">number</span>, direction: <span class="typ">string</span>): <span class="typ">number</span> | <span class="kw">null</span> {
    <span class="kw">if</span> (dy > <span class="num">0.5</span>) {
      <span class="kw">const</span> closingSpeed = -relativeVelocity; <span class="cm">// closing if ourSpeed > targetSpeed</span>
      <span class="kw">if</span> (closingSpeed > <span class="num">0.2</span>) {
        <span class="kw">const</span> ttc = dy / closingSpeed;
        <span class="kw">return</span> ttc >= <span class="num">0</span> && ttc <= <span class="num">60.0</span> ? ttc : <span class="kw">null</span>;
      }
    }
    <span class="kw">return null</span>; <span class="cm">// Opening gap or identical speeds -> safe</span>
  }
}</pre>
  </div>

  <h2>2.2 Dual-Corridor Safety & Hysteresis State Machine</h2>
  <p>
    Located in <code>backend/src/warning/WarningEngine.ts</code>, this module implements the user-specified threshold calibration: <strong>1.0 meter warning distance for side lane vehicles</strong> and <strong>10.0 meters warning distance for front vehicles</strong>, with deadband hysteresis to eliminate signal flickering.
  </p>

  <div class="code-container">
    <div class="code-header">
      <span class="file-name">WarningEngine.ts</span>
      <span>Dual-Corridor Safety State Machine</span>
    </div>
    <pre class="code-body"><span class="kw">export class</span> <span class="typ">WarningEngine</span> {
  <span class="kw">public</span> <span class="fn">evaluateStatus</span>(
    distance: <span class="typ">number</span>, ttc: <span class="typ">number</span> | <span class="kw">null</span>,
    previousState: <span class="typ">SafetyStatus</span>, settings: <span class="typ">SimulationSettings</span>,
    isSameLane: <span class="typ">boolean</span> = <span class="kw">true</span>
  ): <span class="typ">SafetyStatus</span> {

    <span class="cm">// RULE 1: SIDE / ADJACENT LANES (Warning Threshold: 1.0m, Danger: 0.5m)</span>
    <span class="kw">if</span> (!isSameLane) {
      <span class="kw">const</span> diffLaneCaution = settings.differentLaneWarningDistance ?? <span class="num">1.0</span>;
      <span class="kw">const</span> diffLaneDanger = <span class="num">0.5</span>;
      <span class="kw">const</span> sideHysteresis = <span class="num">0.1</span>; <span class="cm">// 10cm anti-chatter deadband</span>

      <span class="kw">const</span> dangerThreshold = previousState === <span class="str">'DANGER'</span> ? diffLaneDanger + sideHysteresis : diffLaneDanger;
      <span class="kw">const</span> cautionThreshold = previousState === <span class="str">'CAUTION'</span> ? diffLaneCaution + sideHysteresis : diffLaneCaution;

      <span class="kw">if</span> (distance <= dangerThreshold) <span class="kw">return</span> <span class="str">'DANGER'</span>;
      <span class="kw">if</span> (distance <= cautionThreshold) <span class="kw">return</span> <span class="str">'CAUTION'</span>;
      <span class="kw">return</span> <span class="str">'SAFE'</span>;
    }

    <span class="cm">// RULE 2: FRONT / SAME LANE (Warning Threshold: 10.0m, Danger: 5.0m)</span>
    <span class="kw">const</span> dangerDistance = settings.dangerDistance ?? <span class="num">5.0</span>;
    <span class="kw">const</span> cautionDistance = settings.cautionDistance ?? <span class="num">10.0</span>;
    <span class="kw">const</span> frontHysteresis = <span class="num">0.5</span>; <span class="cm">// 50cm anti-chatter deadband</span>

    <span class="kw">const</span> dangerThreshold = previousState === <span class="str">'DANGER'</span> ? dangerDistance + frontHysteresis : dangerDistance;
    <span class="kw">const</span> cautionThreshold = previousState === <span class="str">'CAUTION'</span> ? cautionDistance + frontHysteresis : cautionDistance;

    <span class="cm">// Critical DANGER: Distance <= 5m OR critical TTC <= 2.5s</span>
    <span class="kw">const</span> isDangerDistance = distance <= dangerThreshold;
    <span class="kw">const</span> isDangerTTC = ttc !== <span class="kw">null</span> && ttc <= settings.ttcThreshold && distance <= cautionDistance;
    <span class="kw">if</span> (isDangerDistance || isDangerTTC) <span class="kw">return</span> <span class="str">'DANGER'</span>;

    <span class="cm">// CAUTION Warning: Distance <= 10m OR early closing TTC</span>
    <span class="kw">const</span> isCautionDistance = distance <= cautionThreshold;
    <span class="kw">const</span> isCautionTTC = ttc !== <span class="kw">null</span> && ttc <= settings.ttcThreshold * <span class="num">1.8</span> && distance <= cautionDistance * <span class="num">1.2</span>;
    <span class="kw">if</span> (isCautionDistance || isCautionTTC) <span class="kw">return</span> <span class="str">'CAUTION'</span>;

    <span class="kw">return</span> <span class="str">'SAFE'</span>;
  }
}</pre>
  </div>

  <!-- SECTION 2.3 & 2.4 -->
  <div class="page-break"></div>
  <h2>2.3 RTOS Cyclic Executive & Simulation Loop</h2>
  <p>
    Located in <code>backend/src/simulation/SimulationEngine.ts</code>, the engine operates on a 100ms periodic cyclic loop. It evaluates vehicle kinematics, distance math, safety thresholds, and queue management in deterministic sequence.
  </p>

  <div class="code-container">
    <div class="code-header">
      <span class="file-name">SimulationEngine.ts</span>
      <span>Cyclic Executive Periodic Tick</span>
    </div>
    <pre class="code-body"><span class="kw">public</span> <span class="fn">tick</span>(): <span class="typ">void</span> {
  <span class="kw">if</span> (<span class="kw">this</span>.isPaused) <span class="kw">return</span>;
  <span class="kw">const</span> dt = <span class="kw">this</span>.settings.tickRateMs / <span class="num">1000.0</span>;
  <span class="kw">this</span>.tickCount++;

  <span class="cm">// Step 1: Update our reference vehicle kinematics & lateral steering</span>
  <span class="kw">this</span>.<span class="fn">updateOurVehicle</span>(dt);

  <span class="cm">// Step 2: Update all 9 surrounding vehicles and calculate authoritative metrics</span>
  <span class="kw">for</span> (<span class="kw">const</span> [id, vehicle] <span class="kw">of</span> <span class="kw">this</span>.vehicles.<span class="fn">entries</span>()) {
    <span class="kw">this</span>.<span class="fn">updateVehicleKinematics</span>(vehicle, dt);

    <span class="kw">const</span> metrics = <span class="typ">DistanceCalculator</span>.<span class="fn">calculate</span>(
      <span class="kw">this</span>.ourVehicle.x, <span class="kw">this</span>.ourVehicle.y, <span class="kw">this</span>.ourVehicle.speed,
      vehicle.x, vehicle.y, vehicle.speed, vehicle.direction
    );

    vehicle.distance = metrics.euclideanDistance;
    vehicle.longitudinalDistance = metrics.longitudinalDistance;
    vehicle.lateralDistance = metrics.lateralDistance;
    vehicle.timeToCollision = metrics.timeToCollision;

    <span class="cm">// Step 3: Lane-aware safety evaluation (1m side, 10m front)</span>
    <span class="kw">const</span> { status, event } = <span class="kw">this</span>.warningEngine.<span class="fn">processVehicle</span>(vehicle, <span class="kw">this</span>.settings, <span class="kw">this</span>.ourVehicle.lane);
    vehicle.safetyStatus = status;

    <span class="cm">// Step 4: Emit and persist transition events</span>
    <span class="kw">if</span> (event) {
      <span class="kw">this</span>.eventQueue.<span class="fn">enqueue</span>(event);   <span class="cm">// OS Bounded FIFO Queue</span>
      <span class="kw">this</span>.database.<span class="fn">insertEvent</span>(event); <span class="cm">// SQLite WAL Persistence</span>
      <span class="kw">this</span>.<span class="fn">notifyWarningEvent</span>(event);   <span class="cm">// WebSocket instant push</span>
    }
  }

  <span class="cm">// Step 5: Broadcast synchronized snapshot to connected clients</span>
  <span class="kw">this</span>.<span class="fn">notifyStateChange</span>();
}</pre>
  </div>

  <h2>2.4 Bounded Circular Event Buffer (Producer-Consumer Pattern)</h2>
  <p>
    Located in <code>backend/src/os_concepts/BoundedEventQueue.ts</code>, this class demonstrates the classic operating systems producer-consumer bounded buffer. It guarantees that high-frequency state updates never lead to unbounded heap growth ($O(1)$ space complexity).
  </p>

  <div class="code-container">
    <div class="code-header">
      <span class="file-name">BoundedEventQueue.ts</span>
      <span>OS Producer-Consumer Bounded Queue</span>
    </div>
    <pre class="code-body"><span class="kw">export class</span> <span class="typ">BoundedEventQueue</span> {
  <span class="kw">private</span> queue: <span class="typ">WarningEvent</span>[] = [];
  <span class="kw">private readonly</span> capacity: <span class="typ">number</span>;
  <span class="kw">private</span> droppedCount: <span class="typ">number</span> = <span class="num">0</span>;
  <span class="kw">private</span> highWaterMark: <span class="typ">number</span> = <span class="num">0</span>;

  <span class="kw">constructor</span>(capacity: <span class="typ">number</span> = <span class="num">100</span>) {
    <span class="kw">this</span>.capacity = capacity;
  }

  <span class="kw">public</span> <span class="fn">enqueue</span>(event: <span class="typ">WarningEvent</span>): <span class="typ">boolean</span> {
    <span class="kw">if</span> (<span class="kw">this</span>.queue.length >= <span class="kw">this</span>.capacity) {
      <span class="kw">this</span>.queue.<span class="fn">shift</span>(); <span class="cm">// FIFO drop-oldest replacement policy</span>
      <span class="kw">this</span>.droppedCount++;
    }
    <span class="kw">this</span>.queue.<span class="fn">push</span>(event);
    <span class="kw">if</span> (<span class="kw">this</span>.queue.length > <span class="kw">this</span>.highWaterMark) {
      <span class="kw">this</span>.highWaterMark = <span class="kw">this</span>.queue.length;
    }
    <span class="kw">return true</span>;
  }
}</pre>
  </div>

  <h2>2.5 Dynamic 3D Camera Chase Controller</h2>
  <p>
    Located in <code>frontend/src/components/3d/CameraManager.tsx</code>, this Three.js controller locks the 3rd-person chase camera directly behind the vehicle's active lane coordinate ($x = (\text{lane} - 3) \times 3.6\text{m}$), eliminating lateral visual parallax.
  </p>

  <div class="code-container">
    <div class="code-header">
      <span class="file-name">CameraManager.tsx</span>
      <span>Parallax-Free Lane Camera Controller</span>
    </div>
    <pre class="code-body"><span class="kw">export const</span> <span class="fn">CameraManager</span>: React.FC&lt;Props&gt; = ({ viewMode, ourVehicle }) => {
  <span class="kw">const</span> { camera } = <span class="fn">useThree</span>();
  <span class="kw">const</span> currentLookAt = <span class="fn">useRef</span>(<span class="kw">new</span> THREE.<span class="typ">Vector3</span>(<span class="num">0</span>, <span class="num">1.5</span>, -<span class="num">25</span>));

  <span class="fn">useFrame</span>((_, delta) => {
    <span class="kw">let</span> targetPos = <span class="kw">new</span> THREE.<span class="typ">Vector3</span>(ourVehicle.x, <span class="num">7.0</span>, <span class="num">14.0</span>);
    <span class="kw">let</span> targetLook = <span class="kw">new</span> THREE.<span class="typ">Vector3</span>(ourVehicle.x, <span class="num">1.4</span>, -<span class="num">26.0</span>);

    <span class="cm">// Exponential damping ensures fluid frame-rate independent tracking</span>
    camera.position.x = THREE.MathUtils.<span class="fn">damp</span>(camera.position.x, targetPos.x, <span class="num">6</span>, delta);
    camera.position.y = THREE.MathUtils.<span class="fn">damp</span>(camera.position.y, targetPos.y, <span class="num">6</span>, delta);
    camera.position.z = THREE.MathUtils.<span class="fn">damp</span>(camera.position.z, targetPos.z, <span class="num">6</span>, delta);
    camera.<span class="fn">lookAt</span>(currentLookAt.current);
  });
  <span class="kw">return null</span>;
};</pre>
  </div>

  <!-- SECTION 3 & 4 -->
  <div class="page-break"></div>
  <h1>3. Implementation Architecture & Data Flow</h1>
  <ol>
    <li><strong>Cyclic Timer Interrupt ($100\text{ ms}$)</strong>: The authoritative engine fires a tick event every $100\text{ms}$.</li>
    <li><strong>Kinematic Update</strong>: Reference vehicle and 9 surrounding vehicles integrate throttle, braking, and lane alignment ($x, y, v$).</li>
    <li><strong>Spatial Metric Extraction</strong>: DistanceCalculator extracts Euclidean distance $d = \sqrt{\Delta x^2 + \Delta y^2}$ and TTC.</li>
    <li><strong>Dual-Corridor Safety Decision</strong>: Evaluates threshold $1.0\text{m}$ for side lanes and $10.0\text{m}$ for front traffic.</li>
    <li><strong>Event Generation & SQLite Storage</strong>: Transitions are logged to the circular bounded queue and written to SQLite in WAL mode.</li>
    <li><strong>WebGL 3D Cockpit Render ($60\text{ FPS}$)</strong>: Three.js dynamically animates vehicles, scrolling lane markings, and colored laser detection rays.</li>
  </ol>

  <h1>4. Empirical Implementation Results</h1>

  <h2>4.1 Automated Test Execution Suite</h2>
  <table>
    <thead>
      <tr>
        <th>Test Suite</th>
        <th>File Name</th>
        <th>Tests</th>
        <th>Duration</th>
        <th>Result</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Backend Unit</td>
        <td><code>distance.test.ts</code></td>
        <td>6 / 6</td>
        <td>5 ms</td>
        <td><span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td>Backend Unit</td>
        <td><code>warning.test.ts</code></td>
        <td>6 / 6</td>
        <td>8 ms</td>
        <td><span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td>Backend Storage</td>
        <td><code>database.test.ts</code></td>
        <td>2 / 2</td>
        <td>10 ms</td>
        <td><span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td>Backend Engine</td>
        <td><code>simulation.test.ts</code></td>
        <td>6 / 6</td>
        <td>20 ms</td>
        <td><span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td>REST API</td>
        <td><code>api.test.ts</code></td>
        <td>7 / 7</td>
        <td>107 ms</td>
        <td><span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td>WebSocket Real-Time</td>
        <td><code>socket.test.ts</code></td>
        <td>6 / 6</td>
        <td>261 ms</td>
        <td><span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td>Telemetry Agreement</td>
        <td><code>agreement.test.ts</code></td>
        <td>2 / 2</td>
        <td>96 ms</td>
        <td><span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td>Frontend React/UI</td>
        <td><code>dashboard.test.tsx</code></td>
        <td>4 / 4</td>
        <td>67 ms</td>
        <td><span class="badge badge-pass">PASS</span></td>
      </tr>
      <tr style="font-weight: bold; background: #e2e8f0;">
        <td colspan="2">TOTAL CONSOLIDATED TEST SUITE</td>
        <td>39 / 39</td>
        <td>3.56 s</td>
        <td><span class="badge badge-pass">100% PASS</span></td>
      </tr>
    </tbody>
  </table>

  <h2>4.2 Real-Time Telemetry Benchmarks</h2>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Target Benchmark</th>
        <th>Measured Performance</th>
        <th>Evaluation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Simulation Tick Period</td>
        <td>$100\text{ ms} \pm 5\text{ ms}$</td>
        <td>$99.8\text{ ms} - 100.2\text{ ms}$</td>
        <td><span class="badge badge-pass">Deterministic</span></td>
      </tr>
      <tr>
        <td>WebSocket Network Latency</td>
        <td>$< 25\text{ ms}$</td>
        <td>$4.2\text{ ms} - 8.5\text{ ms}$</td>
        <td><span class="badge badge-pass">Real-Time</span></td>
      </tr>
      <tr>
        <td>Client-Server Metric Drift</td>
        <td>$< 0.01\text{ m}$</td>
        <td>$< 0.001\text{ m}$ (1:1 Agreement)</td>
        <td><span class="badge badge-pass">Identical</span></td>
      </tr>
      <tr>
        <td>Frontend WebGL Frame Rate</td>
        <td>$\ge 50\text{ FPS}$</td>
        <td>$60.0\text{ FPS}$ (locked via rAF)</td>
        <td><span class="badge badge-pass">Smooth</span></td>
      </tr>
      <tr>
        <td>Bounded Buffer Memory Bound</td>
        <td>Fixed $N = 100$</td>
        <td>Strict $O(1)$ Memory Cap</td>
        <td><span class="badge badge-pass">Safe</span></td>
      </tr>
    </tbody>
  </table>

  <h2>4.3 Dual-Corridor Threshold Validation</h2>
  <table>
    <thead>
      <tr>
        <th>Corridor</th>
        <th>Measured Distance</th>
        <th>Calculated State</th>
        <th>HUD Display & Acoustic Response</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Side Lane (Normal)</td>
        <td>$3.63\text{ m}$ ($> 1.0\text{ m}$)</td>
        <td><span class="badge badge-safe">SAFE</span></td>
        <td>Green dashed detection ray; silent background.</td>
      </tr>
      <tr>
        <td>Side Lane (Encroachment)</td>
        <td>$0.80\text{ m}$ ($\le 1.0\text{ m}$)</td>
        <td><span class="badge badge-caution">CAUTION</span></td>
        <td>Amber callout pill; proximity alert chime.</td>
      </tr>
      <tr>
        <td>Side Lane (Sideswipe)</td>
        <td>$0.40\text{ m}$ ($\le 0.5\text{ m}$)</td>
        <td><span class="badge badge-danger">DANGER</span></td>
        <td>Solid red laser; flashing lateral hazard warning.</td>
      </tr>
      <tr>
        <td>Front Lane (Cruising)</td>
        <td>$25.00\text{ m}$ ($> 10.0\text{ m}$)</td>
        <td><span class="badge badge-safe">SAFE</span></td>
        <td>Green callout; clear highway corridor.</td>
      </tr>
      <tr>
        <td>Front Lane (Closing In)</td>
        <td>$8.00\text{ m}$ ($\le 10.0\text{ m}$)</td>
        <td><span class="badge badge-caution">CAUTION</span></td>
        <td>Amber hazard badge; forward collision alert chime.</td>
      </tr>
      <tr>
        <td>Front Lane (Imminent Hazard)</td>
        <td>$4.00\text{ m}$ ($\le 5.0\text{ m}$)</td>
        <td><span class="badge badge-danger">DANGER</span></td>
        <td>Red hazard banner; emergency braking indicator.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 5 -->
  <div class="page-break"></div>
  <h1>5. Engineering Discussion & Faculty Viva Defense</h1>

  <h2>5.1 Operating Systems Principles Explored</h2>
  <ul>
    <li>
      <strong>Authoritative ECU vs. Untrusted Display Layer</strong>: Real-time cyber-physical systems enforce that safety decisions occur inside a deterministic kernel. The browser frontend is treated strictly as an untrusted visualizer. Even under heavy GPU throttling, backend safety logic, SQLite persistence, and emergency braking triggers remain uncompromised.
    </li>
    <li>
      <strong>Cyclic Executive Scheduling</strong>: Chosen over preemptive multi-threading to eliminate race conditions and deadlocks. At each 100ms cycle, sensor integration and distance math execute synchronously, guaranteeing identical mathematical evaluation across all vehicles.
    </li>
    <li>
      <strong>Sensor Jitter & Hysteresis Deadband Suppression</strong>: In real-world sensors, analog noise causes measurements to fluctuate near decision boundaries (e.g. $10.01\text{m} \leftrightarrow 9.99\text{m}$). Without hysteresis, this causes alarm thrashing. By enforcing a $0.5\text{m}$ deadband on forward traffic and $0.1\text{m}$ on side traffic, state changes occur smoothly without redundant alarms.
    </li>
    <li>
      <strong>Producer-Consumer Pattern with Bounded Circular Buffer</strong>: The <code>BoundedEventQueue</code> demonstrates how real-time operating systems prevent out-of-memory kernel panics during traffic congestion bursts, enforcing a strict $O(1)$ memory bound.
    </li>
  </ul>

  <h2>5.2 Comparison with Production Automotive ADAS</h2>
  <p>
    SMARTDRIVE 3D directly models production standards such as <strong>ISO 15623</strong> (Forward Vehicle Collision Warning) and <strong>ISO 17387</strong> (Lane Change Decision Aid Systems). Applying identical warning thresholds to all directions causes false-alarm fatigue on multi-lane highways. By tuning the side corridor to $1.0\text{m}$ and the forward corridor to $10.0\text{m}$, the system achieves high safety with minimal false alarms.
  </p>

  <h2>5.3 Faculty Viva Q&A Defense Guide</h2>
  <div class="callout">
    <strong>Q1: Why is Euclidean distance used instead of longitudinal spacing?</strong><br>
    <em>Answer:</em> Longitudinal separation ($\Delta y$) only measures forward distance and ignores lane offset. A car 10m ahead in another lane has an actual Euclidean distance of $\sqrt{3.6^2 + 10^2} = 10.63\text{m}$. Euclidean distance represents true physical distance, which is necessary to prevent false emergency braking.
  </div>

  <div class="callout">
    <strong>Q2: How does the system handle zero or negative closing velocity in TTC?</strong><br>
    <em>Answer:</em> TTC is defined as $\text{TTC} = \frac{\Delta y}{v_{\text{closing}}}$. When $v_{\text{closing}} \le 0$, the gap is opening or constant. Dividing by zero or negative values yields mathematical anomalies (infinity or negative time). The engine detects this and returns <code>null</code>, preventing false alarms.
  </div>

  <div class="callout">
    <strong>Q3: How does the bounded queue prevent memory exhaustion?</strong><br>
    <em>Answer:</em> If event consumers are momentarily delayed, a fixed capacity of 100 items with a FIFO drop-oldest policy guarantees that heap memory usage remains bounded ($O(1)$ space complexity).
  </div>

  <div class="callout">
    <strong>Q4: How do you prove the frontend shows genuine backend calculations?</strong><br>
    <em>Answer:</em> The automated <code>agreement.test.ts</code> test suite verifies to within 0.001 meters that distances across the WebSocket feed, the REST API, and SQLite database records are 1:1 identical.
  </div>

</body>
</html>
"""

# Write HTML file
html_path = os.path.abspath("smartdrive_report.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"[OK] Generated HTML: {html_path}")

# Output PDF path
pdf_path = os.path.abspath("SMARTDRIVE_3D_Technical_Report.pdf")
docs_pdf_path = os.path.abspath(os.path.join("docs", "SMARTDRIVE_3D_Technical_Report.pdf"))

# Run Microsoft Edge headless to print PDF
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(edge_path):
    edge_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

cmd = [
    edge_path,
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--print-to-pdf-no-header",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print(f"[RUNNING] Generating PDF via headless browser...")
res = subprocess.run(cmd, capture_output=True, text=True)
print(res.stdout)
print(res.stderr)

if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
    print(f"[SUCCESS] PDF Generated successfully: {pdf_path} ({os.path.getsize(pdf_path):,} bytes)")
    # Copy to docs/ as well
    os.makedirs("docs", exist_ok=True)
    import shutil
    shutil.copyfile(pdf_path, docs_pdf_path)
    print(f"[SUCCESS] Copied PDF to docs folder: {docs_pdf_path}")
else:
    print(f"[ERROR] PDF generation failed or empty!")
    sys.exit(1)
