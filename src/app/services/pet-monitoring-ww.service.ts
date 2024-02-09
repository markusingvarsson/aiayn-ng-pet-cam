import { Injectable } from '@angular/core';
import { DetectedObject } from '../models/detected-object';
import { BBox } from '../models/bbox';
import { BehaviorSubject, Observable } from 'rxjs';
import { PetMonitoring } from '../models/pet-monitoring';
import {
  WorkerRequestLoadModelPayload,
  WorkerRequestPredictPayload,
  WorkerResponseMessage,
} from '../models/worker-models';

@Injectable({
  providedIn: 'root',
})
export class PetMonitoringWWService implements PetMonitoring {
  private worker!: Worker;

  #modelLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  get modelLoaded$() {
    return this.#modelLoaded.asObservable();
  }
  #predictions: DetectedObject[] = [];

  #naughtyAnimals: BehaviorSubject<DetectedObject[]> = new BehaviorSubject<
    DetectedObject[]
  >([]);
  get naughtyAnimals$() {
    return this.#naughtyAnimals.asObservable();
  }

  #nearbyAnimals: BehaviorSubject<DetectedObject[]> = new BehaviorSubject<
    DetectedObject[]
  >([]);
  get nearbyAnimals$() {
    return this.#nearbyAnimals.asObservable();
  }

  #objectsToMonitor: BehaviorSubject<DetectedObject[]> = new BehaviorSubject<
    DetectedObject[]
  >([]);
  get objectsToMonitor$() {
    return this.#objectsToMonitor.asObservable();
  }

  #selectedItemCategory: string = '';
  #selectedPetCategory: string = '';

  constructor() {
    this.worker = new Worker(
      new URL('../workers/object-detection.worker', import.meta.url)
    );
    this.worker.onmessage = ({ data }: WorkerResponseMessage) => {
      if (data.type === 'predictions') {
        this.#predictions = data.predictions;
        this.#findObjectsAndPets(
          this.#selectedItemCategory,
          this.#selectedPetCategory
        );
      }
      if (data.type === 'modelLoaded') {
        this.#modelLoaded.next(data.success);
      }
    };
  }

  initModel() {
    if (!this.#modelLoaded.value) {
      const request: WorkerRequestLoadModelPayload = { type: 'loadModel' };
      this.worker.postMessage(request);
    }
  }

  requestPredictions(
    imageData: ImageData,
    selectedItemCategory: string,
    selectedPetCategory: string
  ): void {
    if (!this.#modelLoaded.value) return;
    this.#selectedItemCategory = selectedItemCategory;
    this.#selectedPetCategory = selectedPetCategory;
    const request: WorkerRequestPredictPayload = { type: 'predict', imageData };
    this.worker.postMessage(request, [imageData.data.buffer]);
  }

  #findObjectsAndPets(
    selectedItemCategory: string,
    selectedPetCategory: string
  ) {
    this.#findObjects(selectedItemCategory);
    this.#findPets(selectedPetCategory, this.#objectsToMonitor.value);
  }

  #findObjects(selectedItemCategory: string) {
    const objectsToMonitor: DetectedObject[] = [];
    for (const detectedObject of this.#predictions) {
      if (
        selectedItemCategory === detectedObject.class &&
        detectedObject.score > 0.5
      ) {
        objectsToMonitor.push(detectedObject);
      }
    }

    this.#objectsToMonitor.next(objectsToMonitor);
  }

  #findPets(selectedPetCategory: string, monitoredObjects: DetectedObject[]) {
    const naughtyAnimals: DetectedObject[] = [];
    const nearbyAnimals: DetectedObject[] = [];

    for (const detectedObject of this.#predictions) {
      if (
        detectedObject.class === selectedPetCategory &&
        detectedObject.score > 0.5
      ) {
        for (const objectToMonitor of monitoredObjects) {
          if (this.#checkIfNear(objectToMonitor, detectedObject)) {
            naughtyAnimals.push(detectedObject);
            break; // Breaks the loop if the animal is found near any object
          }
        }

        nearbyAnimals.push(detectedObject);
      }
    }

    this.#naughtyAnimals.next(naughtyAnimals);
    this.#nearbyAnimals.next(nearbyAnimals);
  }

  // Check if 2 bounding boxes are within a distance of eachother.
  #checkIfNear(item1: DetectedObject, item2: DetectedObject, distance = 0) {
    const BOUNDING_BOX_1 = new BBox(item1.bbox);
    const BOUNDING_BOX_2 = new BBox(item2.bbox);
    return BOUNDING_BOX_1.distance(BOUNDING_BOX_2) <= distance;
  }
}
