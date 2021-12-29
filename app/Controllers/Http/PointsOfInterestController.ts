import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database from '@ioc:Adonis/Lucid/Database';
import PointOfInterest from 'App/Models/PointOfInterest';

export default class PointsOfInterestController {
  // eslint-disable-next-line class-methods-use-this
  public async get({
    auth, params, response,
  }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const poi = await PointOfInterest.query().where('hike_id', params.hikeId);

      response.send(poi);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async add({
    auth, request, params, response,
  }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const poi = await PointOfInterest.create({
        name: request.body().name,
        description: request.body().description,
        hikeId: params.hikeId,
        type: request.body().type,
        lat: request.body().lat,
        lng: request.body().lng,
      });

      response.send(poi);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async getCampsites({ auth, request }: HttpContextContract) : Promise<unknown> {
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

    const polyItems = await Database.query()
      .select(
        'osm_id as id',
        'name',
        Database.raw('ST_AsGeoJSON(ST_Transform(ST_PointOnSurface(way), 4326))::json->\'coordinates\' as location'),
      )
      .from('planet_osm_polygon')
      .where('tourism', 'camp_site')
      .andWhereRaw(`ST_Intersects(
          ST_SetSRID(ST_MakeBox2D(
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857),
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857)
          ), 3857),
          way)`, [w, n, e, s]);

    return items.concat(polyItems);
  }

  // eslint-disable-next-line class-methods-use-this
  public async getRvSites({ auth, request }: HttpContextContract) : Promise<unknown> {
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
      .where('tourism', 'caravan_site')
      .andWhereRaw(`ST_Intersects(
        ST_SetSRID(ST_MakeBox2D(
          ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857),
          ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857)
        ), 3857),
        way)`, [w, n, e, s]);

    const polyItems = await Database.query()
      .select(
        'osm_id as id',
        'name',
        Database.raw('ST_AsGeoJSON(ST_Transform(ST_PointOnSurface(way), 4326))::json->\'coordinates\' as location'),
      )
      .from('planet_osm_polygon')
      .where('tourism', 'caravan_site')
      .andWhereRaw(`ST_Intersects(
        ST_SetSRID(ST_MakeBox2D(
          ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857),
          ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857)
        ), 3857),
        way)`, [w, n, e, s]);

    return items.concat(polyItems);
  }

  // eslint-disable-next-line class-methods-use-this
  public async getPostOffices({ auth, request }: HttpContextContract) : Promise<unknown> {
    if (!auth.user) {
      throw new Exception('invalid user');
    }

    const {
      n, s, e, w,
    } = request.qs();

    const items = await Database.query()
      .select(
        'osm_id as id',
        Database.raw('ST_AsGeoJSON(ST_Transform(way, 4326))::json->\'coordinates\' as location'),
      )
      .from('planet_osm_point')
      .where('amenity', 'post_office')
      .andWhereRaw("tags->'operator' in ('USPS', 'United States Postal Service', 'United States Post Office')")
      .andWhereRaw(`ST_Intersects(
          ST_SetSRID(ST_MakeBox2D(
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857),
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857)
          ), 3857),
          way)`, [w, n, e, s]);

    return items;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getCities({ auth, request }: HttpContextContract) : Promise<unknown> {
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
      .whereIn('place', ['village', 'city', 'town'])
      .andWhereRaw(`ST_Intersects(
          ST_SetSRID(ST_MakeBox2D(
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857),
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857)
          ), 3857),
          way)`, [w, n, e, s]);

    return items;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getPhotos({ request }: HttpContextContract) : Promise<unknown> {
    const {
      n, s, e, w,
    } = request.qs();

    const items = await Database.query()
      .select(
        'id',
        'transforms',
        Database.raw('ST_AsGeoJSON(ST_Transform(way, 4326))::json->\'coordinates\' as location'),
      )
      .from('hike_photos')
      .andWhereRaw(`ST_Intersects(
          ST_SetSRID(ST_MakeBox2D(
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857),
            ST_Transform(ST_SetSRID(ST_MakePoint(?, ?), 4326), 3857)
          ), 3857),
          way)`, [w, n, e, s]);

    items.forEach((i) => {
      if (i.transforms !== null) {
        i.transforms = JSON.parse(i.transforms);
      }
    });

    return items;
  }
}
