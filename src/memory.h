#ifndef MEMORY_H
#define MEMORY_H

typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;

void memory_init(void);
void *kmalloc(uint32_t size);
void kfree(void *ptr);
uint32_t memory_free(void);
uint32_t memory_used(void);

#endif
