import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class PoiRvs extends BaseSchema {
  protected tableName = 'poi_rvs'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.specificType('location', 'geometry(Point, 3857)').notNullable();
      table.json('data').notNullable();
    });

    this.defer(async () => {
      const trx = await this.db.transaction();

      await trx.rawQuery(`
        insert into poi_rvs (location, data)
        select way, json_build_object('name', name)
        from planet_osm_point
        where tourism = 'caravan_site'
      `);

      await trx.rawQuery(`
        insert into poi_rvs (location, data)
        select ST_PointOnSurface(way), json_build_object('name', name)
        from planet_osm_polygon
        where tourism = 'caravan_site'
      `);

      await trx.commit();
    });
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
