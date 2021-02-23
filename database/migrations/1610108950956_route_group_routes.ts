import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class RouteGroupsRoutes extends BaseSchema {
  protected tableName = 'route_group_routes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.timestamps(true);
      table.integer('route_group_id');
      table.bigInteger('line_id');
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
