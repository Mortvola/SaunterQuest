import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class RouteGroupRoutes extends BaseSchema {
  protected tableName = 'route_group_routes';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index('route_group_id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('route_group_id');
    });
  }
}
