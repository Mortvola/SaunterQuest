import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Hike from 'App/Models/Hike';

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
        || hike.schedule.days === null || hike.schedule.days === undefined
        || hike.schedule.days.length === 0
      ) {
        await hike.preload('routePoints');
        await hike.loadTrails();
        hike.assignDistances();
        await hike.updateSchedule(auth.user);
      }

      response.send(JSON.stringify(hike.schedule.days));
    }
  }
}
