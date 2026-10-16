/* ==========================================
   Driver Monitoring OS
   Keyboard Driver with Multi-Key Scroll Navigation
   Supported Scroll Controls:
     - Up Arrow / Page Up       : Scroll Up
     - Down Arrow / Page Down   : Scroll Down
   ========================================== */

#include "system_status.h"
#include "tests.h"

typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;

#define KEYBOARD_DATA_PORT 0x60
#define PIC1_COMMAND       0x20
#define PIC_EOI            0x20

#define VIDEO_MEMORY       0xB8000
#define SCREEN_WIDTH       80
#define SCREEN_HEIGHT      25

#define TERM_START_ROW     12
#define TERM_END_ROW       24
#define TERM_NUM_ROWS      (TERM_END_ROW - TERM_START_ROW + 1) /* 13 lines */

#define HISTORY_MAX_LINES  100

static inline uint8_t inb(uint16_t port)
{
    uint8_t result;
    __asm__ volatile ("inb %1, %0" : "=a"(result) : "Nd"(port));
    return result;
}

static inline void outb(uint16_t port, uint8_t value)
{
    __asm__ volatile ("outb %0, %1" : : "a"(value), "Nd"(port));
}

static volatile uint16_t *video = (volatile uint16_t *)VIDEO_MEMORY;

/* History buffer matrix */
static uint16_t history_buffer[HISTORY_MAX_LINES][SCREEN_WIDTH];
static int total_lines = 1;
static int current_col = 0;
static int view_offset = 0;

static char cmd_buf[64];
static int cmd_len = 0;
static int is_extended = 0;

