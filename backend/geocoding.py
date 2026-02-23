import os
import logging
import math
import requests

logger = logging.getLogger(__name__)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
REVERSE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
NEARBY_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

def get_place_name(lat: float, lng: float) -> str:
    if not GOOGLE_MAPS_API_KEY:
        logger.warning("GOOGLE_MAPS_API_KEY が設定されてないよ！")
        return ""

    area = _reverse_geocode(lat, lng)        # 市区町村は必ず取る
    facility = _get_nearby_facility(lat, lng) # 取れたら施設名も

    if facility:
        return f"{facility}\n{area}"
    return area


def _get_nearby_facility(lat: float, lng: float) -> str:
    try:
        res = requests.get(
            NEARBY_SEARCH_URL,
            params={
                "location": f"{lat},{lng}",
                "rankby": "distance",
                "key": GOOGLE_MAPS_API_KEY,
                "language": "ja",
            },
            timeout=5,
        )
        res.raise_for_status()
        data = res.json()

        if data.get("status") not in ("OK", "ZERO_RESULTS"):
            logger.warning(f"Nearby Search APIエラー: {data.get('status')}")
            return ""

        results = data.get("results", [])
        if not results:
            return ""

        def dist(lat1, lng1, lat2, lng2):
            R = 6371000
            phi1, phi2 = math.radians(lat1), math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dl = math.radians(lng2 - lng1)
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
            return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

        facility_lat = results[0]["geometry"]["location"]["lat"]
        facility_lng = results[0]["geometry"]["location"]["lng"]
        if dist(lat, lng, facility_lat, facility_lng) > 30:
            return ""

        return results[0].get("name", "")

    except requests.Timeout:
        logger.warning("Nearby Search APIタイムアウト")
        return ""
    except requests.RequestException as e:
        logger.warning(f"Nearby Search APIエラー: {e}")
        return ""


def _reverse_geocode(lat: float, lng: float) -> str:
    """市区町村を取得"""
    try:
        res = requests.get(
            REVERSE_GEOCODING_URL,
            params={
                "latlng": f"{lat},{lng}",
                "key": GOOGLE_MAPS_API_KEY,
                "language": "ja",
            },
            timeout=5,
        )
        res.raise_for_status()
        data = res.json()

        if data.get("status") != "OK":
            logger.warning(f"Geocoding APIエラー: {data.get('status')}")
            return ""

        results = data.get("results", [])
        if not results:
            return ""

        components = results[0].get("address_components", [])
        locality = ""
        sublocality = ""
        for c in components:
            types = c.get("types", [])
            if "locality" in types:
                locality = c["long_name"]
            if "sublocality_level_1" in types:
                sublocality = c["long_name"]

        return f"{locality}{sublocality}" or results[0].get("formatted_address", "")

    except requests.Timeout:
        logger.warning("Reverse Geocoding APIタイムアウト")
        return ""
    except requests.RequestException as e:
        logger.warning(f"Reverse Geocoding APIエラー: {e}")
        return ""