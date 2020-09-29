import User from 'App/Models/User';
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import jwt from 'jsonwebtoken';
import Mail from '@ioc:Adonis/Addons/Mail';
import Env from '@ioc:Adonis/Core/Env';
import Logger from '@ioc:Adonis/Core/Logger';

export default class AuthController {
  public async register ({ request }: HttpContextContract) {
    /**
     * Validate user details
     */
    const validationSchema = schema.create({
      email: schema.string({ trim: true }, [
        rules.email(),
        rules.unique({ table: 'users', column: 'email' }),
      ]),
      password: schema.string({ trim: true }, [
        rules.confirmed(),
      ]),
    })

    const userDetails = await request.validate({
      schema: validationSchema,
    })

    /**
     * Create a new user
     */
    const user = new User()
    user.email = userDetails.email
    user.password = userDetails.password
    await user.save()

    return 'Your account has been created'
  }

  public async login ({ auth, request, response }: HttpContextContract) {
    const username = request.input('username')
    const password = request.input('password')
    await auth.attempt(username, password)

    response.header('content-type', 'application/json');
    response.send(JSON.stringify('/'));
  }

  static generateSecret(user: User) {
      return user.password + '-' + user.createdAt.toMillis();
  }

  static generateToken(user: User) {
    const expiresIn = parseInt(Env.get('PASSWORD_RESET_TOKEN_EXPIRATION') as string, 10) * 60;
    return jwt.sign({ id: user.id }, AuthController.generateSecret(user), { expiresIn });
  }

  public async forgotPassword({ request, response }: HttpContextContract) {
    const email = request.input('email');
    const user = await User.findBy('email', email);

    if (user) {
        const token = AuthController.generateToken(user);

        const url = `${Env.get('APP_URL') as string}/password/reset/${user.id}/${token}`;

        Mail.send((message) => {
        message
            .from(Env.get('MAIL_FROM_ADDRESS') as string, Env.get('MAIL_FROM_NAME') as string)
            .to(user.email)
            .subject('Reset Password Notification')
            .htmlView('emails/reset-password', { url, expires: Env.get('PASSWORD_RESET_TOKEN_EXPIRATION') })
        });

        response.header('content-type', 'application/json');
        response.send(JSON.stringify('We have e-mailed your password reset link!'));
    }
  }

  public async resetPassword({ params, view }) {
      const user = await User.find(params.id);

      if (user) {
        const payload = jwt.verify(params.token, AuthController.generateSecret(user));

        if (payload.id === params.id) {
            return view.render('reset-password', { user, token: params.token });
        }

        Logger.error(`Invalid payload in token for user ${user.username}`);
      }
  }

  public async updatePassword({ request, response, view }) {
    const email = request.input('email');
    const password = request.input('password');
    const passwordConfirmation = request.input('passwordConfirmation');
    const token = request.input('token');

    const user = await User.findBy('email', email);

    if (!user) {
        return view.render('reset-password', { user, token, errorMessage: 'The user could not be found.' });
    }

    if (password !== passwordConfirmation) {
        return view.render('reset-password', { user, token, errorMessage: 'The passwords do not match.' });
    }

    let payload = { id: null };

    try {
        payload = jwt.verify(token, AuthController.generateSecret(user));
    }
    catch(error) {
    }

    if (payload.id !== user.id) {
        return view.render('reset-password', { user, token, errorMessage: 'The token is no longer valid.' });
    }

    user.password = password;
    await user.save()

    response.redirect('/');
  }
}
