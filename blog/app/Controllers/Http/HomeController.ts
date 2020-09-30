import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env';

export default class HomeController {
    public async index ({ auth, view }: HttpContextContract) {
        if (auth.user) {
            return view.render('home', {
                props: {
                    username: auth.user.username,
                    tileServerUrl: Env.get('TILE_SERVER_URL'),
                }
            });
        }

        return view.render('welcome');
    }
}
