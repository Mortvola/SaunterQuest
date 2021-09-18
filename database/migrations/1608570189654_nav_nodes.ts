import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class NavNodes extends BaseSchema {
  protected tableName = 'nav_nodes'

  public async up () {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('edges');
    });
  }

  public async down () {
    this.schema.table(this.tableName, () => {
      console.log('no rollback');
    });
  }
}
