#include "sensor.h"

static uint32_t sample_count = 0;

void sensor_init(void)
{
    sample_count = 0;
}

void sensor_read(sensor_data_t *data)
{
    sample_count++;

    /* Simulated Accelerometer (Z around 980 for 1g gravity) */
    data->acceleration_x = 10 + (sample_count % 5);
    data->acceleration_y = 20 + (sample_count % 5);
    data->acceleration_z = 980 + (sample_count % 10);

    /* Simulated Gyroscope */
    data->gyro_x = 2 + (sample_count % 3);
    data->gyro_y = 3 + (sample_count % 3);
    data->gyro_z = 1 + (sample_count % 2);

    /* Simulated Pressure Sensor (hPa) */
    data->pressure = 1013 + (sample_count % 4);
}

uint32_t sensor_sample_count(void)
{
    return sample_count;
}
