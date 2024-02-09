import { Observable } from 'rxjs';
import { DetectedObject } from './detected-object';

export interface PetMonitoring {
  initModel: () => void;
  requestPredictions: (
    imageData: ImageData,
    selectedItemCategory: string,
    selectedPetCategory: string
  ) => void;
  modelLoaded$: Observable<boolean>;
  naughtyAnimals$: Observable<DetectedObject[]>;
  nearbyAnimals$: Observable<DetectedObject[]>;
  objectsToMonitor$: Observable<DetectedObject[]>;
}
