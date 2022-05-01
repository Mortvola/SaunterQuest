import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class HikeLegs extends BaseSchema {
  protected tableName = 'hike_legs'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('start_date');
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('start_date');
    })
  }
}
