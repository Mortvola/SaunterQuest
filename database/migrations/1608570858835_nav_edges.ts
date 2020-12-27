import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class NavEdges extends BaseSchema {
  protected tableName = 'nav_edges'

  public async up () {
    this.schema.table(this.tableName, (table) => {
      table.integer('point_index').alter();
    });
  }

  public async down () {
    this.schema.table(this.tableName, (table) => {
      table.double('point_index').alter();
    });
  }
}
