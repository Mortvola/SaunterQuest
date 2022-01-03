import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env';

export default class HomeController {
  // eslint-disable-next-line class-methods-use-this
  public async index({ auth, view }: HttpContextContract) : Promise<any> {
    if (auth.user) {
      const props = {
        username: auth.user.username,
        tileServerUrl: Env.get('TILE_SERVER_URL'),
        pathFinderUrl: Env.get('PATHFINDER_URL'),
        extendedMenu: auth.user.admin,
      };

      return view.render('home', { props });
    }

    const props = {
      tileServerUrl: Env.get('TILE_SERVER_URL'),
    };

    return view.render('welcome', { props });
  }
}
