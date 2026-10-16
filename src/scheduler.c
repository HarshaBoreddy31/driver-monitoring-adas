#include "scheduler.h"
#include "task.h"

static int current_task = -1;
static unsigned long ticks = 0;

void scheduler_init(void)
{
    current_task = -1;
    ticks = 0;
}

void scheduler_tick(void)
{
    int total = task_count();

    if (total == 0)
    {
        return;
    }

    ticks++;

    current_task++;
    if (current_task >= total)
    {
        current_task = 0;
    }

    task_run(current_task);
}

int scheduler_current_task(void)
{
    return current_task;
}
