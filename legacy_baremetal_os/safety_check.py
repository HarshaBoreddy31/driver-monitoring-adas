def check_safety(speed, acceleration, speed_limit=60):
    """
    Check hard safety constraints.
    """

    violations = []

    # Hard speed constraint
    if speed > speed_limit:
        violations.append(
            "SPEED LIMIT VIOLATION"
        )

    # Hard acceleration constraint
    if abs(acceleration) > 0.8:
        violations.append(
            "UNSAFE G-FORCE"
        )

    if len(violations) == 0:
        return True, ["SAFE"]

    return False, violations