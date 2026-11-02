def calculate_weights(gps_hdop):
    """
    Dynamically change sensor weights based on GPS reliability.
    """

    if gps_hdop <= 2.0:
        # Good GPS
        gps_weight = 0.40
        obd_weight = 0.40
        imu_weight = 0.20
        reliability = "HIGH"

    elif gps_hdop <= 5.0:
        # Medium GPS
        gps_weight = 0.25
        obd_weight = 0.45
        imu_weight = 0.30
        reliability = "MEDIUM"

    else:
        # Poor GPS
        gps_weight = 0.10
        obd_weight = 0.60
        imu_weight = 0.30
        reliability = "LOW"

    return gps_weight, obd_weight, imu_weight, reliability


def fuse_speed(gps_speed, obd_speed, imu_speed, gps_hdop):

    gps_w, obd_w, imu_w, reliability = calculate_weights(gps_hdop)

    fused_speed = (
        gps_speed * gps_w
        + obd_speed * obd_w
        + imu_speed * imu_w
    )

    return fused_speed, gps_w, obd_w, imu_w, reliability