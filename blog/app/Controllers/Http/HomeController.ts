import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class HomeController {
    public async index ({ auth, view }: HttpContextContract) {
        if (auth.user) {
            return view.render('home', { props: { username: auth.user.username }});
        }

        return view.render('welcome');
    }
}
