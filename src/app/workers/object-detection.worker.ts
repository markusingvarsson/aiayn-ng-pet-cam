/// <reference lib="webworker" />

import { detect, loadCocoSSD } from '../machine-learning/cocossd';
import {
  WorkerRequestMessage,
  WorkerResponseModelLoadedPayload,
  WorkerResponsePredictionsPayload,
} from '../models/worker-models';

let cocossdModel: unknown;

addEventListener('message', async ({ data }: WorkerRequestMessage) => {
  switch (data.type) {
    case 'loadModel':
      const { model, success } = await loadCocoSSD();
      cocossdModel = model;
      const loadModelResponse: WorkerResponseModelLoadedPayload = {
        type: 'modelLoaded',
        success,
      };
      postMessage(loadModelResponse);
      break;
    case 'predict':
      const predictions = await detect(cocossdModel, data.imageData);
      const predictionsResponse: WorkerResponsePredictionsPayload = {
        type: 'predictions',
        predictions,
      };
      postMessage(predictionsResponse);
      break;
    default:
      break;
  }
});
