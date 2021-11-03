import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Hike from 'App/Models/Hike';
import RoutePoint from 'App/Models/RoutePoint';
import { ScheduleResponse } from 'common/ResponseTypes';

export default class SchedulesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, params }: HttpContextContract) : Promise<ScheduleResponse> {
    if (!auth.user) {
      throw new Exception('user is not authorized');
    }

    const hike = await Hike.findByOrFail('id', params.hikeId);
    await hike.load('schedule', (query) => {
      query.preload('days');
    });

    if (
      hike.schedule === null || hike.schedule === undefined
      || hike.schedule.update
      || hike.schedule.days === null || hike.schedule.days === undefined
      || hike.schedule.days.length === 0
    ) {
      await hike.load('routePoints');
      await hike.loadTrails();
      hike.assignDistances();
      await hike.updateSchedule(auth.user);
    }

    if (hike.schedule) {
      for (let i = 0; i < hike.schedule.days.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const elevation = await RoutePoint.getElevation(
          hike.schedule.days[i].lat, hike.schedule.days[i].lng,
        );

        if (elevation) {
          hike.schedule.days[i].ele = elevation;
        }
      }

      return hike.schedule.days;
    }

    return [];
  }
}
