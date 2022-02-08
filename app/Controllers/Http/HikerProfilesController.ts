import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import HikeLeg from 'App/Models/HikeLeg';
import HikerProfile from 'App/Models/HikerProfile';

export default class HikerProfilesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, params }: HttpContextContract) : Promise<HikerProfile[]> {
    if (!auth.user) {
      throw new Exception('user not authorized');
    }

    const leg = await HikeLeg.findByOrFail('id', params.hikeLegId);
    const profiles = leg.related('hikerProfiles').query().orderBy('startDay');

    return profiles;
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
      hikeLegId: params.hikeLegId,
    });

    if (params.hikeLegId) {
      const leg = await HikeLeg.findOrFail(parseInt(params.hikeLegId, 10));

      await HikerProfilesController.markScheduleDirty(leg);
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

    if (hikerProfile.hikeLegId) {
      const leg = await HikeLeg.findOrFail(hikerProfile.hikeLegId);

      await HikerProfilesController.markScheduleDirty(leg);
    }

    hikerProfile.save();

    response.send(hikerProfile.serialize());
  }

  // eslint-disable-next-line class-methods-use-this
  public async deleteProfile({ params }: HttpContextContract) : Promise<void> {
    const hikerProfile = await HikerProfile.findOrFail(params.profileId);

    hikerProfile.delete();

    if (hikerProfile.hikeLegId) {
      const leg = await HikeLeg.findOrFail(hikerProfile.hikeLegId);

      await HikerProfilesController.markScheduleDirty(leg);
    }
  }

  private static async markScheduleDirty(leg: HikeLeg) {
    await leg.load('schedule');

    if (leg.schedule) {
      leg.schedule.update = true;
      await leg.related('schedule').save(leg.schedule);
    }
  }
}