static const char kbd_map[128] = {
    0,  27, '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '\b',
    '\t', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\n',
    0, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', '`',
    0, '\\', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 0,
    '*', 0, ' '
};

static int strcmp(const char *s1, const char *s2)
{
    while (*s1 && (*s1 == *s2))
    {
        s1++;
        s2++;
    }
    return *(const unsigned char *)s1 - *(const unsigned char *)s2;
}

static void render_terminal_viewport(void)
{
    int start_line = (total_lines - TERM_NUM_ROWS) - view_offset;
    if (start_line < 0)
    {
        start_line = 0;
    }

    for (int r = 0; r < TERM_NUM_ROWS; r++)
    {
        int line_idx = start_line + r;
        int screen_row = TERM_START_ROW + r;

        for (int c = 0; c < SCREEN_WIDTH; c++)
        {
            if (line_idx < total_lines)
            {
                video[screen_row * SCREEN_WIDTH + c] = history_buffer[line_idx][c];
            }
            else
            {
                video[screen_row * SCREEN_WIDTH + c] = (uint16_t)' ' | ((uint16_t)0x07 << 8);
            }
        }
    }
}

static void new_line(void)
{
    if (total_lines < HISTORY_MAX_LINES)
    {
        total_lines++;
    }
    else
    {
        for (int i = 0; i < HISTORY_MAX_LINES - 1; i++)
        {
            for (int c = 0; c < SCREEN_WIDTH; c++)
            {
                history_buffer[i][c] = history_buffer[i + 1][c];
            }
        }
    }

    for (int c = 0; c < SCREEN_WIDTH; c++)
    {
        history_buffer[total_lines - 1][c] = (uint16_t)' ' | ((uint16_t)0x07 << 8);
    }
    current_col = 0;
    view_offset = 0;
}

static void print_string(const char *str, uint8_t color)
{
    for (int i = 0; str[i] != '\0'; i++)
    {
        if (str[i] == '\n')
        {
            new_line();
        }
        else
        {
            if (current_col >= SCREEN_WIDTH)
            {
                new_line();
            }
            history_buffer[total_lines - 1][current_col++] = (uint16_t)str[i] | ((uint16_t)color << 8);
        }
    }
    render_terminal_viewport();
}

static void redraw_dashboard(void)
{
    for (int i = 0; i < SCREEN_WIDTH * SCREEN_HEIGHT; i++)
    {
        video[i] = (uint16_t)' ' | ((uint16_t)0x07 << 8);
    }

    int cursor = 0;
    const char *header1 = "================================================================================";
    const char *header2 = "                    DRIVER MONITORING OPERATING SYSTEM                         ";
    for (int i = 0; header1[i]; i++) video[cursor++] = (uint16_t)header1[i] | (0x0B << 8);
    cursor = SCREEN_WIDTH;
    for (int i = 0; header2[i]; i++) video[cursor++] = (uint16_t)header2[i] | (0x0F << 8);
    cursor = SCREEN_WIDTH * 2;
    for (int i = 0; header1[i]; i++) video[cursor++] = (uint16_t)header1[i] | (0x0B << 8);

    system_status_display();
    run_all_tests();

    total_lines = 1;
    current_col = 0;
    view_offset = 0;
    for (int r = 0; r < HISTORY_MAX_LINES; r++)
    {
        for (int c = 0; c < SCREEN_WIDTH; c++)
        {
            history_buffer[r][c] = (uint16_t)' ' | ((uint16_t)0x07 << 8);
        }
    }

    print_string("OS> ", 0x0F);
}

static void scroll_up(int amount)
{
    int max_offset = total_lines - TERM_NUM_ROWS;
    if (max_offset > 0)
    {
        view_offset += amount;
        if (view_offset > max_offset)
        {
            view_offset = max_offset;
        }
        render_terminal_viewport();
    }
}

static void scroll_down(int amount)
{
    if (view_offset > 0)
    {
        view_offset -= amount;
        if (view_offset < 0)
        {
            view_offset = 0;
        }
        render_terminal_viewport();
    }
}

static void execute_command(void)
{
    new_line();

    if (strcmp(cmd_buf, "help") == 0)
    {
        print_string("Commands: status, alert, clear, speed, drowsy, diag, steer, eyes, brake, tasks, reboot\n", 0x0E);
        print_string("Scroll Controls: Up Arrow / Page Up (Scroll Up) | Down Arrow / Page Down (Scroll Down)\n", 0x0B);
    }
    else if (strcmp(cmd_buf, "status") == 0)
    {
        print_string("Driver Status: ALERT | Focus: 98% | Eyes: OPEN\n", 0x0A);
    }
    else if (strcmp(cmd_buf, "alert") == 0)
    {
        print_string("WARNING: Drowsiness detected! Alarm triggered.\n", 0x0C);
    }
    else if (strcmp(cmd_buf, "speed") == 0)
    {
        print_string("Vehicle Speed: 65 km/h | Engine RPM: 2100 | Gear: D4\n", 0x0E);
    }
    else if (strcmp(cmd_buf, "drowsy") == 0)
    {
        print_string("CRITICAL: Eye closure duration > 2.0s! Audio warning active.\n", 0x0C);
    }
    else if (strcmp(cmd_buf, "diag") == 0)
    {
        print_string("DIAG: CPU x86-32 | PIT: 100Hz | IRQ0: OK | IRQ1: OK | Heap: 1MB\n", 0x0B);
    }
    else if (strcmp(cmd_buf, "steer") == 0)
    {
        print_string("Steering: 0.4 deg LEFT | Hands On Wheel: DETECTED | Lane: CENTER\n", 0x0A);
    }
    else if (strcmp(cmd_buf, "eyes") == 0)
    {
        print_string("Vision: PERCLOS 12% (NORMAL) | Blink Rate: 16/min | Gaze: ROAD\n", 0x0A);
    }
    else if (strcmp(cmd_buf, "brake") == 0)
    {
        print_string("EMERGENCY: Forward obstacle close! Autonomous Braking ARMED.\n", 0x0C);
    }
    else if (strcmp(cmd_buf, "tasks") == 0)
    {
        print_string("Tasks: [0] SENSOR (RUNNABLE) | [1] SAFETY (RUNNABLE) | [2] DISPLAY (RUNNABLE)\n", 0x0B);
    }
    else if (strcmp(cmd_buf, "reboot") == 0)
    {
        print_string("Rebooting system...\n", 0x0C);
        outb(0x64, 0xFE);
    }
    else if (strcmp(cmd_buf, "clear") == 0)
    {
        redraw_dashboard();
        cmd_len = 0;
        cmd_buf[0] = '\0';
        return;
    }
    else if (cmd_len > 0)
    {
        print_string("Unknown command. Type 'help'.\n", 0x0C);
    }

    print_string("OS> ", 0x0F);
    cmd_len = 0;
    cmd_buf[0] = '\0';
}

void keyboard_handler(void)
{
    uint8_t scancode = inb(KEYBOARD_DATA_PORT);

    if (scancode == 0xE0)
    {
        is_extended = 1;
        outb(PIC1_COMMAND, PIC_EOI);
        return;
    }

    if (!(scancode & 0x80))
    {
        if (is_extended)
        {
            if (scancode == 0x48) /* Up Arrow */
            {
                scroll_up(1);
            }
            else if (scancode == 0x50) /* Down Arrow */
            {
                scroll_down(1);
            }
            else if (scancode == 0x49) /* Page Up */
            {
                scroll_up(4);
            }
            else if (scancode == 0x51) /* Page Down */
            {
                scroll_down(4);
            }
        }
        else if (scancode < 128)
        {
            char c = kbd_map[scancode];

            if (c == '\b')
            {
                if (cmd_len > 0 && current_col > 4)
                {
                    cmd_len--;
                    cmd_buf[cmd_len] = '\0';
                    current_col--;
                    history_buffer[total_lines - 1][current_col] = (uint16_t)' ' | ((uint16_t)0x07 << 8);
                    view_offset = 0;
                    render_terminal_viewport();
                }
            }
            else if (c == '\n')
            {
                cmd_buf[cmd_len] = '\0';
                view_offset = 0;
                execute_command();
            }
            else if (c != 0 && cmd_len < 63 && current_col < SCREEN_WIDTH)
            {
                cmd_buf[cmd_len++] = c;
                cmd_buf[cmd_len] = '\0';
                history_buffer[total_lines - 1][current_col++] = (uint16_t)c | ((uint16_t)0x0A << 8);
                view_offset = 0;
                render_terminal_viewport();
            }
        }
    }

    is_extended = 0;
    outb(PIC1_COMMAND, PIC_EOI);
}
