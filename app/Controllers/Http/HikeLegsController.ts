import { Exception } from '@adonisjs/core/build/standalone';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { schema } from '@ioc:Adonis/Core/Validator';
import HikeLeg from 'App/Models/HikeLeg';

export default class HikeLegsController {
  // eslint-disable-next-line class-methods-use-this
  public async updateLeg({
    auth: {
      user,
    },
    request,
    params,
  }: HttpContextContract): Promise<void> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const requestData = await request.validate({
      schema: schema.create({
        name: schema.string(),
        startDate: schema.date.nullable(),
        color: schema.string(),
      }),
    });

    const leg = await HikeLeg.findOrFail(params.hikeLegId);

    leg.merge({
      name: requestData.name,
      startDate: requestData.startDate,
      color: requestData.color,
    });

    await leg.save();
  }

  // eslint-disable-next-line class-methods-use-this
  public async deleteLeg({
    auth: {
      user,
    },
    params,
  }: HttpContextContract): Promise<void> {
    if (!user) {
      throw new Exception('user unauthorized');
    }

    const leg = await HikeLeg.findOrFail(params.hikeLegId);
    await leg.delete();
  }
}
