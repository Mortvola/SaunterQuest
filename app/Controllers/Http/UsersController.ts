import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database from '@ioc:Adonis/Lucid/Database';
import HikerProfile from 'App/Models/HikerProfile';

export default class UsersController {
  // eslint-disable-next-line class-methods-use-this
  public async getProfile({
    auth: {
      user,
    },
  }: HttpContextContract): Promise<HikerProfile | null> {
    if (!user) {
      throw new Exception('user is not authorized');
    }

    return HikerProfile.find(user.hikerProfileId);
  }

  // eslint-disable-next-line class-methods-use-this
  public async putProfile({ auth: { user }, request }: HttpContextContract): Promise<HikerProfile> {
    if (!user) {
      throw new Exception('user is not authorized');
    }

    const profileProps = request.body();

    const trx = await Database.transaction();

    user.useTransaction(trx);

    let profile = await user.related('hikerProfile').query().first();

    if (profile === null) {
      profile = (new HikerProfile()).useTransaction(trx);

      if (profile === null) {
        throw new Exception('profile is null');
      }

      profile.fill(profileProps);

      await profile.save();

      user.hikerProfileId = profile.id;

      await user.save();
    }
    else {
      profile.merge(profileProps);
      await profile.save();
    }

    trx.commit();

    return profile;
  }
}
