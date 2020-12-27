import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class NavEdges extends BaseSchema {
  protected tableName = 'nav_edges'

  public async up(): Promise<void> {
    this.schema.table(this.tableName, (table) => {
      table.integer('backward_node_id');
      table.integer('forward_node_id');
    });
  }

  public async down(): Promise<void> {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('backward_node_id');
      table.dropColumn('forward_node_id');
    });
  }
}
