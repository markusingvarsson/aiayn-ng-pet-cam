import { DetectedObject } from './detected-object';

export interface DetectionEvent {
  blob: Blob;
  dateTime: number;
  monitoredObjects: DetectedObject[];
  naughtyAnimals: DetectedObject[];
  ratioX: number;
  ratioY: number;
}
