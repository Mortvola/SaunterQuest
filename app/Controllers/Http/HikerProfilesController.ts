import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Hike from 'App/Models/Hike';
import HikerProfile from 'App/Models/HikerProfile';

export default class HikerProfilesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, params }: HttpContextContract) : Promise<HikerProfile[]> {
    if (!auth.user) {
      throw new Exception('user not authorized');
    }

    const hike = await Hike.findByOrFail('id', params.hikeId);
    await hike.load('hikerProfiles');

    return hike.hikerProfiles;
  }

  // eslint-disable-next-line class-methods-use-this
  public async addProfile({ params, request, response }: HttpContextContract) : Promise<void> {
    const hikerProfile = request.body();

    const profile = await HikerProfile.create({
      startDay: hikerProfile.startDay,
      endDay: hikerProfile.endDay,
      metersPerHour: hikerProfile.metersPerHour,
      startTime: hikerProfile.startTime,
      endTime: hikerProfile.endTime,
      breakDuration: hikerProfile.breakDuration,
      endDayExtension: hikerProfile.endDayExtension,
      hikeId: params.hikeId,
    });

    if (params.hikeId) {
      const hike = await Hike.findOrFail(parseInt(params.hikeId, 10));

      await HikerProfilesController.markScheduleDirty(hike);
    }

    profile.save();

    response.send(profile.serialize());
  }

  // eslint-disable-next-line class-methods-use-this
  public async updateProfile({ params, request, response }: HttpContextContract) : Promise<void> {
    const hikerProfile = await HikerProfile.findOrFail(params.profileId);
    const update = request.body();

    hikerProfile.startDay = update.startDay;
    hikerProfile.endDay = update.endDay;
    hikerProfile.metersPerHour = update.metersPerHour;
    hikerProfile.startTime = update.startTime;
    hikerProfile.endTime = update.endTime;
    hikerProfile.breakDuration = update.breakDuration;
    hikerProfile.endDayExtension = update.endDayExtension;

    if (hikerProfile.hikeId) {
      const hike = await Hike.findOrFail(hikerProfile.hikeId);

      await HikerProfilesController.markScheduleDirty(hike);
    }

    hikerProfile.save();

    response.send(hikerProfile.serialize());
  }

  // eslint-disable-next-line class-methods-use-this
  public async deleteProfile({ params }: HttpContextContract) : Promise<void> {
    const hikerProfile = await HikerProfile.findOrFail(params.profileId);

    hikerProfile.delete();

    if (hikerProfile.hikeId) {
      const hike = await Hike.findOrFail(hikerProfile.hikeId);

      await HikerProfilesController.markScheduleDirty(hike);
    }
  }

  private static async markScheduleDirty(hike: Hike) {
    await hike.load('schedule');

    if (hike.schedule) {
      hike.schedule.update = true;
      await hike.related('schedule').save(hike.schedule);
    }
  }
}
