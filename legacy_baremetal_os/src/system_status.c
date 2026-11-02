#include "system_status.h"

typedef unsigned char uint8_t;
extern void print_at(const char *str, int row, int col, uint8_t color);

static int system_ready = 0;

void system_status_init(void)
{
    system_ready = 1;
}

void system_status_display(void)
{
    if (!system_ready)
    {
        return;
    }

    /* Compact 2-Column Status Dashboard */
    print_at("Kernel      : OK",               3,  0, 0x0A);
    print_at("Memory Mgr  : OK",               4,  0, 0x0A);
    print_at("Scheduler   : RUNNING",          5,  0, 0x0A);
    print_at("IPC & Sync  : PROTECTED",        6,  0, 0x0A);

    print_at("Sensors     : ACTIVE",           3, 40, 0x0B);
    print_at("Driver State: ",                 4, 40, 0x0F);
    print_at("IRQ0 / IRQ1 : ENABLED",          5, 40, 0x0A);
    print_at("System State: READY",            6, 40, 0x0E);

    /* Telemetry Counters */
    print_at("Runs -> Sens: ",                 8,  0, 0x07);
    print_at("Safe: ",                         8, 22, 0x07);
    print_at("Disp: ",                         8, 36, 0x07);
    print_at("Accel: ",                        8, 50, 0x07);
    print_at("Score: ",                        8, 66, 0x07);

    print_at("--------------------------------------------------------------------------------", 10, 0, 0x08);
}
