import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class NavEdges extends BaseSchema {
  protected tableName = 'nav_edges'

  public async up () {
    this.schema.table(this.tableName, (table) => {
      table.double('fraction');
    });
  }

  public async down () {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('fraction');
    });
  }
}
