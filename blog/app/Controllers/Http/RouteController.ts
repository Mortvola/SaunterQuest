import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database';
import RoutePoint from 'App/Models/RoutePoint';

export default class RouteController {
    public async get ({ params, response }: HttpContextContract) {
        let routePoints = await RoutePoint
            .query()
            .where('hike_id', params.hikeId)
            .orderBy('sort_order');

        routePoints = await Promise.all(routePoints.map(async (p, index) => {
            if (index < routePoints.length - 1) {
                const n = routePoints[index + 1];

                if (p.nextLineId !== n.prevLineId) {
                    throw(new Error(`Previous and next IDs do not match: ${p.nextLineId}, ${n.prevLineId}`));
                }

                let startFraction = p.nextFraction;
                let endFraction = n.prevFraction;
                let wayColumn = 'way';

                if (startFraction > endFraction) {
                    startFraction = 1 - startFraction;
                    endFraction =  1 - endFraction;
                    wayColumn = 'ST_Reverse(way)';
                }

                const line = await Database
                    .query()
                    .select(Database.raw(
                        `ST_AsGeoJSON(ST_Transform(ST_LineSubstring (${wayColumn}, ${startFraction}, ${endFraction}), 4326)) AS linestring`,
                    ))
                    .from('planet_osm_line')
                    .where('line_id', p.nextLineId)
                    .first();

                if (line) {
                    const coordinates = JSON.parse(line.linestring).coordinates;

                    p.trail = coordinates.map((c) => (
                            { lat: c[1], lng: c[0] }
                        ));

                    return p;
                }
            }

            return p;
        }));

        response.header('content-type', 'application/json');
        response.send(JSON.stringify(routePoints));
    }
}
