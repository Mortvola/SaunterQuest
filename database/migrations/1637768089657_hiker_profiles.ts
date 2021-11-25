import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class HikerProfile extends BaseSchema {
  protected tableName = 'hiker_profile'

  public async up(): Promise<void> {
    this.schema
      .alterTable(this.tableName, (table) => {
        table.float('speed_factor').alter();
        table.integer('end_hike_day_extension');
      })
      .alterTable(this.tableName, (table) => {
        table.renameColumn('speed_factor', 'meters_per_hour');
      });

    this.defer(async () => {
      this.db
        .from('hiker_profile')
        .update({ meters_per_hour: this.db.raw('(meters_per_hour / 100.0) * 5.03674271751148') });
    });
  }

  public async down(): Promise<void> {
    this.schema
      .alterTable(this.tableName, (table) => {
        table.integer('meters_per_hour').alter();
        table.dropColumn('end_hike_day_extension');
      })
      .alterTable(this.tableName, (table) => {
        table.renameColumn('meters_per_hour', 'speed_factor');
      });
  }
}
