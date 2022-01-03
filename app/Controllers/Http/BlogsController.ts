import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Drive from '@ioc:Adonis/Core/Drive';
import { extname } from 'path';
import Blog from 'App/Models/Blog';

export default class BlogsController {
  // eslint-disable-next-line class-methods-use-this
  async get() : Promise<Blog[]> {
    const blogs = Blog.all();

    return blogs;
  }

  // eslint-disable-next-line class-methods-use-this
  async getBlog({ params }: HttpContextContract): Promise<Blog> {
    const blog = Blog.findOrFail(params.blogId);

    return blog;
  }

  // eslint-disable-next-line class-methods-use-this
  async getPhotos({ params }: HttpContextContract): Promise<unknown> {
    const blog = await Blog.findOrFail(params.blogId);

    const photos = await Database.query()
      .select(
        'id',
        'caption',
        'transforms',
        Database.raw('ST_AsGeoJSON(ST_Transform(way, 4326))::json->\'coordinates\' as location'),
      )
      .from('hike_photos')
      .where('hike_id', blog.hikeId);

    photos.forEach((i) => {
      if (i.transforms !== null) {
        i.transforms = JSON.parse(i.transforms);
      }
    });

    return photos;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getPhoto({
    params,
    response,
  }: HttpContextContract): Promise<unknown> {
    const blog = await Blog.findOrFail(params.blogId);

    const location = `./hikes/${blog.hikeId}/photos/${params.photoId}.jpg`;

    const { size } = await Drive.getStats(location);

    response.type(extname(location));
    response.header('content-length', size);

    return response.stream(await Drive.getStream(location));
  }
}
