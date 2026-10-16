class DriverBaseline:

    def __init__(self):
        self.average_acceleration = 0
        self.average_gyro = 0
        self.average_speed = 0

    def calibrate(self, df):
        """
        Create personalized driver baseline
        using the initial observation window.
        """

        self.average_acceleration = (
            df["filtered_acceleration"].mean()
        )

        self.average_gyro = (
            df["filtered_gyro"].mean()
        )

        self.average_speed = (
            df["obd_speed"].mean()
        )

    def get_deviation(self, acceleration):
        return abs(
            acceleration - self.average_acceleration
        )