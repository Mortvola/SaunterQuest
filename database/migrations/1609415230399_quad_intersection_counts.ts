import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class QuadIntersectionCounts extends BaseSchema {
  protected tableName = 'quad_intersection_counts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.timestamps(true);
      table.integer('lat');
      table.integer('lng');
      table.integer('intersection_count');
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
