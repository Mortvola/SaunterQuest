import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class Comments extends BaseSchema {
  protected tableName = 'blog_comments';

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });

      table.string('name').notNullable();
      table.string('email').notNullable();
      table.integer('blog_id').notNullable();
      table.string('comment').notNullable();
      table.integer('reply_to_id');
      table.boolean('notify').notNullable();
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
