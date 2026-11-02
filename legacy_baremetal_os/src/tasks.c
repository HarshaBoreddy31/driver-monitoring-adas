#include "ipc.h"
#include "sensor.h"
#include "monitor.h"

#define SENSOR_TASK_ID  0
#define SAFETY_TASK_ID  1
#define DISPLAY_TASK_ID 2

extern void print_at(const char *str, int row, int col, uint8_t color);
extern void print_number(uint32_t number, int row, int column, uint8_t color);

static int sensor_counter = 0;
static int safety_counter = 0;
static int display_counter = 0;

void sensor_task(void)
{
    sensor_counter++;

    sensor_data_t data;
    sensor_read(&data);

    uint32_t acceleration = (uint32_t)(data.acceleration_x + data.acceleration_y + data.acceleration_z);
    ipc_send(SENSOR_TASK_ID, SAFETY_TASK_ID, acceleration);
}

void safety_task(void)
{
    ipc_message_t msg;
    monitoring_result_t result;

    if (ipc_receive(SAFETY_TASK_ID, &msg) == 0)
    {
        safety_counter++;
        monitor_process(msg.data, &result);
    }
}

void display_task(void)
{
    display_counter++;
    const monitoring_result_t *result = monitor_latest_result();

    /* Compact telemetry outputs on row 8 */
    print_number(sensor_counter,        8, 14, 0x0F);
    print_number(safety_counter,        8, 28, 0x0F);
    print_number(display_counter,       8, 42, 0x0F);
    print_number(result->sensor_value,  8, 57, 0x0A);
    print_number(result->safety_score,  8, 73, 0x0A);

    /* Driver state on row 4 */
    if (result->state == DRIVER_NORMAL)
    {
        print_at("NORMAL ", 4, 54, 0x0A);
    }
    else if (result->state == DRIVER_CAUTION)
    {
        print_at("CAUTION", 4, 54, 0x0E);
    }
    else
    {
        print_at("ALERT! ", 4, 54, 0x0C);
    }
}

int get_sensor_count(void)
{
    return sensor_counter;
}

int get_safety_count(void)
{
    return safety_counter;
}

int get_display_count(void)
{
    return display_counter;
}
