import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Hike from 'App/Models/Hike';
import HikeLeg from 'App/Models/HikeLeg';
import RoutePoint from 'App/Models/RoutePoint';
import User from 'App/Models/User';
import { ScheduleResponse } from 'common/ResponseTypes';

export default class SchedulesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ params }: HttpContextContract) : Promise<ScheduleResponse> {
    const leg = await HikeLeg.findOrFail(params.hikeLegId);
    const hike = await Hike.findOrFail(leg.hikeId);
    const user = await User.findOrFail(hike.userId);

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
      await leg.updateSchedule(user);
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
