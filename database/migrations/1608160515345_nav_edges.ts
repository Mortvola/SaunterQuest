import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class NavEdges extends BaseSchema {
  protected tableName = 'nav_edges'

  public async up(): Promise<void> {
    this.schema.table(this.tableName, (table) => {
      table.renameColumn('start_node', 'node_id');
      table.dropColumn('end_node');
      table.renameColumn('start_fraction', 'fraction');
      table.dropColumn('end_fraction');
    });
  }

  public async down(): Promise<void> {
    this.schema.table(this.tableName, (table) => {
      table.renameColumn('node_id', 'start_node');
      table.integer('end_node');
      table.renameColumn('fraction', 'start_fraction');
      table.double('end_fraction');
    });
  }
}
