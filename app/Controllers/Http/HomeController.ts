import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env';
import Blog from 'App/Models/Blog';

export default class HomeController {
  // eslint-disable-next-line class-methods-use-this
  public async index({ auth, view }: HttpContextContract) : Promise<string> {
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

    const blog = await Blog.query().where('published', true).orderBy('publicationDate', 'desc').first();
    const og = {
      title: blog?.title ?? '',
    };

    return view.render('welcome', { props, og });
  }

  // eslint-disable-next-line class-methods-use-this
  public async blogPost({ auth, view, params }: HttpContextContract) : Promise<string> {
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

    const blog = await Blog.findOrFail(params.id);
    const og = {
      title: blog.title,
    };

    return view.render('welcome', { props, og });
  }
}
