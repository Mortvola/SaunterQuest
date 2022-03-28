import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Photos extends BaseSchema {
  protected tableName = 'photos'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('deleted').notNullable().defaultTo(false);
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('deleted');
    })
  }
}
