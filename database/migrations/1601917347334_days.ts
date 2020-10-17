import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Days extends BaseSchema {
  protected tableName = 'days'

  public async up () {
    this.schema.table(this.tableName, (table) => {
	table.integer('start_time');
	table.integer('end_time');
        table.integer('gain');
        table.integer('loss');
        table.integer('meters');
    })
  }

  public async down () {
    this.schema.table(this.tableName, (table) => {
	table.dropColumn('start_time');
        table.dropColumn('end_time');
        table.dropColumn('gain');
        table.dropColumn('loss');
        table.dropColumn('meters');
    })
  }
}
