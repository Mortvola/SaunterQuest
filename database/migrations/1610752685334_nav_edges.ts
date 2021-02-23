import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class NavEdges extends BaseSchema {
  protected tableName = 'nav_edges'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.renameColumn('backward_node_id', 'reverse_edge_id');
      table.renameColumn('forward_node_id', 'forward_edge_id');
      table.renameColumn('backward_cost', 'reverse_cost');
    });
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.renameColumn('reverse_edge_id', 'backward_node_id');
      table.renameColumn('forward_edge_id', 'forward_node_id');
      table.renameColumn('reverse_cost', 'backward_cost');
    });
  }
}
