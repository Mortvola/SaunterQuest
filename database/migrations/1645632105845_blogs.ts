import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Blogs extends BaseSchema {
  protected tableName = 'blogs';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('published_post_id');
      table.integer('draft_post_id');
    });

    this.defer(async () => {
      const trx = await this.db.transaction();

      const blogs = await trx.query()
        .select(
          'title',
          'hike_leg_id',
          'content',
          'title_photo_id',
          'title_photo_caption',
        )
        .from('blogs');

      await Promise.all(blogs.map(async (b) => {
        const [id] = await trx.insertQuery()
          .insert({
            title: b.title,
            hike_leg_id: b.hike_leg_id,
            content: b.content ? JSON.stringify(b.content) : null,
            title_photo_id: b.title_photo_id,
            title_photo_caption: b.title_photo_caption,
          })
          .table('blog_posts')
          .returning('id');

        await trx.query().update({ draft_post_id: id }).from('blogs');
      }));

      trx.commit();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('published_post_id');
      table.dropColumn('draft_post_id');
    });
  }
}
