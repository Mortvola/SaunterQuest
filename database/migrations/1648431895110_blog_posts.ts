import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class BlogPosts extends BaseSchema {
  protected tableName = 'blog_posts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('title_photo_orientation').defaultTo(0);
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('title_photo_orientation');
    })
  }
}
