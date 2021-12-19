import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class HikePhotos extends BaseSchema {
  protected tableName = 'hike_photos'

  public async up(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('transforms');
    });
  }

  public async down(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('transforms');
    });
  }
}
