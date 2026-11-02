#include "idt.h"

struct idt_entry idt[256];
struct idt_ptr idtp;

extern void idt_load(void);
extern void keyboard_interrupt(void);
extern void timer_interrupt(void);
extern void default_interrupt(void);

static inline void outb(uint16_t port, uint8_t value)
{
    __asm__ volatile ("outb %0, %1" : : "a"(value), "Nd"(port));
}

static inline uint8_t inb(uint16_t port)
{
    uint8_t result;
    __asm__ volatile ("inb %1, %0" : "=a"(result) : "Nd"(port));
    return result;
}

static void io_wait(void)
{
    __asm__ volatile ("outb %%al, $0x80" : : "a"(0));
}

static void pic_remap(void)
{
    outb(0x20, 0x11); io_wait();
    outb(0xA0, 0x11); io_wait();

    outb(0x21, 0x20); io_wait();
    outb(0xA1, 0x28); io_wait();

    outb(0x21, 0x04); io_wait();
    outb(0xA1, 0x02); io_wait();

    outb(0x21, 0x01); io_wait();
    outb(0xA1, 0x01); io_wait();

    /* Unmask IRQ0 (Timer, bit 0) and IRQ1 (Keyboard, bit 1) */
    outb(0x21, 0xFC);
    outb(0xA1, 0xFF);
}

void idt_set_gate(uint8_t num, uint32_t base, uint16_t sel, uint8_t flags)
{
    idt[num].base_low  = (uint16_t)(base & 0xFFFF);
    idt[num].base_high = (uint16_t)((base >> 16) & 0xFFFF);
    idt[num].sel       = sel;
    idt[num].always0   = 0;
    idt[num].flags     = flags;
}

void idt_init(void)
{
    idtp.limit = (uint16_t)(sizeof(struct idt_entry) * 256) - 1;
    idtp.base  = (uint32_t)&idt;

    /* 0x08 is the Kernel Code Segment selector set up by Multiboot/GRUB */
    for (int i = 0; i < 256; i++)
    {
        idt_set_gate(i, (uint32_t)default_interrupt, 0x08, 0x8E);
    }

    idt_set_gate(32, (uint32_t)timer_interrupt, 0x08, 0x8E);
    idt_set_gate(33, (uint32_t)keyboard_interrupt, 0x08, 0x8E);

    pic_remap();
    idt_load();
}
