import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class BlogEntries extends BaseSchema {
  protected tableName = 'blog_entries'

  public async up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });

      table.integer('blog_id').notNullable();
      table.string('title').notNullable();
      table.boolean('published').notNullable().defaultTo(false);
    });
  }

  public async down(): Promise<void> {
    this.schema.dropTable(this.tableName);
  }
}
