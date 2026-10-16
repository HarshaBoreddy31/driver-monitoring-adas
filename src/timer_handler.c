#include "scheduler.h"

typedef unsigned char uint8_t;
typedef unsigned short uint16_t;

static inline void outb(uint16_t port, uint8_t value)
{
    __asm__ volatile ("outb %0, %1" : : "a"(value), "Nd"(port));
}

void timer_handler(void)
{
    scheduler_tick();
    outb(0x20, 0x20);
}
