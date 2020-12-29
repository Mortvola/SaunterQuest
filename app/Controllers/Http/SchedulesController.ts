import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Hike from 'App/Models/Hike';
import RoutePoint from 'App/Models/RoutePoint';

export default class SchedulesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, params, response }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const hike = await Hike.findByOrFail('id', params.hikeId);
      await hike.preload('schedule', (query) => {
        query.preload('days');
      });

      if (
        hike.schedule === null || hike.schedule === undefined
        || hike.schedule.update
        || hike.schedule.days === null || hike.schedule.days === undefined
        || hike.schedule.days.length === 0
      ) {
        await hike.preload('routePoints');
        await hike.loadTrails();
        hike.assignDistances();
        await hike.updateSchedule(auth.user);
      }

      if (hike.schedule) {
        for (let i = 0; i < hike.schedule.days.length; i += 1) {
          const elevation = await RoutePoint.getElevation(
            hike.schedule.days[i].lat, hike.schedule.days[i].lng,
          );

          if (elevation) {
            hike.schedule.days[i].ele = elevation;
          }
        }

        response.send(JSON.stringify(hike.schedule.days));
      }
      else {
        response.ok([]);
      }
    }
  }
}
