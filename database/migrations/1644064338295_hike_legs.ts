import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class HikeLegs extends BaseSchema {
  protected tableName = 'hike_legs'

  public async up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now()).notNullable();
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now()).notNullable();

      table.bigInteger('hike_id').notNullable();
      table.string('name');

      this.defer(async () => {
        await this.db.rawQuery('CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE PLPGSQL ');

        await this.db.rawQuery(`CREATE TRIGGER set_timestamp BEFORE UPDATE ON ${this.tableName} FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp()`);

        await this.db.rawQuery(`INSERT INTO ${this.tableName} (hike_id) SELECT id from hike`);
      });
    });
  }

  public async down(): Promise<void> {
    this.schema.dropTable(this.tableName);
  }
}
