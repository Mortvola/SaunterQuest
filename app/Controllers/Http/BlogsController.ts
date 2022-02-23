import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import Drive from '@ioc:Adonis/Core/Drive';
import { extname } from 'path';
import Blog from 'App/Models/Blog';
import { Exception } from '@adonisjs/core/build/standalone';
import { DateTime } from 'luxon';
import BlogPost from 'App/Models/BlogPost';

export default class BlogsController {
  // eslint-disable-next-line class-methods-use-this
  async get() : Promise<Blog[]> {
    const blogs = Blog.query().preload('draftPost');

    return blogs;
  }

  // eslint-disable-next-line class-methods-use-this
  async getBlog({ params }: HttpContextContract): Promise<Blog | null> {
    let blog: Blog | null = null;

    if (params.blogId === 'latest') {
      blog = await Blog.query().preload('publishedPost')
        .whereNotNull('publishedPostId')
        .orderBy('publicationTime', 'desc')
        .first();
    }
    else {
      blog = await Blog.findOrFail(params.blogId);
      await blog.load('publishedPost');
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
      id, draftPost,
    } = request.body();

    const trx = await Database.transaction();

    const blog = await Blog.findOrFail(id, { client: trx });

    await blog.related('draftPost').updateOrCreate({}, {
      title: draftPost.title,
      titlePhotoId: draftPost.titlePhoto.id,
      titlePhotoCaption: draftPost.titlePhoto.caption,
      hikeLegId: draftPost.hikeLegId,
      content: JSON.stringify(draftPost.content),
    });

    await blog.save();

    await blog.load('draftPost');

    trx.commit();

    return blog;
  }

  // eslint-disable-next-line class-methods-use-this
  async publish({ auth: { user }, request }: HttpContextContract): Promise<Blog> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const {
      id, draftPost,
    } = request.body();

    const trx = await Database.transaction();

    const blog = await Blog.findOrFail(id, { client: trx });

    await blog.related('draftPost').updateOrCreate({}, {
      title: draftPost.title,
      titlePhotoId: draftPost.titlePhoto.id,
      titlePhotoCaption: draftPost.titlePhoto.caption,
      hikeLegId: draftPost.hikeLegId,
      content: draftPost.content,
    });

    if (blog.publishedPostId === null) {
      const published = await BlogPost.create({
        title: draftPost.title,
        titlePhotoId: draftPost.titlePhoto.id,
        titlePhotoCaption: draftPost.titlePhoto.caption,
        hikeLegId: draftPost.hikeLegId,
        content: JSON.stringify(draftPost.content),
      }, {
        client: trx,
      });

      blog.publishedPostId = published.id;
    }
    else {
      await blog.related('publishedPost').updateOrCreate({}, {
        title: draftPost.title,
        titlePhotoId: draftPost.titlePhoto.id,
        titlePhotoCaption: draftPost.titlePhoto.caption,
        hikeLegId: draftPost.hikeLegId,
        content: JSON.stringify(draftPost.content),
      });
    }

    if (blog.publicationTime === null) {
      blog.publicationTime = DateTime.now();
    }
    else {
      blog.publicationUpdateTime = DateTime.now();
    }

    await blog.save();

    await blog.load('draftPost');
    await blog.load('publishedPost');

    trx.commit();

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
