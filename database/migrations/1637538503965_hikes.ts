import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Hikes extends BaseSchema {
  protected tableName = 'hike'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.bigInteger('user_id');
      table.string('name');
      table.bigInteger('gear_configuration_id');

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
