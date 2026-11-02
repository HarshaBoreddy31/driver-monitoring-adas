#include "sync.h"

void spinlock_init(spinlock_t *lock)
{
    lock->locked = 0;
}

void spinlock_acquire(spinlock_t *lock)
{
    uint32_t value;

    do
    {
        /*
         * Atomic exchange instruction (xchgl).
         * Swaps 1 into locked. If old value was 0, lock acquired.
         */
        __asm__ volatile (
            "xchgl %0, %1"
            : "=r"(value), "+m"(lock->locked)
            : "0"(1)
            : "memory"
        );

    } while (value != 0);
}

void spinlock_release(spinlock_t *lock)
{
    __asm__ volatile (
        "movl $0, %0"
        : "=m"(lock->locked)
        :
        : "memory"
    );
}
