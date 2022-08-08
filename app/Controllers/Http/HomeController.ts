/* eslint-disable consistent-return */
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env';
import Blog from 'App/Models/Blog';

type OpenGraph = {
  title: string,
  titlePhotoId: number | null,
  blogId: number | null,
};

export default class HomeController {
  // eslint-disable-next-line class-methods-use-this
  public async index({ auth, view }: HttpContextContract) : Promise<string | void> {
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

    const blog = await Blog.query().preload('publishedPost')
      .whereNotNull('publishedPostId')
      .orderBy('publicationTime', 'desc')
      .first();

    let og: OpenGraph = {
      title: 'SaunterQuest: a hiking blog site',
      titlePhotoId: null,
      blogId: null,
    };

    if (blog) {
      og = {
        title: blog.publishedPost.title ?? '',
        titlePhotoId: blog.publishedPost.titlePhotoId,
        blogId: blog.id,
      };
    }

    return view.render('welcome', { props, og });
  }
}
