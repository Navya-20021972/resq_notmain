def build_location(cctv):
    """
    Build readable location string
    """
    if cctv.latitude and cctv.longitude:
        return {
            "location": cctv.location,
            "latitude": cctv.latitude,
            "longitude": cctv.longitude
        }

    return {
        "location": cctv.location,
        "latitude": None,
        "longitude": None
    }
