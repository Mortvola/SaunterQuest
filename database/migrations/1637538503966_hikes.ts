import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Hike extends BaseSchema {
  protected tableName = 'hike'

  public async up(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('route_group_id');
    });
  }

  public async down(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('route_group_id');
    });
  }
}
