import { ApplicationContract } from '@ioc:Adonis/Core/Application';
import { types } from 'pg';
import PublicIPChecker from './PublicIPChecker/PublicIPChecker';

export default class AppProvider {
	public static needsApplication = true

	constructor(protected app: ApplicationContract) {
	  types.setTypeParser(20, (val) => (
	    parseInt(val)
	  ));
	}

	public register() {
	  // Register your own bindings
	  this.app.container.singleton('PublicIPChecker', () => {
		  return new PublicIPChecker();
		});
	}

	public async boot() {
	  // IoC container is ready
	}

	public async ready() {
	  // App is ready
	  import('@ioc:PublicIPChecker');
	}

	public async shutdown() {
	  // Cleanup, since app is going down
	}
}
