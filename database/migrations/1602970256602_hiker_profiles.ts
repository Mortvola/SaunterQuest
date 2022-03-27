import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class HikerProfiles extends BaseSchema {
  protected tableName = 'hiker_profile'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.bigInteger('hike_id');
      table.integer('start_day');
      table.integer('end_day');
      table.double('speed_factor');
      table.double('start_time');
      table.double('end_time');
      table.double('break_duration');

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
