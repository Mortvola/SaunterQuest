import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Blogs extends BaseSchema {
  protected tableName = 'blogs';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('publication_update_time', { useTz: true });
      table.renameColumn('publication_date', 'publication_time');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('publication_update_time');
      table.renameColumn('publication_time', 'publication_date');
    });
  }
}
