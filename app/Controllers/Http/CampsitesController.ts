import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import { Exception } from '@poppinss/utils';

export default class CampsitesController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, request }: HttpContextContract) : Promise<unknown> {
    if (!auth.user) {
      throw new Exception('invalid user');
    }

    const {
      n, s, e, w,
    } = request.qs();

    const items = await Database.query()
      .select(
        'osm_id as id',
        'name',
        Database.raw('ST_AsGeoJSON(ST_Transform(way, 4326))::json->\'coordinates\' as location'),
      )
      .from('planet_osm_point')
      .where('tourism', 'camp_site')
      .andWhereRaw(`ST_Intersects(
          ST_SetSRID(ST_MakeBox2D(
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857),
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857)
          ), 3857),
          way)`, [w, n, e, s]);

    return items;
  }
}
