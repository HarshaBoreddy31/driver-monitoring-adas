#include "idt.h"
#include "memory.h"
#include "sync.h"
#include "task.h"
#include "scheduler.h"
#include "timer.h"
#include "ipc.h"
#include "sensor.h"
#include "monitor.h"
#include "system_status.h"
#include "tests.h"

#define VIDEO_MEMORY  0xB8000
#define SCREEN_WIDTH  80
#define SCREEN_HEIGHT 25

extern void sensor_task(void);
extern void safety_task(void);
extern void display_task(void);

void clear_screen(void)
{
    volatile uint16_t *video = (volatile uint16_t *)VIDEO_MEMORY;
    for (int i = 0; i < SCREEN_WIDTH * SCREEN_HEIGHT; i++)
    {
        video[i] = (uint16_t)' ' | ((uint16_t)0x07 << 8);
    }
}

void print_at(const char *str, int row, int col, uint8_t color)
{
    volatile uint16_t *video = (volatile uint16_t *)VIDEO_MEMORY;
    int offset = row * SCREEN_WIDTH + col;

    for (int i = 0; str[i] != '\0'; i++)
    {
        video[offset + i] = (uint16_t)str[i] | ((uint16_t)color << 8);
    }
}

void print_number(uint32_t number, int row, int column, uint8_t color)
{
    char buffer[12];
    int i = 0;

    if (number == 0)
    {
        print_at("0    ", row, column, color);
        return;
    }

    while (number > 0)
    {
        buffer[i++] = '0' + (number % 10);
        number /= 10;
    }

    for (int j = 0; j < i / 2; j++)
    {
        char temp = buffer[j];
        buffer[j] = buffer[i - j - 1];
        buffer[i - j - 1] = temp;
    }

    buffer[i++] = ' ';
    buffer[i++] = ' ';
    buffer[i] = '\0';
    print_at(buffer, row, column, color);
}

void kernel_main(void)
{
    clear_screen();

    /* Header */
    print_at("================================================================================", 0, 0, 0x0B);
    print_at("                    DRIVER MONITORING OPERATING SYSTEM                         ", 1, 0, 0x0F);
    print_at("================================================================================", 2, 0, 0x0B);

    /* Subsystems Initialization */
    memory_init();
    void *test_memory = kmalloc(128);
    (void)test_memory;

    ipc_init();
    sensor_init();
    monitor_init();
    task_init();
    scheduler_init();

    task_create("SENSOR", sensor_task);
    task_create("SAFETY", safety_task);
    task_create("DISPLAY", display_task);

    idt_init();
    timer_init();

    /* Dashboard & Self-Tests */
    system_status_init();
    tests_init();
    system_status_display();
    run_all_tests();

    /* Shell starts at row 12 */
    print_at("OS> ", 12, 0, 0x0F);

    __asm__ volatile ("sti");

    while (1)
    {
        __asm__ volatile ("hlt");
    }
}
