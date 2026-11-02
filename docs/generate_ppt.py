import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    # Color Palette (Modern Dark / Automotive Tech Theme)
    COLOR_BG = RGBColor(15, 23, 42)          # Deep Slate / Navy (#0F172A)
    COLOR_CARD = RGBColor(30, 41, 59)        # Slate Card (#1E293B)
    COLOR_CARD_BORDER = RGBColor(51, 65, 85) # Border (#334155)
    COLOR_ACCENT = RGBColor(56, 189, 248)    # Bright Cyan / Teal (#38BDF8)
    COLOR_ACCENT_ALT = RGBColor(168, 85, 247)# Purple Accent (#A855F7)
    COLOR_TEXT_MAIN = RGBColor(248, 250, 252)# Bright White (#F8FAFC)
    COLOR_TEXT_MUTED = RGBColor(148, 163, 184)# Muted Gray (#94A3B8)
    COLOR_GREEN = RGBColor(34, 197, 94)      # Success Green (#22C55E)
    COLOR_AMBER = RGBColor(245, 158, 11)     # Warning Amber (#F59E0B)
    COLOR_CODE_BG = RGBColor(10, 15, 30)     # Dark Code Box

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category="DRIVER MONITORING OPERATING SYSTEM"):
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.name = 'Arial'
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_ACCENT

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.7), Inches(0.7))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.name = 'Arial'
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_TEXT_MAIN

    def add_card(slide, left, top, width, height, title=None, title_color=COLOR_ACCENT):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = COLOR_CARD_BORDER
        card.line.width = Pt(1.5)
        
        if title:
            tb = slide.shapes.add_textbox(left + Inches(0.15), top + Inches(0.15), width - Inches(0.3), Inches(0.45))
            tf = tb.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = title
            p.font.name = 'Arial'
            p.font.size = Pt(14)
            p.font.bold = True
            p.font.color.rgb = title_color
        return card

    def add_code_card(slide, left, top, width, height, title, code_text):
        add_card(slide, left, top, width, height, title, COLOR_ACCENT)
        cbox = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.15), top + Inches(0.65), width - Inches(0.3), height - Inches(0.8))
        cbox.fill.solid()
        cbox.fill.fore_color.rgb = COLOR_CODE_BG
        cbox.line.color.rgb = RGBColor(51, 65, 85)
        cbox.line.width = Pt(1)

        tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.7), width - Inches(0.4), height - Inches(0.9))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = code_text
        p.font.name = 'Courier New'
        p.font.size = Pt(9.5)
        p.font.color.rgb = RGBColor(56, 189, 248)

    def add_flowchart_card(slide, left, top, width, height, title, flow_steps, color=COLOR_GREEN):
        add_card(slide, left, top, width, height, title, color)
        tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.65), width - Inches(0.4), height - Inches(0.8))
        tf = tb.text_frame
        tf.word_wrap = True

        for idx, (step_num, step_title, step_desc) in enumerate(flow_steps):
            p = tf.add_paragraph() if idx > 0 else tf.paragraphs[0]
            p.text = f"Step {step_num}: {step_title}"
            p.font.bold = True
            p.font.size = Pt(11)
            p.font.color.rgb = color
            p.space_before = Pt(6) if idx > 0 else Pt(0)

            p2 = tf.add_paragraph()
            p2.text = f"   ↳ {step_desc}"
            p2.font.size = Pt(10)
            p2.font.color.rgb = COLOR_TEXT_MUTED
            
            if idx < len(flow_steps) - 1:
                p_arrow = tf.add_paragraph()
                p_arrow.text = "        ▼"
                p_arrow.font.size = Pt(8)
                p_arrow.font.color.rgb = COLOR_ACCENT

    # ==========================================
    # SLIDE 1: TITLE SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s1)

    bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(0.15), Inches(3.2))
    bar.fill.solid()
    bar.fill.fore_color.rgb = COLOR_ACCENT
    bar.line.fill.background()

    tbox = s1.shapes.add_textbox(Inches(1.2), Inches(1.7), Inches(11), Inches(3.5))
    tf1 = tbox.text_frame
    tf1.word_wrap = True
    p1 = tf1.paragraphs[0]
    p1.text = "Context-Aware Real-Time\nDriver Monitoring Operating System"
    p1.font.name = 'Arial'
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = COLOR_TEXT_MAIN

    p2 = tf1.add_paragraph()
    p2.text = "Code Implementation Analysis & Visual Concept Flowcharts"
    p2.font.name = 'Arial'
    p2.font.size = Pt(18)
    p2.font.color.rgb = COLOR_ACCENT
    p2.space_before = Pt(12)

    p3 = tf1.add_paragraph()
    p3.text = "Operating Systems Capstone Project • Faculty Technical Presentation"
    p3.font.name = 'Arial'
    p3.font.size = Pt(14)
    p3.font.color.rgb = COLOR_TEXT_MUTED
    p3.space_before = Pt(10)

    fcard = add_card(s1, Inches(0.8), Inches(5.4), Inches(11.7), Inches(1.3))
    ftb = s1.shapes.add_textbox(Inches(1.1), Inches(5.55), Inches(11.1), Inches(1.0))
    ftf = ftb.text_frame
    ftf.word_wrap = True
    fp = ftf.paragraphs[0]
    fp.text = "CORE MODULES: Bare-Metal x86 Kernel • IDT & 8259 PIC Remap • 8254 PIT @ 100Hz • Round-Robin Task Scheduler\nAtomic Spinlocks (xchgl) • Synchronized IPC • Butterworth Noise Filter • Adaptive HDOP Fusion • Context Classifier"
    fp.font.name = 'Arial'
    fp.font.size = Pt(12)
    fp.font.color.rgb = COLOR_TEXT_MAIN

    # ==========================================
    # SLIDE 2: MOTIVATION & PROBLEM STATEMENT
    # ==========================================
    s2 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s2)
    add_header(s2, "Motivation & Problem Statement", "PROJECT BACKGROUND")

    c1 = add_card(s2, Inches(0.8), Inches(1.6), Inches(3.7), Inches(5.2), "Road Safety Challenges", COLOR_AMBER)
    tb1 = s2.shapes.add_textbox(Inches(0.95), Inches(2.2), Inches(3.4), Inches(4.3))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    for h, b in [("Fatigue & Distraction", "90%+ traffic accidents are caused by driver microsleep and erratic maneuvers."),
                 ("False Warning Fatigue", "Conventional systems beep unnecessarily during emergency evasive maneuvers."),
                 ("Sensor Dropout", "Satellite GPS signals degrade heavily in tunnels and urban areas (high HDOP).")]:
        p = tf1.add_paragraph()
        p.text = f"• {h}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MAIN
        p.space_before = Pt(8)
        p2 = tf1.add_paragraph()
        p2.text = b
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    c2 = add_card(s2, Inches(4.8), Inches(1.6), Inches(3.7), Inches(5.2), "General OS Inadequacy", COLOR_AMBER)
    tb2 = s2.shapes.add_textbox(Inches(4.95), Inches(2.2), Inches(3.4), Inches(4.3))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    for h, b in [("Non-Deterministic Jitter", "Desktop OSs (Windows/Linux) have background daemon scheduling latency spikes unsafe for vehicles."),
                 ("Heavy Memory Overhead", "Requires gigabytes of RAM and complex graphic abstractions."),
                 ("No Raw I/O Control", "User applications cannot directly manipulate raw hardware timers or I/O ports.")]:
        p = tf2.add_paragraph()
        p.text = f"• {h}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MAIN
        p.space_before = Pt(8)
        p2 = tf2.add_paragraph()
        p2.text = b
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    c3 = add_card(s2, Inches(8.8), Inches(1.6), Inches(3.7), Inches(5.2), "Our Engineered Solution", COLOR_GREEN)
    tb3 = s2.shapes.add_textbox(Inches(8.95), Inches(2.2), Inches(3.4), Inches(4.3))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    for h, b in [("Bare-Metal 32-Bit Micro-Kernel", "Deterministic 100Hz interrupt scheduling with microsecond execution."),
                 ("Atomic Spinlocks & IPC", "Thread-safe communication between sensor and safety monitoring tasks."),
                 ("Context-Aware Intelligence", "Distinguishes aggressive driving from justifiable defensive maneuvers.")]:
        p = tf3.add_paragraph()
        p.text = f"• {h}: "
        p.font.bold = True
        p.font.size = Pt(12)
        p.font.color.rgb = COLOR_TEXT_MAIN
        p.space_before = Pt(8)
        p2 = tf3.add_paragraph()
        p2.text = b
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    # ==========================================
    # SLIDE 3: SYSTEM ARCHITECTURE
    # ==========================================
    s3 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s3)
    add_header(s3, "Dual-Tier System Architecture", "SYSTEM ARCHITECTURE")

    add_card(s3, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Tier 1: Bare-Metal x86 Kernel (C & ASM)", COLOR_ACCENT)
    tb_t1 = s3.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.3))
    tft1 = tb_t1.text_frame
    tft1.word_wrap = True
    for h, d in [
        ("Multiboot Bootstrap & Protected Mode", "Bootstraps via GRUB into 32-bit flat protected mode (Code: 0x08, Data: 0x10)."),
        ("IDT & 8259 PIC Remapping", "Hardware IRQ0 (Timer @ 100Hz) and IRQ1 (Keyboard ISR) with 0x8E interrupt gates."),
        ("Round-Robin Task Scheduler", "Periodically switches between SENSOR, SAFETY, and DISPLAY tasks every timer tick."),
        ("Atomic Spinlocks & IPC Queue", "Synchronizes inter-task messages using atomic `xchgl` assembly instructions."),
        ("Bump Heap Allocator & Direct VGA", "1MB heap at 0x01000000 and direct memory-mapped VGA console at 0xB8000.")
    ]:
        p = tft1.add_paragraph()
        p.text = f"► {h}"
        p.font.bold = True
        p.font.size = Pt(11.5)
        p.font.color.rgb = COLOR_ACCENT
        p.space_before = Pt(6)
        p2 = tft1.add_paragraph()
        p2.text = d
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    add_card(s3, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Tier 2: Context-Aware Analytics & Fusion", COLOR_ACCENT_ALT)
    tb_t2 = s3.shapes.add_textbox(Inches(7.0), Inches(2.2), Inches(5.3), Inches(4.3))
    tft2 = tb_t2.text_frame
    tft2.word_wrap = True
    for h, d in [
        ("Butterworth Low-Pass Filtering", "2nd order zero-phase digital filter removes chassis vibration and engine noise above 0.15 cutoff."),
        ("Dynamic Sensor Fusion (HDOP Weighted)", "Dynamically calculates GPS, OBD-II, and IMU reliability weights based on satellite precision."),
        ("Personalized Driver Baseline", "Calibrates individualized average acceleration, gyro, and speed window during initial driving."),
        ("Hard Safety Constraint Engine", "Evaluates critical thresholds (Speed > 60 km/h, G-force > 0.8g) for immediate safety violation detection."),
        ("Contextual Event Classifier", "Differentiates NORMAL, AGGRESSIVE, POTHOLE AVOIDING, and JUSTIFIABLE / DEFENSIVE maneuvers.")
    ]:
        p = tft2.add_paragraph()
        p.text = f"► {h}"
        p.font.bold = True
        p.font.size = Pt(11.5)
        p.font.color.rgb = COLOR_ACCENT_ALT
        p.space_before = Pt(6)
        p2 = tft2.add_paragraph()
        p2.text = d
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    # ==========================================
    # SLIDE 4: HARDWARE ICS
    # ==========================================
    s4 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s4)
    add_header(s4, "Hardware Integrated Circuits (ICs) & Controllers", "HARDWARE INTERFACE LAYER")

    ics = [
        ("Intel 8254 PIT", "Programmable Interval Timer", "• Mode 3 (Square Wave Generator)\n• Frequency: 1.193182 MHz / 100 = 100Hz\n• Port 0x43 (Command), Port 0x40 (Channel 0)\n• Drives IRQ0 timer interrupt every 10ms"),
        ("Intel 8259A Dual PIC", "Interrupt Controller", "• Master PIC: Ports 0x20 / 0x21\n• Slave PIC: Ports 0xA0 / 0xA1\n• Remapped IRQs to INT 32 - 47\n• Handles EOI signaling and masking"),
        ("Intel 8042 PS/2", "Keyboard Controller", "• Data Port 0x60, Status Port 0x64\n• Translates Set 1 Scancodes\n• Extended scancode (0xE0) support\n• Pulse reset line for hardware reboot"),
        ("MPU-6050 IMU IC", "6-Axis Motion Tracking", "• 3-Axis Accelerometer (X, Y, Z)\n• 3-Axis Gyroscope (Yaw, Pitch, Roll)\n• Digital Output sampled by Sensor Task\n• Real-time telemetric gravity vector"),
        ("NEO-6M GPS Module", "Position & Speed Sensor", "• Serial NMEA communication\n• Reports HDOP (Horizontal Dilution)\n• Provides satellite-ground speed\n• HDOP dynamically drives fusion weight"),
        ("ELM327 OBD-II IC", "Vehicle Telemetry Interface", "• Interfaced with Vehicle CAN-Bus\n• Reads true wheel speed from ECU\n• High accuracy fallback during GPS loss\n• Engine RPM & throttle sensor stream")
    ]
    for idx, (name, role, desc) in enumerate(ics):
        col = idx % 3
        row = idx // 3
        x = Inches(0.8 + col * 4.0)
        y = Inches(1.6 + row * 2.7)
        add_card(s4, x, y, Inches(3.7), Inches(2.4), f"{name}", COLOR_ACCENT)
        stb = s4.shapes.add_textbox(x + Inches(0.15), y + Inches(0.55), Inches(3.4), Inches(0.3))
        stf = stb.text_frame
        sp = stf.paragraphs[0]
        sp.text = role
        sp.font.bold = True
        sp.font.size = Pt(11)
        sp.font.color.rgb = COLOR_GREEN
        dtb = s4.shapes.add_textbox(x + Inches(0.15), y + Inches(0.85), Inches(3.4), Inches(1.45))
        dtf = dtb.text_frame
        dtf.word_wrap = True
        dp = dtf.paragraphs[0]
        dp.text = desc
        dp.font.size = Pt(10)
        dp.font.color.rgb = COLOR_TEXT_MUTED

    # ==========================================
    # SLIDE 5: CODE + FLOWCHART - IDT & PIC REMAP
    # ==========================================
    s5 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s5)
    add_header(s5, "Code & Execution Flowchart: IDT & 8259 PIC Remap", "INTERRUPT HANDLING SUBSYSTEM")

    code_idt = """/* 1. Remap 8259 Master & Slave PIC */
static void pic_remap(void) {
    outb(0x20, 0x11); io_wait();
    outb(0xA0, 0x11); io_wait();
    outb(0x21, 0x20); /* Master IRQ0..7 -> INT 32..39 */
    outb(0xA1, 0x28); /* Slave IRQ8..15 -> INT 40..47 */
    outb(0x21, 0x04); io_wait();
    outb(0xA1, 0x02); io_wait();
    outb(0x21, 0x01); io_wait();
    outb(0xA1, 0x01); io_wait();
    outb(0x21, 0xFC); /* Unmask IRQ0 & IRQ1 */
}

/* 2. Load IDT with Kernel Code Selector 0x08 */
for (int i = 0; i < 256; i++) {
    idt_set_gate(i, (uint32_t)default_interrupt, 0x08, 0x8E);
}
idt_set_gate(32, (uint32_t)timer_interrupt, 0x08, 0x8E);
idt_set_gate(33, (uint32_t)keyboard_interrupt, 0x08, 0x8E);"""
    add_code_card(s5, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "C Implementation (src/idt.c)", code_idt)

    idt_flow = [
        ("1", "Hardware Trigger", "PIT 8254 or Keyboard sends IRQ pulse to 8259 PIC."),
        ("2", "Vector Remap", "8259 PIC translates IRQ0 to INT 32 and IRQ1 to INT 33."),
        ("3", "IDT Gate Lookup", "CPU indexes IDT at entry 32/33, loads Code Selector 0x08 & EIP."),
        ("4", "ISR Assembly Stub", "Pushes general registers (pusha), sets DS=0x10, and calls C handler."),
        ("5", "EOI Acknowledgment", "Handler sends End-of-Interrupt (0x20) to port 0x20 and returns with iretd.")
    ]
    add_flowchart_card(s5, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Execution Logic Flowchart", idt_flow, COLOR_GREEN)

    # ==========================================
    # SLIDE 6: CODE + FLOWCHART - TIMER & SCHEDULER
    # ==========================================
    s6 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s6)
    add_header(s6, "Code & Execution Flowchart: PIT 100Hz & Round-Robin Scheduler", "TASK SCHEDULING SUBSYSTEM")

    code_sched = """/* PIT 8254 @ 100Hz (timer.c) */
void timer_init(void) {
    uint32_t divisor = 1193182 / 100;
    outb(0x43, 0x36); /* Square Wave Mode 3 */
    outb(0x40, (uint8_t)(divisor & 0xFF));
    outb(0x40, (uint8_t)((divisor >> 8) & 0xFF));
}

/* Round-Robin Dispatcher (scheduler.c) */
void scheduler_tick(void) {
    int total = task_count();
    if (total == 0) return;

    ticks++;
    current_task = (current_task + 1) % total;

    /* Dispatches Next Task in Round-Robin */
    task_run(current_task);
}"""
    add_code_card(s6, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "C Implementation (timer.c & scheduler.c)", code_sched)

    sched_flow = [
        ("1", "Timer Interrupt Fired", "PIT 8254 generates hardware tick every 10ms (100Hz frequency)."),
        ("2", "Enter scheduler_tick()", "Increments total ticks and advances current_task index modulo total_tasks."),
        ("3", "Task 0: SENSOR Task", "Polls IMU accelerometer & gyroscope, packages data, calls ipc_send()."),
        ("4", "Task 1: SAFETY Task", "Receives IPC message, computes safety score, updates driver state."),
        ("5", "Task 2: DISPLAY Task", "Fetches latest monitoring result, paints telemetry on VGA row 8.")
    ]
    add_flowchart_card(s6, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Round-Robin Task Execution Flowchart", sched_flow, COLOR_ACCENT_ALT)

    # ==========================================
    # SLIDE 7: CODE + FLOWCHART - SPINLOCKS & IPC
    # ==========================================
    s7 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s7)
    add_header(s7, "Code & Execution Flowchart: Atomic Spinlocks & IPC Queue", "CONCURRENCY & IPC SUBSYSTEM")

    code_ipc = """/* Atomic Spinlock using xchgl (sync.c) */
void spinlock_acquire(spinlock_t *lock) {
    uint32_t value;
    do {
        __asm__ volatile (
            "xchgl %0, %1"
            : "=r"(value), "+m"(lock->locked)
            : "0"(1)
            : "memory"
        );
    } while (value != 0);
}

/* Synchronized IPC Enqueue (ipc.c) */
int ipc_send(int sender, int receiver, uint32_t data) {
    spinlock_acquire(&ipc_lock);
    if (queue_count >= IPC_QUEUE_SIZE) {
        spinlock_release(&ipc_lock);
        return -1;
    }
    queue[queue_tail].sender = sender;
    queue[queue_tail].receiver = receiver;
    queue[queue_tail].data = data;
    queue_tail = (queue_tail + 1) % IPC_QUEUE_SIZE;
    queue_count++;
    spinlock_release(&ipc_lock);
    return 0;
}"""
    add_code_card(s7, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "C & Assembly Implementation (sync.c & ipc.c)", code_ipc)

    ipc_flow = [
        ("1", "Lock Acquisition", "Task invokes spinlock_acquire(); hardware atomic xchgl attempts lock."),
        ("2", "Spinlock Loop", "If lock was already held (value==1), CPU spins; if 0, lock acquired."),
        ("3", "Critical Section", "Checks queue capacity, writes message at queue_tail, advances tail pointer."),
        ("4", "Lock Release", "Sets lock->locked = 0 with memory barrier; allows other tasks access."),
        ("5", "IPC Receive / Dequeue", "Safety task acquires lock, retrieves matching receiver message, shifts queue.")
    ]
    add_flowchart_card(s7, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Atomic Synchronization Flowchart", ipc_flow, COLOR_GREEN)

    # ==========================================
    # SLIDE 8: CODE + FLOWCHART - BUTTERWORTH & SENSOR FUSION
    # ==========================================
    s8 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s8)
    add_header(s8, "Code & Flowchart: Butterworth Filter & Adaptive Speed Fusion", "ANALYTICS & SIGNAL PROCESSING")

    code_fuse = """# 1. Butterworth Low-Pass Filter (preprocessing.py)
def low_pass_filter(data, cutoff=0.15, order=2):
    data = np.asarray(data, dtype=float)
    if len(data) < 10: return data
    b, a = butter(order, cutoff, btype="low")
    return filtfilt(b, a, data) # Zero phase delay

# 2. Adaptive Speed Fusion (sensor_fusion.py)
def calculate_weights(gps_hdop):
    if gps_hdop <= 2.0:
        return 0.40, 0.40, 0.20, "HIGH"    # Good Sky
    elif gps_hdop <= 5.0:
        return 0.25, 0.45, 0.30, "MEDIUM"  # Suburban
    else:
        return 0.10, 0.60, 0.30, "LOW"     # Tunnel

def fuse_speed(gps_spd, obd_spd, imu_spd, hdop):
    w_gps, w_obd, w_imu, rel = calculate_weights(hdop)
    fused = (gps_spd*w_gps + obd_spd*w_obd + imu_spd*w_imu)
    return fused, w_gps, w_obd, w_imu, rel"""
    add_code_card(s8, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Python Implementation (preprocessing & fusion)", code_fuse)

    fuse_flow = [
        ("1", "Raw Sensor Ingestion", "Polls noisy raw acceleration, gyro, GPS speed, HDOP, and OBD-II wheel speed."),
        ("2", "Butterworth Low-Pass", "filtfilt() strips high-frequency engine harmonics & chassis vibration."),
        ("3", "HDOP Quality Evaluation", "Evaluates GPS satellite geometry: HDOP <= 2.0 (High) vs HDOP > 5.0 (Low)."),
        ("4", "Dynamic Weight Assignment", "In tunnels (HDOP > 5), GPS weight drops to 10% and OBD increases to 60%."),
        ("5", "Fused Speed Output", "Computes linear weighted combination with zero dropout error.")
    ]
    add_flowchart_card(s8, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Adaptive Sensor Fusion Flowchart", fuse_flow, COLOR_ACCENT)

    # ==========================================
    # SLIDE 9: CODE + FLOWCHART - BASELINE & CLASSIFIER
    # ==========================================
    s9 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s9)
    add_header(s9, "Code & Decision Flowchart: Driver Baseline & Context Classifier", "SAFETY CLASSIFICATION ENGINE")

    code_cls = """# 1. Driver Baseline Calibration (baseline.py)
class DriverBaseline:
    def calibrate(self, df):
        self.avg_accel = df["filtered_acceleration"].mean()
        self.avg_gyro = df["filtered_gyro"].mean()
        self.avg_speed = df["obd_speed"].mean()

    def get_deviation(self, accel):
        return abs(accel - self.avg_accel)

# 2. Contextual Event Classifier (classifier.py)
def classify_event(accel, steer, context, safety_ok):
    if context["pothole"]:
        return "POTHOLE AVOIDING"
    if context["obstacle"]:
        return "JUSTIFIABLE / DEFENSIVE"
    if not safety_ok:
        return "AGGRESSIVE"
    if abs(steer) > 25:
        return "DEFENSIVE" if context["road_type"]=="curve" else "AGGRESSIVE"
    return "NORMAL" """
    add_code_card(s9, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Python Implementation (baseline & classifier)", code_cls)

    cls_flow = [
        ("1", "Baseline Habit Calibration", "Calculates individualized driving averages (μ_accel, μ_gyro, μ_speed)."),
        ("2", "Deviation Calculation", "Calculates |current_accel - baseline_avg|; deviation > 0.30g adds +20 risk."),
        ("3", "Hard Constraint Check", "Verifies Speed <= 60 km/h and G-force <= 0.8g (Violations add +40 risk)."),
        ("4", "Environmental Context Check", "Inspects road pothole and forward obstacle telemetry flags."),
        ("5", "Behavior Categorization", "Outputs NORMAL, POTHOLE AVOIDING, DEFENSIVE, or AGGRESSIVE classification.")
    ]
    add_flowchart_card(s9, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Context Decision Tree Flowchart", cls_flow, COLOR_GREEN)

    # ==========================================
    # SLIDE 10: BOOT SELF-TESTS & SHELL INTERACTION
    # ==========================================
    s10 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s10)
    add_header(s10, "Boot Self-Tests & Interactive Terminal Shell", "VERIFICATION & CLI")

    add_card(s10, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Boot-Time Self-Tests (7/7 PASSED)", COLOR_GREEN)
    tb_st = s10.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.3))
    tfst = tb_st.text_frame
    tfst.word_wrap = True
    for name, desc in [
        ("test_memory", "Verifies 1MB heap boundary and allocation integrity."),
        ("test_tasks", "Validates task registration and state descriptors."),
        ("test_scheduler", "Verifies round-robin tick cycle state."),
        ("test_ipc", "Tests FIFO queueing, sender/receiver matching, and dequeue."),
        ("test_synchronization", "Validates spinlock `xchgl` mutual exclusion."),
        ("test_sensor", "Confirms simulated accelerometer non-zero gravity vector."),
        ("test_monitor", "Validates safety scoring baseline and threshold checks.")
    ]:
        p = tfst.add_paragraph()
        p.text = f"✔ {name}: "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_GREEN
        p.space_before = Pt(4)
        p2 = tfst.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    add_card(s10, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Interactive Shell Commands (`OS> `)", COLOR_ACCENT)
    tb_sh = s10.shapes.add_textbox(Inches(7.0), Inches(2.2), Inches(5.3), Inches(4.3))
    tfsh = tb_sh.text_frame
    tfsh.word_wrap = True
    for cmd, desc in [
        ("status", "Displays driver awareness, focus index (98%), and eye state."),
        ("speed", "Outputs vehicle speed (65 km/h), engine RPM, and gear."),
        ("drowsy / alert", "Triggers PERCLOS > 2.0s alarm and acoustic warning status."),
        ("eyes / steer", "Outputs PERCLOS %, blink rate, gaze direction, steering angle."),
        ("brake", "Autonomous Emergency Braking (AEB) diagnostic status."),
        ("tasks / diag", "Lists runnable tasks, CPU mode (x86-32), PIT (100Hz), heap."),
        ("clear / reboot", "Repaints telemetry dashboard or triggers hardware 8042 reset.")
    ]:
        p = tfsh.add_paragraph()
        p.text = f"► {cmd}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = COLOR_ACCENT
        p.space_before = Pt(4)
        p2 = tfsh.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    # ==========================================
    # SLIDE 11: EXPERIMENTAL RESULTS
    # ==========================================
    s11 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s11)
    add_header(s11, "Experimental Results & Telemetric Scenarios", "VALIDATION RESULTS")

    events = [
        ("Event 24 (Cruising)", "Speed: 51.0 km/h | Accel: 0.461g\nHDOP: 1.30 (High Reliability)\nWeights: GPS 40%, OBD 40%, IMU 20%\nResult: NORMAL (Safety: 100/100)", COLOR_GREEN),
        ("Event 29 (Urban Tunnel)", "Speed: 56.0 km/h | Accel: 0.411g\nHDOP: 9.00 (Poor GPS Reliability)\nWeights: GPS 10%, OBD 60%, IMU 30%\nResult: NORMAL (Adaptive Fusion)", COLOR_ACCENT),
        ("Event 36 (Speed Violation)", "Speed: 65.0 km/h (Limit: 60 km/h)\nAccel: 0.368g | Violation Triggered\nRisk Score: 70/100 | Safety: 30/100\nResult: AGGRESSIVE", COLOR_AMBER),
        ("Event 46 (Obstacle on Curve)", "Speed: 55.0 km/h | Accel: 0.852g\nSteering: 35 deg | Obstacle: YES\nRisk Score: 65/100 | Safety: 35/100\nResult: JUSTIFIABLE / DEFENSIVE", COLOR_ACCENT_ALT),
        ("Event 49 (Pothole Avoidance)", "Speed: 48.0 km/h | Accel: 0.621g\nSteering: 40 deg | Pothole: YES\nRisk Score: 25/100 | Safety: 75/100\nResult: POTHOLE AVOIDING", COLOR_GREEN),
        ("Bare-Metal OS Execution", "Telemetry Counters: Real-time 100Hz\nSelf-Tests: 7/7 PASSED\nKeyboard Shell: Zero Latency Response\nReboot / Multi-Key Scrolling: 100% OK", COLOR_GREEN)
    ]
    for idx, (title, desc, color) in enumerate(events):
        col = idx % 3
        row = idx // 3
        x = Inches(0.8 + col * 4.0)
        y = Inches(1.6 + row * 2.7)
        add_card(s11, x, y, Inches(3.7), Inches(2.4), title, color)
        tb = s11.shapes.add_textbox(x + Inches(0.15), y + Inches(0.6), Inches(3.4), Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = desc
        p.font.size = Pt(10.5)
        p.font.color.rgb = COLOR_TEXT_MAIN

    # ==========================================
    # SLIDE 12: CONCLUSION & FUTURE ENHANCEMENTS
    # ==========================================
    s12 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(s12)
    add_header(s12, "Conclusion & Future Engineering Scope", "PROJECT SUMMARY")

    add_card(s12, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2), "Key Accomplishments", COLOR_GREEN)
    tb_c1 = s12.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(5.3), Inches(4.3))
    tfc1 = tb_c1.text_frame
    tfc1.word_wrap = True
    for h, d in [
        ("Full Bare-Metal OS Kernel Built from Scratch", "Bootloader, IDT, PIT 100Hz timer ISRs, round-robin scheduler, spinlocks, bump memory allocator, and VGA text mode."),
        ("Deterministic Low-Latency Performance", "Executes critical sensor polling and safety evaluations in microsecond intervals without OS scheduler jitter."),
        ("Intelligent Multi-Sensor Fusion", "Seamlessly switches between GPS, OBD, and IMU weights during severe signal degradation (high HDOP)."),
        ("Elimination of False Driving Penalties", "Context-aware logic correctly categorizes pothole avoidance and obstacle evasion as defensive rather than aggressive.")
    ]:
        p = tfc1.add_paragraph()
        p.text = f"✔ {h}"
        p.font.bold = True
        p.font.size = Pt(11.5)
        p.font.color.rgb = COLOR_GREEN
        p.space_before = Pt(8)
        p2 = tfc1.add_paragraph()
        p2.text = d
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    add_card(s12, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2), "Future Research & Engineering Scope", COLOR_ACCENT)
    tb_c2 = s12.shapes.add_textbox(Inches(7.0), Inches(2.2), Inches(5.3), Inches(4.3))
    tfc2 = tb_c2.text_frame
    tfc2.word_wrap = True
    for h, d in [
        ("Physical SJA1000 CAN-Bus Controller", "Integrate direct physical CAN controller drivers to read vehicle ECU messages directly from real automotive OBD-II ports."),
        ("Preemptive Priority Context Scheduler", "Upgrade cooperative round-robin scheduler to a full preemptive priority scheduler with TSS hardware context switching."),
        ("On-Chip Neural Network Inference (NPU / TinyML)", "Port lightweight quantized neural networks into kernel space for facial eye-tracking and PERCLOS classification."),
        ("V2X (Vehicle-to-Everything) Communication", "Add 802.11p DSRC networking stack for inter-vehicle collaborative collision avoidance.")
    ]:
        p = tfc2.add_paragraph()
        p.text = f"🚀 {h}"
        p.font.bold = True
        p.font.size = Pt(11.5)
        p.font.color.rgb = COLOR_ACCENT
        p.space_before = Pt(8)
        p2 = tfc2.add_paragraph()
        p2.text = d
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = COLOR_TEXT_MUTED

    # Save
    output_filename = "Driver_Monitoring_OS_Faculty_Presentation.pptx"
    prs.save(output_filename)
    print(f"Presentation saved successfully as '{output_filename}' ({len(prs.slides)} slides)")

if __name__ == '__main__':
    create_presentation()
