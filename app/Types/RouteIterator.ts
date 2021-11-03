import RoutePoint from 'App/Models/RoutePoint';
import Point from './Point';

function* RouteIterator(route: RoutePoint[])
  : Generator<Point, void, unknown> {
  let routeIndex = 0;
  let trailIndex = 0;

  if (route !== null && route !== undefined) {
    let { trail } = route[routeIndex];
    let distanceOffset = 0;

    while (
      routeIndex < route.length - 1
      && (trail === null || trailIndex < trail.length)
    ) {
      if (trail === null) {
        routeIndex += 1;

        if (routeIndex < route.length) {
          trail = route[routeIndex].trail;
          distanceOffset = route[routeIndex].distance;
        }
      }
      else {
        yield { ...trail[trailIndex], dist: trail[trailIndex].dist + distanceOffset };
        trailIndex += 1;
        if (trailIndex >= trail.length) {
          routeIndex += 1;
          trailIndex = 0;

          if (routeIndex < route.length) {
            trail = route[routeIndex].trail;
            distanceOffset = route[routeIndex].distance;
          }
        }
      }
    }
  }
}

export default RouteIterator;
