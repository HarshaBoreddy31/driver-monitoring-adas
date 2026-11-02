#ifndef MONITOR_H
#define MONITOR_H

typedef unsigned char  uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int   uint32_t;

typedef enum
{
    DRIVER_NORMAL = 0,
    DRIVER_CAUTION,
    DRIVER_ALERT
} driver_state_t;

typedef struct
{
    uint32_t sensor_value;
    uint32_t fused_value;
    uint8_t  safety_score;
    driver_state_t state;
} monitoring_result_t;

void monitor_init(void);
void monitor_process(uint32_t sensor_value, monitoring_result_t *result);
uint32_t monitor_sample_count(void);
const monitoring_result_t *monitor_latest_result(void);

#endif
