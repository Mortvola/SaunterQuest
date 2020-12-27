import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class MapAreas extends BaseSchema {
  protected tableName = 'map_areas'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.timestamps(true);
      table.integer('south').notNullable();
      table.integer('west').notNullable();
      table.integer('north').notNullable();
      table.integer('east').notNullable();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
