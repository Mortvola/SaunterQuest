// eslint-disable-next-line import/no-unresolved
import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Users extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('end_hike_day_extension');
      table.dropColumn('pace_factor');
      table.dropColumn('start_time');
      table.dropColumn('end_time');
      table.dropColumn('break_duration');
      table.dropColumn('end_day_extension');
      table.bigInteger('hiker_profile_id');
    });
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumn('hiker_profile_id');
    });
  }
}
