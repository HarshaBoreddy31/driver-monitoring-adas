def classify_event(
    acceleration,
    steering,
    context,
    safety_ok
):

    # Pothole detected
    if context["pothole"]:
        return "POTHOLE AVOIDING"

    # Sudden movement with an obstacle
    if context["obstacle"]:
        return "JUSTIFIABLE / DEFENSIVE"

    # Unsafe movement
    if not safety_ok:
        return "AGGRESSIVE"

    # High acceleration
    if acceleration > 0.75:
        return "AGGRESSIVE"

    # Large steering movement
    if abs(steering) > 25:

        if context["road_type"] == "curve":
            return "DEFENSIVE"

        return "AGGRESSIVE"

    return "NORMAL"