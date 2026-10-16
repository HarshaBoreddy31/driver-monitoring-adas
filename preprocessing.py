import numpy as np
from scipy.signal import butter, filtfilt


def low_pass_filter(data, cutoff=0.15, order=2):
    """
    Low-pass Butterworth filter used to reduce
    high-frequency noise from sensor data.
    """

    data = np.asarray(data, dtype=float)

    if len(data) < 10:
        return data

    b, a = butter(order, cutoff, btype="low")

    return filtfilt(b, a, data)


def preprocess_data(df):
    """
    Apply filtering to acceleration and gyroscope data.
    """

    df = df.copy()

    df["filtered_acceleration"] = low_pass_filter(
        df["acceleration"]
    )

    df["filtered_gyro"] = low_pass_filter(
        df["gyro"]
    )

    return df