import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Photos extends BaseSchema {
  protected tableName = 'photos'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now()).alter();
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now()).alter();
    });

    this.defer(async () => {
      await this.db
        .from('photos')
        .update({
          created_at: this.now(),
          updated_at: this.now(),
        })
        .whereNull('created_at');
    });
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('created_at', { useTz: true }).alter();
      table.timestamp('updated_at', { useTz: true }).alter();
    })
  }
}
