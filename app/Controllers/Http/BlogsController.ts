import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database, { TransactionClientContract } from '@ioc:Adonis/Lucid/Database';
import Drive from '@ioc:Adonis/Core/Drive';
import { extname } from 'path';
import Blog from 'App/Models/Blog';
import { Exception, Response } from '@adonisjs/core/build/standalone';
import { DateTime } from 'luxon';
import BlogPost from 'App/Models/BlogPost';
import BlogComment from 'App/Models/BlogComment';
import { CommentProps } from 'common/ResponseTypes';
import Mail from '@ioc:Adonis/Addons/Mail';
import Env from '@ioc:Adonis/Core/Env';
import { schema, rules } from '@ioc:Adonis/Core/Validator';

export default class BlogsController {
  // eslint-disable-next-line class-methods-use-this
  async get() : Promise<Blog[]> {
    const blogs = await Blog.query();

    await Promise.all(blogs.map(async (b) => {
      if (b.draftPostId !== null) {
        await b.load('draftPost');
      }
    }));

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

  static async createOrUpdateDraft(blog: Blog, draftPost: any, trx: TransactionClientContract) {
    if (blog.draftPostId === null) {
      const published = await BlogPost.create({
        title: draftPost.title,
        titlePhotoId: draftPost.titlePhoto.id,
        titlePhotoCaption: draftPost.titlePhoto.caption,
        hikeLegId: draftPost.hikeLegId,
        content: JSON.stringify(draftPost.content),
      }, {
        client: trx,
      });

      blog.draftPostId = published.id;
    }
    else {
      await blog.related('draftPost').updateOrCreate({}, {
        title: draftPost.title,
        titlePhotoId: draftPost.titlePhoto.id,
        titlePhotoCaption: draftPost.titlePhoto.caption,
        hikeLegId: draftPost.hikeLegId,
        content: JSON.stringify(draftPost.content),
      });
    }
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

    await BlogsController.createOrUpdateDraft(blog, draftPost, trx);

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

    await BlogsController.createOrUpdateDraft(blog, draftPost, trx);

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
  async unpublish({ auth: { user }, params }: HttpContextContract): Promise<void> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const trx = await Database.transaction();

    const blog = await Blog.findOrFail(params.id, { client: trx });

    if (blog.publishedPostId) {
      const post = await BlogPost.find(blog.publishedPostId, { client: trx });

      await post?.delete();

      blog.publishedPostId = null;
      blog.publicationTime = null;
      blog.publicationUpdateTime = null;

      await blog.save();

      trx.commit();
    }
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

  // eslint-disable-next-line class-methods-use-this
  public async comment({
    request,
    params,
  }: HttpContextContract): Promise<BlogComment> {
    const id = parseInt(params.blogId, 10);

    const commentErrors: string[] = [
      'Cat got your tongue?',
      'Mums the word?',
      'Did you forget something?',
      'Are you the silent type?',
      'Speechless?',
    ];

    const body = await request.validate({
      schema: schema.create({
        name: schema.string({ trim: true }, [
          rules.required(),
        ]),
        email: schema.string({ trim: true }, [
          rules.email(),
        ]),
        comment: schema.string({ trim: true }, [
          rules.required(),
        ]),
        replyToId: schema.number.optional(),
        notify: schema.boolean.optional(),
      }),
      messages: {
        'name.required': 'A name is required',
        'email.required': 'A valid email address is required',
        'email.email': 'A valid email address is required',
        'comment.required': commentErrors[Math.floor(Math.random() * commentErrors.length)],
      },
    });

    const comment = new BlogComment();

    comment.fill({
      name: body.name,
      email: body.email,
      comment: body.comment,
      blogId: id,
      replyToId: body.replyToId,
      notify: body.notify ?? false,
    });

    await comment.save();

    if (body.replyToId !== null) {
      const repliedToComment = await BlogComment.find(body.replyToId);

      if (repliedToComment && repliedToComment.notify) {
        const blog = await Blog.find(id);

        if (blog) {
          await blog.load('publishedPost');

          const url = `${Env.get('APP_URL') as string}/blog/${blog.id}`;

          Mail.send((message) => {
            message
              .from(Env.get('MAIL_FROM_ADDRESS') as string, Env.get('MAIL_FROM_NAME') as string)
              .to(repliedToComment.email)
              .subject('You received a reply to your comment')
              .htmlView('emails/reply-notification', {
                name: repliedToComment.name,
                title: blog.publishedPost.title,
                url,
              });
          });
        }
      }
    }

    return comment;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getComments({ params }: HttpContextContract): Promise<CommentProps[]> {
    const id = parseInt(params.blogId, 10);

    const comments = await BlogComment.query().where('blogId', id).orderBy('createdAt', 'desc');

    type TempCommentProps = {
      id: number,
      createdAt: string,
      name: string,
      comment: string,
      replyToId: number | null,
      notify: boolean,
      replies: TempCommentProps[],
    };

    let response = comments.map<TempCommentProps>((c) => ({
      id: c.id,
      createdAt: c.createdAt.toISO(),
      name: c.name,
      comment: c.comment,
      replyToId: c.replyToId,
      notify: c.notify,
      replies: [],
    }));

    for (let i = 0; i < response.length;) {
      if (response[i].replyToId !== null) {
        // This is a reply, remove it from the list
        // and find the comment it is in reply to
        // and add it to it's replies array
        const reply = response[i];
        response = [
          ...response.slice(0, i),
          ...response.slice(i + 1),
        ];

        const stack: TempCommentProps[] = [];
        stack.push(...response);

        while (stack.length > 0) {
          const node = stack.pop();
          if (node) {
            if (node.id === reply.replyToId) {
              // Found it!
              node.replies.push(reply);
              break;
            }

            if (node.replies && node.replies.length) {
              stack.push(...node.replies);
            }
          }
        }
      }
      else {
        i += 1;
      }
    }

    return response;
  }
}
