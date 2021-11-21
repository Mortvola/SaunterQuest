import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class RouteGroupRoutes extends BaseSchema {
  protected tableName = 'route_group_routes'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('line_id');
      table.integer('start_edge_id');
      table.integer('end_edge_id');
    });
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('edge_id');
      table.bigInteger('line_id');
    });
  }
}
