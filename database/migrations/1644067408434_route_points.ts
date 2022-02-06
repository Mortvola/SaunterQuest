import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class RoutePoint extends BaseSchema {
  protected tableName = 'route_point'

  public async up(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('hike_id', 'hike_leg_id');
    });

    this.defer(async () => {
      const trx = await this.db.transaction();

      await trx.rawQuery(`UPDATE ${this.tableName} AS rp SET hike_leg_id = hl.id FROM hike_legs AS hl WHERE hl.hike_id = rp.hike_leg_id`);

      trx.commit();
    });
  }

  public async down(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('hike_leg_id', 'hike_id');
    });
  }
}
