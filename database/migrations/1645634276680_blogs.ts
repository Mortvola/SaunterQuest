import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Blogs extends BaseSchema {
  protected tableName = 'blogs';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('title');
      table.dropColumn('published');
      table.dropColumn('text');
      table.dropColumn('title_photo_id');
      table.dropColumn('title_photo_caption');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('title');
      table.boolean('published');
      table.string('text');
      table.integer('title_photo_id');
      table.text('title_photo_caption');
    });
  }
}
