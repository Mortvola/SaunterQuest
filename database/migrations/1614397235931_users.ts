import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Users extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.integer('hike_counter');
    });
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('hike_counter');
    });
  }
}
