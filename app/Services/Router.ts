import fetch from 'node-fetch';
// eslint-disable-next-line import/no-unresolved
import Env from '@ioc:Adonis/Core/Env';
import Point from 'App/Types/Point';

export type TrailInfo = {
  point: {
    lat: number;
    lng: number;
  },
  // eslint-disable-next-line camelcase
  line_id: number;
  fraction: number;
}

class Router {
  public static degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  public static haversineGreatCircleDistance(
    latitudeFrom: number,
    longitudeFrom: number,
    latitudeTo: number,
    longitudeTo: number,
    earthRadius = 6378137,
  ): number {
    // convert from degrees to radians
    const latFrom = Router.degToRad(latitudeFrom);
    const lonFrom = Router.degToRad(longitudeFrom);
    const latTo = Router.degToRad(latitudeTo);
    const lonTo = Router.degToRad(longitudeTo);

    const latDelta = latTo - latFrom;
    const lonDelta = lonTo - lonFrom;

    const a = (Math.sin(latDelta / 2) ** 2)
      + Math.cos(latFrom) * Math.cos(latTo) * (Math.sin(lonDelta / 2) ** 2);

    const angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return angle * earthRadius;
  }

  public static async getTrailFromPoint(point: Point) : Promise<TrailInfo> {
    const response = await fetch(`${Env.get('PATHFINDER_INTERNAL_URL')}/map/trail-from-point/${point.lat}/${point.lng}`);

    if (response.ok) {
      const trailInfo = (await response.json()) as TrailInfo;

      if (trailInfo === null) {
        throw (new Error(`Trail information could not be determined from point: ${JSON.stringify(point)}`));
      }

      return trailInfo;
    }

    throw (new Error(`Fetch from pathFinder failed: ${response.statusText}`));
  }
}

export default Router;
