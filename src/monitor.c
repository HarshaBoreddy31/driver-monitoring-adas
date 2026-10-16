#include "monitor.h"

static uint32_t processed_samples = 0;
static monitoring_result_t latest_result;

void monitor_init(void)
{
    processed_samples = 0;
    latest_result.sensor_value = 0;
    latest_result.fused_value = 0;
    latest_result.safety_score = 100;
    latest_result.state = DRIVER_NORMAL;
}

static uint32_t fuse_sensor_data(uint32_t sensor_value)
{
    return sensor_value;
}

static uint8_t calculate_safety_score(uint32_t fused_value)
{
    /* Normal operating baseline: 1000 - 1040 */
    if (fused_value < 1045)
    {
        return 98;
    }
    /* Elevated movement/swerving */
    if (fused_value < 1080)
    {
        return 65;
    }
    /* Severe erratic movement */
    return 25;
}

static driver_state_t classify_driver(uint8_t safety_score)
{
    if (safety_score >= 80)
    {
        return DRIVER_NORMAL;
    }
    if (safety_score >= 50)
    {
        return DRIVER_CAUTION;
    }
    return DRIVER_ALERT;
}

void monitor_process(uint32_t sensor_value, monitoring_result_t *result)
{
    processed_samples++;

    uint32_t fused = fuse_sensor_data(sensor_value);
    uint8_t score = calculate_safety_score(fused);

    result->sensor_value = sensor_value;
    result->fused_value = fused;
    result->safety_score = score;
    result->state = classify_driver(score);

    latest_result = *result;
}

uint32_t monitor_sample_count(void)
{
    return processed_samples;
}

const monitoring_result_t *monitor_latest_result(void)
{
    return &latest_result;
}
