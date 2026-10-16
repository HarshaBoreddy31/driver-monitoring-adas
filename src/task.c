#include "task.h"

static task_t tasks[MAX_TASKS];
static int total_tasks = 0;

static void string_copy(char *destination, const char *source)
{
    int i = 0;
    while (source[i] != '\0' && i < 31)
    {
        destination[i] = source[i];
        i++;
    }
    destination[i] = '\0';
}

void task_init(void)
{
    for (int i = 0; i < MAX_TASKS; i++)
    {
        tasks[i].id = -1;
        tasks[i].state = TASK_UNUSED;
        tasks[i].entry = (void *)0;
    }
    total_tasks = 0;
}

int task_create(const char *name, void (*entry)(void))
{
    if (total_tasks >= MAX_TASKS)
    {
        return -1;
    }

    int id = total_tasks;
    tasks[id].id = id;
    string_copy(tasks[id].name, name);
    tasks[id].state = TASK_READY;
    tasks[id].entry = entry;

    total_tasks++;
    return id;
}

void task_run(int id)
{
    if (id < 0 || id >= total_tasks)
    {
        return;
    }

    if (tasks[id].entry == (void *)0)
    {
        return;
    }

    tasks[id].state = TASK_RUNNING;
    tasks[id].entry();
    tasks[id].state = TASK_READY;
}

int task_count(void)
{
    return total_tasks;
}

task_t *task_get(int id)
{
    if (id < 0 || id >= total_tasks)
    {
        return (task_t *)0;
    }
    return &tasks[id];
}
