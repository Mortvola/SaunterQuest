import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class HikeLegs extends BaseSchema {
  protected tableName = 'hike_legs'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('color').notNullable().defaultTo('#0042aa').alter();
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('color').notNullable().defaultTo('#3174ad').alter();
    })
  }
}
