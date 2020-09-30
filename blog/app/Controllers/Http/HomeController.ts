import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env';

export default class HomeController {
    public async index ({ auth, view }: HttpContextContract) {
        if (auth.user) {
            const props = {
                username: auth.user.username,
                tileServerUrl: Env.get('TILE_SERVER_URL'),
                extendedMenu: auth.user.admin,
            };
            
            return view.render('home', { props });
        }

        return view.render('welcome');
    }
}
