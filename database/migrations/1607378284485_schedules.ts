import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Schedules extends BaseSchema {
  protected tableName = 'schedules'

  public async up () {
    this.schema.table(this.tableName, (table) => {
	table.boolean('update');
    })
  }

  public async down () {
    this.schema.table(this.tableName, (table) => {
	table.dropColumn('update');
    })
  }
}
