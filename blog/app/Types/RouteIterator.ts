import RoutePoint from 'App/Models/RoutePoint';

function* RouteIterator(route: RoutePoint[]) {
  let routeIndex = 0;
  let trailIndex = 0;

  if (route !== null && route !== undefined) {
    while(routeIndex < route.length - 1
        && (route[routeIndex].trail === null
        || trailIndex < route[routeIndex].trail!.length)
    ) {
      if (route[routeIndex].trail === null) {
        routeIndex += 1;
      }
      else {
        yield route[routeIndex].trail![trailIndex];
        trailIndex += 1;
        if (trailIndex >= route[routeIndex].trail!.length) {
          routeIndex += 1;
          trailIndex = 0;
        }
      }
    }
  }
}

export default RouteIterator;
