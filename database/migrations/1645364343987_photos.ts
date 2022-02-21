import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Photos extends BaseSchema {
  protected tableName = 'photos';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });

      table.bigInteger('user_id').notNullable();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
