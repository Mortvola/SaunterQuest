import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class RouteGroups extends BaseSchema {
  protected tableName = 'route_groups'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.timestamps(true);
      table.string('name');
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
