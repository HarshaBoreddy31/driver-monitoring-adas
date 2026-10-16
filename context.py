def evaluate_context(row):
    """
    Evaluate environmental and driving context.
    """

    context = {
        "road_type": row["road_type"],
        "weather": row["weather"],
        "traffic": row["traffic"],
        "obstacle": bool(row["obstacle"]),
        "pothole": bool(row["pothole"])
    }

    return context