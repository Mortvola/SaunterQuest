import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Drive from '@ioc:Adonis/Core/Drive';
import { extname } from 'path';
import Blog from 'App/Models/Blog';
import { Exception } from '@adonisjs/core/build/standalone';
import { DateTime } from 'luxon';

export default class BlogsController {
  // eslint-disable-next-line class-methods-use-this
  async get() : Promise<Blog[]> {
    const blogs = Blog.all();

    return blogs;
  }

  // eslint-disable-next-line class-methods-use-this
  async getBlog({ params }: HttpContextContract): Promise<Blog | null> {
    let blog: Blog | null = null;

    if (params.blogId === 'latest') {
      blog = await Blog.query().where('published', true).orderBy('publicationDate', 'desc').first();
    }
    else {
      blog = await Blog.findOrFail(params.blogId);
    }

    return blog;
  }

  // eslint-disable-next-line class-methods-use-this
  async create({ auth: { user } }: HttpContextContract): Promise<Blog> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const blog = new Blog();

    blog.fill({
      userId: user.id,
    });

    await blog.save();

    return blog;
  }

  // eslint-disable-next-line class-methods-use-this
  async update({ auth: { user }, request }: HttpContextContract): Promise<Blog> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const {
      id, published, title, hikeLegId, content,
    } = request.body();

    const blog = await Blog.findOrFail(id);

    blog.merge({
      title,
      published,
      publicationDate: !blog.published && published ? DateTime.now() : null,
      hikeLegId,
      content: JSON.stringify(content),
    });

    await blog.save();

    return blog;
  }

  // eslint-disable-next-line class-methods-use-this
  async addPhoto({ auth: { user }, request }: HttpContextContract): Promise<{ id: number }> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const [id] = await Database.insertQuery()
      .table('blog_photos')
      .returning('id')
      .insert({
        photo_id: request.body(),
      });

    return { id };
  }

  // eslint-disable-next-line class-methods-use-this
  // async getPhotos({ params }: HttpContextContract): Promise<unknown> {
  //   const blog = await Blog.findOrFail(params.blogId);

  //   const photos = await Database.query()
  //     .select(
  //       'id',
  //       'caption',
  //       'transforms',
  //       Database.raw('ST_AsGeoJSON(ST_Transform(way, 4326))::json->\'coordinates\' as location'),
  //     )
  //     .from('hike_photos')
  //     .where('hike_id', blog.hikeId);

  //   photos.forEach((i) => {
  //     if (i.transforms !== null) {
  //       i.transforms = JSON.parse(i.transforms);
  //     }
  //   });

  //   return photos;
  // }

  // eslint-disable-next-line class-methods-use-this
  public async getPhoto({
    params,
    response,
  }: HttpContextContract): Promise<unknown> {
    const blog = await Blog.findOrFail(params.blogId);

    const location = `./photos/${blog.userId}/${params.photoId}_small.jpg`;

    const { size } = await Drive.getStats(location);

    response.type(extname(location));
    response.header('content-length', size);

    return response.stream(await Drive.getStream(location));
  }
}
