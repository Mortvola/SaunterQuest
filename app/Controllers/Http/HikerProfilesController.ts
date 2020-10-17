import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Hike from 'App/Models/Hike';
import HikerProfile from 'App/Models/HikerProfile';

export default class HikerProfilesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, params, response }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const hike = await Hike.findByOrFail('id', params.hikeId);
      await hike.preload('hikerProfiles');

      response.send(JSON.stringify(hike.hikerProfiles));
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async addProfile({ params, request, response }: HttpContextContract) : Promise<void> {
    const hikerProfile = request.post();

    const profile = await HikerProfile.create({
      startDay: hikerProfile.startDay,
      endDay: hikerProfile.endDay,
      speedFactor: hikerProfile.speedFactor,
      startTime: hikerProfile.startTime,
      endTime: hikerProfile.endTime,
      breakDuration: hikerProfile.breakDuration,
      endDayExtension: hikerProfile.endDayExtension,
      hikeId: params.hikeId,
    });

    profile.save();

    response.send(profile.serialize());
  }

  // eslint-disable-next-line class-methods-use-this
  public async updateProfile({ params, request, response }: HttpContextContract) : Promise<void> {
    const hikerProfile = await HikerProfile.findOrFail(params.profileId);
    const update = request.post();

    hikerProfile.startDay = update.startDay;
    hikerProfile.endDay = update.endDay;
    hikerProfile.speedFactor = update.speedFactor;
    hikerProfile.startTime = update.startTime;
    hikerProfile.endTime = update.endTime;
    hikerProfile.breakDuration = update.breakDuration;
    hikerProfile.endDayExtension = update.endDayExtension;

    hikerProfile.save();

    response.send(hikerProfile.serialize());
  }

  // eslint-disable-next-line class-methods-use-this
  public async deleteProfile({ params }: HttpContextContract) : Promise<void> {
    const hikerProfile = await HikerProfile.findOrFail(params.profileId);

    hikerProfile.delete();
  }
}
