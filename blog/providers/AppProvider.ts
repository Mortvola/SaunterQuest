import { IocContract } from '@adonisjs/fold'
import { types } from 'pg';

export default class AppProvider {
  constructor (protected $container: IocContract) {
    types.setTypeParser(20, (val) => (
      parseInt(val)
    ));
  }

  public register () {
    // Register your own bindings
  }

  public boot () {
    // IoC container is ready
  }

  public shutdown () {
    // Cleanup, since app is going down
  }

  public ready () {
    // App is ready
  }
}
