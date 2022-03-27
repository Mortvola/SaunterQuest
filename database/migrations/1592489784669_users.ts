import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UsersSchema extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('username', 255).notNullable()
      table.string('email', 255).notNullable()
      table.timestamp('email_verified_at')
      table.string('password', 180).notNullable()
      table.string('remember_token').nullable()
      table.integer('end_hike_day_extension');
      table.integer('pace_factor');
      table.double('start_time');
      table.double('end_time');
      table.double('break_duration');
      table.integer('end_day_extension');

      /**
       * Uses timestampz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
