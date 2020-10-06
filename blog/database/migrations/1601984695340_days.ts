import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Days extends BaseSchema {
  protected tableName = 'days'

  public async up () {
    this.schema.table(this.tableName, (table) => {
      table.specificType('lat', 'double precision');
      table.specificType('lng', 'double precision');
    })
  }

  public async down () {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('lat');
      table.dropColumn('lng');
    })
  }
}
