import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Blogs extends BaseSchema {
  protected tableName = 'blogs';

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('hike_leg_id').nullable().alter();
      table.string('title').nullable().alter();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('hike_leg_id').notNullable().alter();
      table.string('title').notNullable().alter();
    });
  }
}
