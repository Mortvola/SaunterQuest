import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class DraftPosts extends BaseSchema {
  protected tableName = 'blog_posts';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });

      table.bigInteger('hike_leg_id');
      table.string('title');
      table.integer('title_photo_id');
      table.string('title_photo_caption');
      table.json('content');
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
