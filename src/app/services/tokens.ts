import { InjectionToken } from '@angular/core';
import { PetMonitoringWWService } from './pet-monitoring-ww.service';
import { PetMonitoring } from '../models/pet-monitoring';
import { PetMonitoringService } from './pet-monitoring.service';

export const PET_MONITORING_TOKEN = new InjectionToken<PetMonitoring>(
  'PET_MONITORING_TOKEN',
  {
    providedIn: 'root',
    factory: () =>
      typeof Worker !== 'undefined'
        ? new PetMonitoringWWService()
        : new PetMonitoringService(),
  }
);
