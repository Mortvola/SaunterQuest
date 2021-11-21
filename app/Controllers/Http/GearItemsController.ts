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

      item.system = request.body().system;
      item.name = request.body().name;
      item.description = request.body().description;
      item.consumable = request.body().consumable;
      item.unitOfMeasure = request.body().unitOfMeasure;
      item.weight = request.body().weight;

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
        name: request.body().name,
        description: request.body().description,
        weight: request.body().weight,
        unitOfMeasure: request.body().unitOfMeasure,
        system: request.body().system,
        consumable: request.body().consumable,
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
