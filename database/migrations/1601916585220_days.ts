import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Days extends BaseSchema {
  protected tableName = 'days'

  public async up () {
    this.schema.table(this.tableName, (table) => {
      table.integer('start_meters');
    })
  }

  public async down () {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('start_meters');
    })
  }
}
