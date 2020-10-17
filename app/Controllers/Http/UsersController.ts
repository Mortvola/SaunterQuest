import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';

export default class UsersController {
  // eslint-disable-next-line class-methods-use-this
  public async getProfile({ auth, response }: HttpContextContract): Promise<void> {
    if (auth.user) {
      response.send(auth.user.serialize({
        fields: [
          'endOfHikeDayExtension',
          'paceFactor',
          'startTime',
          'endTime',
          'breakDuration',
          'endDayExtension',
          'endHikeDayExtension',
        ],
      }));
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async putProfile({ auth, request }: HttpContextContract): Promise<void> {
    if (auth.user) {
      const profile = request.post();

      auth.user.endHikeDayExtension = profile.endHikeDayExtension;
      auth.user.paceFactor = profile.paceFactor;
      auth.user.startTime = profile.startTime;
      auth.user.endTime = profile.endTime;
      auth.user.breakDuration = profile.breakDuration;
      auth.user.endDayExtension = profile.endDayExtension;
      auth.user.endHikeDayExtension = profile.endHikeDayExtension;

      auth.user.save();
    }
  }
}
