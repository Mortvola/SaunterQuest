import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import HikeLeg from 'App/Models/HikeLeg';
import RoutePoint from 'App/Models/RoutePoint';
import { ScheduleResponse } from 'common/ResponseTypes';

export default class SchedulesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, params }: HttpContextContract) : Promise<ScheduleResponse> {
    if (!auth.user) {
      throw new Exception('user is not authorized');
    }

    const leg = await HikeLeg.findByOrFail('id', params.hikeLegId);

    await leg.load('schedule', (query) => {
      query.preload('days');
    });

    if (
      leg.schedule === null || leg.schedule === undefined
      || leg.schedule.update
      || leg.schedule.days === null || leg.schedule.days === undefined
      || leg.schedule.days.length === 0
    ) {
      await leg.load('routePoints');
      await leg.loadTrails();
      leg.assignDistances();
      await leg.updateSchedule(auth.user);
    }

    if (leg.schedule) {
      for (let i = 0; i < leg.schedule.days.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const elevation = await RoutePoint.getElevation(
          leg.schedule.days[i].lat, leg.schedule.days[i].lng,
        );

        if (elevation) {
          leg.schedule.days[i].ele = elevation;
        }
      }

      return leg.schedule.days;
    }

    return [];
  }
}
