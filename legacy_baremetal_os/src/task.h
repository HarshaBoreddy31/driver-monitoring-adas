#ifndef TASK_H
#define TASK_H

typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;

#define MAX_TASKS 8
#define TASK_STACK_SIZE 4096

typedef enum
{
    TASK_UNUSED = 0,
    TASK_READY,
    TASK_RUNNING,
    TASK_FINISHED
} task_state_t;

typedef struct
{
    int id;
    char name[32];
    task_state_t state;
    uint32_t stack[TASK_STACK_SIZE / sizeof(uint32_t)];
    void (*entry)(void);
} task_t;

void task_init(void);
int task_create(const char *name, void (*entry)(void));
void task_run(int id);
int task_count(void);
task_t *task_get(int id);

#endif
