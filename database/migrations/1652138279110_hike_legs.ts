import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class HikeLegs extends BaseSchema {
  protected tableName = 'hike_legs';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('start_type').notNullable().defaultTo('none');
      table.integer('after_hike_leg_id');
    });

    this.defer(async () => {
      const trx = await this.db.transaction();

      await trx.rawQuery(`
        update hike_legs
        set start_type = 'date'
        where start_date is not null;
      `);

      await trx.commit();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('start_type');
      table.dropColumn('after_hike_leg_id');
    });
  }
}
