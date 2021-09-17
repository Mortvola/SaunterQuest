import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class PlanetOsmRoute extends BaseSchema {
  protected tableName = 'planet_osm_route'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.bigInteger('line_id').defaultTo(this.raw("nextval('line_id_seq'::regclass)")).alter();
    });
  }

  public async down() {
    this.schema.table(this.tableName, (table) => {
      table.bigInteger('line_id').alter();
    });
  }
}
