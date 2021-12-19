import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class HikePhotos extends BaseSchema {
  protected tableName = 'hike_photos'

  public async up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      /**
       * Uses timestamp for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });

      table.bigInteger('hike_id').notNullable();
      table.specificType('way', 'geometry(Point, 3857)');
    });
  }

  public async down(): Promise<void> {
    this.schema.dropTable(this.tableName);
  }
}
