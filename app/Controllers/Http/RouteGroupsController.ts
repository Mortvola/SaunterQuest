// import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import RouteGroup from 'App/Models/RouteGroup';

export default class RouteGroupsController {
  // eslint-disable-next-line class-methods-use-this
  public async get() : Promise<RouteGroup[]> {
    return RouteGroup.all();
  }
}
