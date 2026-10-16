#ifndef SENSOR_H
#define SENSOR_H

typedef signed short   int16_t;
typedef unsigned short uint16_t;
typedef unsigned int   uint32_t;

typedef struct
{
    int16_t acceleration_x;
    int16_t acceleration_y;
    int16_t acceleration_z;

    int16_t gyro_x;
    int16_t gyro_y;
    int16_t gyro_z;

    uint16_t pressure;
} sensor_data_t;

void sensor_init(void);
void sensor_read(sensor_data_t *data);
uint32_t sensor_sample_count(void);

#endif
