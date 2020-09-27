function positionMapToBounds(map, p1, p2) {
    const bounds = {};

    if (p1.lng < p2.lng) {
        bounds.east = p2.lng;
        bounds.west = p1.lng;
    }
    else {
        bounds.east = p1.lng;
        bounds.west = p2.lng;
    }

    if (p1.lat < p2.lat) {
        bounds.north = p2.lat;
        bounds.south = p1.lat;
    }
    else {
        bounds.north = p1.lat;
        bounds.south = p2.lat;
    }

    map.fitBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]]);
}

export { positionMapToBounds };