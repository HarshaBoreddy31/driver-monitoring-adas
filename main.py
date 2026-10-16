import pandas as pd

from preprocessing import preprocess_data
from sensor_fusion import fuse_speed
from baseline import DriverBaseline
from safety_check import check_safety
from context import evaluate_context
from classifier import classify_event


# ==========================================
# 1. LOAD SENSOR DATA
# ==========================================

print("\n==========================================")
print(" CONTEXT-AWARE DRIVER MONITORING SYSTEM")
print("==========================================\n")

print("Loading sensor data...")

df = pd.read_csv("data/sensor_data.csv")

print(f"Total sensor readings: {len(df)}")


# ==========================================
# 2. PREPROCESSING
# ==========================================

print("\n------------------------------------------")
print("1. SENSOR DATA PREPROCESSING")
print("------------------------------------------")

df = preprocess_data(df)

print("Low-Pass Butterworth filtering applied.")

print(
    f"Raw acceleration      : "
    f"{df['acceleration'].iloc[0]:.3f}"
)

print(
    f"Filtered acceleration : "
    f"{df['filtered_acceleration'].iloc[0]:.3f}"
)


# ==========================================
# 3. DRIVER BASELINE
# ==========================================

print("\n------------------------------------------")
print("2. DRIVER BASELINE CALIBRATION")
print("------------------------------------------")

calibration_data = df.iloc[:20]

driver = DriverBaseline()

driver.calibrate(calibration_data)

print("Calibration samples : 20")

print(
    f"Average acceleration : "
    f"{driver.average_acceleration:.3f}"
)

print(
    f"Average gyroscope    : "
    f"{driver.average_gyro:.3f}"
)

print(
    f"Average speed        : "
    f"{driver.average_speed:.2f} km/h"
)

print("\nPersonalized driver baseline created.")


# ==========================================
# 4. PROCESS EVENTS
# ==========================================

print("\n==========================================")
print(" STARTING REAL-TIME EVENT PROCESSING")
print("==========================================")

# Selected events for demonstration
event_numbers = [23, 28, 31, 35, 45, 46, 48]

for index in event_numbers:

    row = df.iloc[index]

    gps_speed = row["gps_speed"]
    obd_speed = row["obd_speed"]

    # Simple IMU-derived speed approximation
    imu_speed = row["obd_speed"] + (
        row["filtered_acceleration"] * 2
    )

    # ======================================
    # ADAPTIVE SENSOR FUSION
    # ======================================

    (
        fused_speed,
        gps_weight,
        obd_weight,
        imu_weight,
        gps_reliability
    ) = fuse_speed(
        gps_speed,
        obd_speed,
        imu_speed,
        row["gps_hdop"]
    )

    # ======================================
    # CONTEXT
    # ======================================

    context = evaluate_context(row)

    # ======================================
    # SAFETY CHECK
    # ======================================

    safety_ok, violations = check_safety(
        fused_speed,
        row["filtered_acceleration"]
    )

    # ======================================
    # DRIVER BASELINE DEVIATION
    # ======================================

    deviation = driver.get_deviation(
        row["filtered_acceleration"]
    )

    # ======================================
    # CLASSIFICATION
    # ======================================

    classification = classify_event(
        row["filtered_acceleration"],
        row["steering"],
        context,
        safety_ok
    )

    # ======================================
    # RISK SCORE
    # ======================================

    risk_score = 0

    if not safety_ok:
        risk_score += 40

    if deviation > 0.30:
        risk_score += 20

    if classification == "AGGRESSIVE":
        risk_score += 30

    elif classification == "DEFENSIVE":
        risk_score += 10

    elif classification == "POTHOLE AVOIDING":
        risk_score += 5

    elif classification == "JUSTIFIABLE / DEFENSIVE":
        risk_score += 5

    risk_score = min(risk_score, 100)

    safety_score = 100 - risk_score

    # ======================================
    # DISPLAY
    # ======================================

    print("\n")
    print("==========================================")
    print(f" EVENT {int(row['time'])}")
    print("==========================================")

    print(
        f"GPS Speed          : "
        f"{gps_speed:.2f} km/h"
    )

    print(
        f"OBD Speed          : "
        f"{obd_speed:.2f} km/h"
    )

    print(
        f"Fused Speed        : "
        f"{fused_speed:.2f} km/h"
    )

    print(
        f"Acceleration       : "
        f"{row['filtered_acceleration']:.3f} g"
    )

    print(
        f"GPS HDOP           : "
        f"{row['gps_hdop']:.2f}"
    )

    print(
        f"GPS Reliability    : "
        f"{gps_reliability}"
    )

    print("\nSensor Weights:")

    print(
        f"GPS                : "
        f"{gps_weight:.2f}"
    )

    print(
        f"OBD                : "
        f"{obd_weight:.2f}"
    )

    print(
        f"IMU                : "
        f"{imu_weight:.2f}"
    )

    print("\nContext:")

    print(
        f"Road               : "
        f"{context['road_type']}"
    )

    print(
        f"Weather            : "
        f"{context['weather']}"
    )

    print(
        f"Traffic            : "
        f"{context['traffic']}"
    )

    print(
        f"Obstacle           : "
        f"{'YES' if context['obstacle'] else 'NO'}"
    )

    print(
        f"Pothole            : "
        f"{'YES' if context['pothole'] else 'NO'}"
    )

    print("\nSafety:")

    if safety_ok:
        print("Status             : SAFE")
    else:
        print("Status             : VIOLATION")

        for violation in violations:
            print(f"WARNING            : {violation}")

    print("\nDriver Baseline:")

    print(
        f"Acceleration Deviation : "
        f"{deviation:.3f} g"
    )

    print("\nFinal Classification:")
    print(f"Behaviour          : {classification}")

    print(
        f"Risk Score         : "
        f"{risk_score}/100"
    )

    print(
        f"Safety Score       : "
        f"{safety_score}/100"
    )


print("\n==========================================")
print(" PROCESSING COMPLETED")
print("==========================================\n")	