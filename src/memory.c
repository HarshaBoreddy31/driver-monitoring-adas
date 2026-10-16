#include "memory.h"

#define HEAP_START 0x01000000
#define HEAP_SIZE  0x00100000

static uint32_t heap_current = HEAP_START;
static uint32_t heap_end     = HEAP_START + HEAP_SIZE;
static uint32_t used_memory  = 0;

static uint32_t align4(uint32_t size)
{
    return (size + 3) & ~3;
}

void memory_init(void)
{
    heap_current = HEAP_START;
    used_memory  = 0;
}

void *kmalloc(uint32_t size)
{
    if (size == 0)
    {
        return (void *)0;
    }

    uint32_t aligned_size = align4(size);

    if (heap_current + aligned_size > heap_end)
    {
        return (void *)0;
    }

    uint32_t address = heap_current;
    heap_current += aligned_size;
    used_memory  += aligned_size;

    return (void *)address;
}

void kfree(void *ptr)
{
    (void)ptr;
}

uint32_t memory_used(void)
{
    return used_memory;
}

uint32_t memory_free(void)
{
    return HEAP_SIZE - used_memory;
}
