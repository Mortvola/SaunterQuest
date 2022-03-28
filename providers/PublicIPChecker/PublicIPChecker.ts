import Logger from '@ioc:Adonis/Core/Logger'
import { CronJob } from 'cron';

class PublicIPChecker {
    publicIp: string | null = null;

    cronJob: CronJob;

    constructor() {
        this.cronJob = new CronJob('0 * * * *', () => this.checkPublicIP());
    
        this.cronJob.start();
        this.checkPublicIP();
    }

    async checkPublicIP() {
        try {
            const { default: Mail } = await import("@ioc:Adonis/Addons/Mail");
            const { default: Env } = await import("@ioc:Adonis/Core/Env");
            const { default: publicIp } = await import('public-ip');

            Logger.info('Checking public IP');

            const ip = await publicIp.v4();
            if (ip !== this.publicIp) {
                Mail.send((message) => {
                    message
                        .from(Env.get('MAIL_FROM_ADDRESS'), Env.get('MAIL_FROM_NAME'))
                        .to('shields12345@msn.com')
                        .subject('Public IP Notification')
                        .htmlView('emails/public-ip', { publicIP: ip });
                });
                this.publicIp = ip;
            }
        }
        catch (error) {
            Logger.error(error, 'public IP check failed');
        }
    }
}

export default PublicIPChecker;