import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Photo extends BaseSchema {
  protected tableName = 'photos'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('orientation').defaultTo(0);
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('orientation');
    })
  }
}
