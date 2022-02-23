import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Blogs extends BaseSchema {
  protected tableName = 'blogs';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('content');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('content');
    });
  }
}
