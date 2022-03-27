import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class RoutePoints extends BaseSchema {
  protected tableName = 'route_point'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.bigInteger('hike_id').notNullable();
      table.double('lat').notNullable();
      table.double('lng').notNullable();
      table.bigInteger('prev_line_id');
      table.double('prev_fraction');
      table.bigInteger('next_line_id');
      table.double('next_fraction');
      table.string('type');
      table.bigInteger('type_id');
      table.bigInteger('sort_order');
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
