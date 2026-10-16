#include "ipc.h"
#include "sync.h"

static ipc_message_t queue[IPC_QUEUE_SIZE];
static int queue_head = 0;
static int queue_tail = 0;
static int queue_count = 0;
static spinlock_t ipc_lock;

void ipc_init(void)
{
    queue_head = 0;
    queue_tail = 0;
    queue_count = 0;
    spinlock_init(&ipc_lock);
}

int ipc_send(int sender, int receiver, uint32_t data)
{
    spinlock_acquire(&ipc_lock);

    if (queue_count >= IPC_QUEUE_SIZE)
    {
        spinlock_release(&ipc_lock);
        return -1;
    }

    queue[queue_tail].sender = sender;
    queue[queue_tail].receiver = receiver;
    queue[queue_tail].data = data;

    queue_tail++;
    if (queue_tail >= IPC_QUEUE_SIZE)
    {
        queue_tail = 0;
    }

    queue_count++;

    spinlock_release(&ipc_lock);
    return 0;
}

int ipc_receive(int receiver, ipc_message_t *message)
{
    spinlock_acquire(&ipc_lock);

    int checked = 0;
    int index = queue_head;

    if (queue_count == 0)
    {
        spinlock_release(&ipc_lock);
        return -1;
    }

    while (checked < queue_count)
    {
        if (queue[index].receiver == receiver)
        {
            message->sender = queue[index].sender;
            message->receiver = queue[index].receiver;
            message->data = queue[index].data;

            int current = index;
            while (current != queue_tail)
            {
                int next = current + 1;
                if (next >= IPC_QUEUE_SIZE)
                {
                    next = 0;
                }

                if (next == queue_tail)
                {
                    break;
                }

                queue[current] = queue[next];
                current = next;
            }

            queue_tail--;
            if (queue_tail < 0)
            {
                queue_tail = IPC_QUEUE_SIZE - 1;
            }

            queue_count--;

            spinlock_release(&ipc_lock);
            return 0;
        }

        index++;
        if (index >= IPC_QUEUE_SIZE)
        {
            index = 0;
        }
        checked++;
    }

    spinlock_release(&ipc_lock);
    return -1;
}

int ipc_message_count(void)
{
    int count;
    spinlock_acquire(&ipc_lock);
    count = queue_count;
    spinlock_release(&ipc_lock);
    return count;
}
