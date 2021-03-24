import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import GearItem from 'App/Models/GearItem';

export default class GearItemsController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, response }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const items = await auth.user.related('gearItems').query();

      response.send(items);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async updateItem({
    auth, request, params, response,
  }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const item = await GearItem.findOrFail(params.itemId);

      item.system = request.post().system;
      item.name = request.post().name;
      item.description = request.post().description;
      item.consumable = request.post().consumable;
      item.unitOfMeasure = request.post().unitOfMeasure;
      item.weight = request.post().weight;

      item.save();

      response.send(item);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async addItem({
    auth, request, response,
  }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const item = await GearItem.create({
        name: request.post().name,
        description: request.post().description,
        weight: request.post().weight,
        unitOfMeasure: request.post().unitOfMeasure,
        system: request.post().system,
        consumable: request.post().consumable,
        userId: auth.user.id,
      });

      response.send(item);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async deleteItem({
    auth, params,
  }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const item = await GearItem.findOrFail(params.itemId);

      item.delete();
    }
  }
}
