import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class HikerProfile extends BaseSchema {
  protected tableName = 'hiker_profile'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.integer('end_day_extension');
    });
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('end_day_extension');
    });
  }
}
