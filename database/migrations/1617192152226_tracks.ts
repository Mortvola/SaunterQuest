import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Tracks extends BaseSchema {
  protected tableName = 'tracks'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.timestamps(true);
      table.specificType('way', 'geometry(LineString, 3857)');
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
