import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Hike from 'App/Models/Hike';

export default class HikerProfilesController {
  public async get({ auth, params, response }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const hike = await Hike.findByOrFail('id', params.hikeId);
      await hike.preload('hikerProfiles');

      response.send(JSON.stringify(hike.hikerProfiles));
    }
  }
}
