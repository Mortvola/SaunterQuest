import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class PointOfInterest extends BaseSchema {
  protected tableName = 'point_of_interest'

  public async up () {
    this.schema.renameTable(this.tableName, 'point_of_interests');
  }

  public async down () {
    this.schema.renameTable('point_of_interests', this.tableName);
  }
}
