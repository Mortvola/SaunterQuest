import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { types } from 'pg';

export default class AppProvider {
	public static needsApplication = true

  constructor (protected app: ApplicationContract) {
    types.setTypeParser(20, (val) => (
      parseInt(val)
    ));
  }

  public register () {
    // Register your own bindings
  }

  public async boot () {
    // IoC container is ready
  }

  public async ready () {
    // App is ready
  }

  public async shutdown () {
    // Cleanup, since app is going down
  }
}
