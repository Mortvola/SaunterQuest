import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Schedules extends BaseSchema {
  protected tableName = 'schedules'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary();
      table.timestamps(true)
      table.bigInteger('hike_id')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
