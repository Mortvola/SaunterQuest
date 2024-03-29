import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Database from '@ioc:Adonis/Lucid/Database';
import GearConfiguration from 'App/Models/GearConfiguration';
import GearConfigurationItem from 'App/Models/GearConfigurationItem';

export default class GearConfigurationsController {
  // eslint-disable-next-line class-methods-use-this
  public async get({ auth, response }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const configs = await Database.query()
        .select(
          'gc.id',
          'gc.name',
          Database.raw(`
            COALESCE(sum(
              case worn
                when false then COALESCE(gi.weight, 0)
              end
              *
              case unit_of_measure
                when NULL then 28.3495
                when '' then 28.3495
                when 'oz' then 28.3495
                when 'lb' then 453.592
                when 'g' then 1
                when 'kg' then 1000
              end
              *
              gci.quantity), 0) as "packWeight"
          `),
          Database.raw(`
            COALESCE(sum(
              case worn
                when true then COALESCE(gi.weight, 0)
              end
              *
              case unit_of_measure
                when NULL then 28.3495
                when '' then 28.3495
                when 'oz' then 28.3495
                when 'lb' then 453.592
                when 'g' then 1
                when 'kg' then 1000
              end
              *
              gci.quantity), 0) as "wornWeight"
        `),
        )
        .from('gear_configurations as gc')
        .leftJoin('gear_configuration_items as gci', 'gci.gear_configuration_id', 'gc.id')
        .leftJoin('gear_items as gi', 'gi.id', 'gci.gear_item_id')
        .where('gc.user_id', auth.user.id)
        .groupBy('gc.id', 'gc.name');

      response.send(configs);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async getItems({ auth, params, response }: HttpContextContract) : Promise<void> {
    if (auth.user) {
      const config = await GearConfiguration.findOrFail(params.configId);

      const items = await config.related('gearConfigItems').query().preload('gearItem');

      response.send(items);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async deleteItem({ auth, params }: HttpContextContract): Promise<void> {
    if (auth.user) {
      const item = await GearConfigurationItem.findOrFail(params.itemId);

      item.delete();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async addItem({
    auth, request, params, response,
  }: HttpContextContract): Promise<void> {
    if (auth.user) {
      const item = await GearConfigurationItem.create({
        gearConfigurationId: params.configId,
        gearItemId: request.body().gearItemId,
        quantity: request.body().quantity,
        worn: request.body().worn,
      });

      await item.load('gearItem');

      response.send(item);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async updateItem({
    auth, request, params, response,
  }: HttpContextContract): Promise<void> {
    if (auth.user) {
      const item = await GearConfigurationItem.findOrFail(params.itemId);

      item.worn = request.body().worn;
      item.quantity = request.body().quantity;

      item.save();

      response.send(item);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async update({
    auth, request, params, response,
  }: HttpContextContract): Promise<void> {
    if (auth.user) {
      const config = await GearConfiguration.findOrFail(params.configId);

      config.name = request.body().name;
      config.save();

      response.send(config);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async add({
    auth, response,
  }: HttpContextContract): Promise<void> {
    if (auth.user) {
      auth.user.gearConfigCounter = (auth.user.gearConfigCounter ?? 0) + 1;
      auth.user.save();

      const config = await GearConfiguration.create({
        name: `Configuration #${auth.user.gearConfigCounter}`,
        userId: auth.user.id,
      });

      response.send(config);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async delete({
    auth, params,
  }: HttpContextContract): Promise<void> {
    if (auth.user) {
      const config = await GearConfiguration.findOrFail(params.configId);

      config.delete();
    }
  }
}
