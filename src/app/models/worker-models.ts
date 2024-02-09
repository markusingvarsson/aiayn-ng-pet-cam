import { DetectedObject } from './detected-object';

export interface WorkerResponseMessage {
  data: WorkerResponsePayload;
}

export type WorkerResponsePayload =
  | WorkerResponseModelLoadedPayload
  | WorkerResponsePredictionsPayload;

export interface WorkerResponseModelLoadedPayload {
  type: 'modelLoaded';
  success: boolean;
}
export interface WorkerResponsePredictionsPayload {
  type: 'predictions';
  predictions: DetectedObject[];
}

export interface WorkerRequestMessage {
  data: WorkerRequestPayload;
}

export type WorkerRequestPayload =
  | WorkerRequestLoadModelPayload
  | WorkerRequestPredictPayload;

export interface WorkerRequestLoadModelPayload {
  type: 'loadModel';
}
export interface WorkerRequestPredictPayload {
  type: 'predict';
  imageData: ImageData;
}
