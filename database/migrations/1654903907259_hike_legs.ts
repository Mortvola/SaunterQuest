import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class HikeLeg extends BaseSchema {
  protected tableName = 'hike_legs';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('number_of_zeros').notNullable().defaultTo(1);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('number_of_zeros');
    });
  }
}
