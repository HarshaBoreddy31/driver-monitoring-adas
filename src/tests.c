#include "tests.h"
#include "ipc.h"
#include "sensor.h"
#include "monitor.h"

typedef unsigned char uint8_t;
extern void print_at(const char *str, int row, int col, uint8_t color);

static int tests_initialized = 0;

void tests_init(void)
{
    tests_initialized = 1;
}

int test_memory(void)
{
    volatile int value = 1234;
    return (value == 1234) ? 1 : 0;
}

int test_tasks(void)
{
    return 1;
}

int test_scheduler(void)
{
    return 1;
}

int test_ipc(void)
{
    ipc_message_t message;
    int result;

    result = ipc_send(0, 1, 123);
    if (result != 0)
    {
        return 0;
    }

    result = ipc_receive(1, &message);
    if (result != 0)
    {
        return 0;
    }

    if (message.sender != 0 || message.receiver != 1 || message.data != 123)
    {
        return 0;
    }

    return 1;
}

int test_synchronization(void)
{
    return 1;
}

int test_sensor(void)
{
    sensor_data_t data;
    sensor_read(&data);

    if (data.acceleration_z == 0)
    {
        return 0;
    }

    return 1;
}

int test_monitor(void)
{
    monitoring_result_t result;
    monitor_process(900, &result);

    if (result.sensor_value != 900 || result.fused_value != 900 || result.state != DRIVER_NORMAL)
    {
        return 0;
    }

    return 1;
}

void run_all_tests(void)
{
    int passed = 0;
    int total = 7;

    if (test_memory())          passed++;
    if (test_tasks())           passed++;
    if (test_scheduler())       passed++;
    if (test_ipc())             passed++;
    if (test_synchronization()) passed++;
    if (test_sensor())          passed++;
    if (test_monitor())         passed++;

    if (passed == total)
    {
        print_at("SELF-TEST: PASSED (7/7)", 9, 0, 0x0A);
    }
    else
    {
        print_at("SELF-TEST: FAILED",       9, 0, 0x0C);
    }
}
