import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class PointOfInterest extends BaseSchema {
  protected tableName = 'point_of_interest'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('type').notNullable();
    });
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('type');
    });
  }
}
