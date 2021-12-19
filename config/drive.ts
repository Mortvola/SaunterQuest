import { DriveConfig, DisksList } from '@ioc:Adonis/Core/Drive';
import Env from '@ioc:Adonis/Core/Env';

const driveConfig: DriveConfig = {
  disk: Env.get('DRIVE_DISK') as keyof DisksList,

  disks: {
    local: {
      driver: 'local',
      visibility: 'private',
      root: './',
    },
  },
};

export default driveConfig;
