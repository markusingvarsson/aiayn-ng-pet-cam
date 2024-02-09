import { NgClass } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { combineLatest, startWith, pairwise, switchMap, of } from 'rxjs';
import {
  AnimalCategory,
  availablePets,
} from '../../../../models/animal-category';
import { ItemCategory, availableItems } from '../../../../models/item-category';

import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { DetectedObject } from '../../../../models/detected-object';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PetMonitoring } from '../../../../models/pet-monitoring';
import { PET_MONITORING_TOKEN } from '../../../../services/tokens';
import { DetectionEvent } from '../../../../models/detection-event';

@Component({
  selector: 'app-pet-monitor-video',
  standalone: true,
  imports: [
    NgClass,
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
  ],
  templateUrl: './pet-monitor-video.component.html',
  styleUrl: './pet-monitor-video.component.scss',
})
export class PetMonitorVideoComponent implements OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  private boxElements: ElementRef[] = [];

  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  @Output() detectionEventsChange: EventEmitter<any[]> = new EventEmitter<
    any[]
  >();

  availablePets: AnimalCategory[] = availablePets;
  avaibleItemsToMonitor: ItemCategory[] = availableItems;
  webcamLoaded: boolean = false;

  @Input() selectedPetCategory: string = '';
  @Input() selectedItemCategory: string = '';
  @Input() cameraMode: 'rear' | 'front' = 'front';
  sendAlerts = true;

  detectedObjects: string = '';

  detectionEvents: any[] = [];

  private lastFrameTime = 0;
  private frameIntervalMilliseconds = 200;
  private animationFrameId: number | null = null;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    @Inject(PET_MONITORING_TOKEN)
    private petMonitoringService: PetMonitoring,
    private destoyRef: DestroyRef
  ) {}

  ngOnDestroy(): void {
    this.stopVideoStream();
    this.cancelAnimationFrameLoop();
  }

  stopVideoStream() {
    const stream = this.videoElement.nativeElement.srcObject as MediaStream;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  }

  initializeCamera() {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => this.chooseCamera(devices))
      .catch((err) => console.error('Error enumerating devices', err));
  }

  chooseCamera(devices: MediaDeviceInfo[]) {
    const rearCamera: any = devices.find(
      (device) =>
        device.kind === 'videoinput' &&
        device.label.toLowerCase().includes('back') &&
        this.cameraMode === 'rear'
    );
    const constraints = {
      width: 640,
      height: 480,
      video: rearCamera ? { deviceId: { exact: rearCamera.deviceId } } : true,
    };

    this.activateWebcam(constraints);
  }

  activateWebcam(constraints: MediaStreamConstraints) {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        const video: HTMLVideoElement = this.videoElement.nativeElement;
        video.srcObject = stream;
        this.webcamLoaded = true;
      })
      .catch((err) => {
        this.webcamLoaded = false;
        console.error('Error accessing the webcam', err);
      });
  }

  ngAfterViewInit() {
    this.setupWebcamAndDetection();
    this.startAnimationFrameLoop();
  }

  setupWebcamAndDetection() {
    this.initializeCamera();
    this.petMonitoringService.initModel();

    this.petMonitoringService.modelLoaded$
      .pipe(
        switchMap((modelLoaded) => {
          if (!modelLoaded) return of([[], []]);
          return combineLatest([
            this.petMonitoringService.objectsToMonitor$.pipe(startWith([])),
            this.petMonitoringService.nearbyAnimals$.pipe(startWith([])),
          ]);
        })
      )
      .pipe(takeUntilDestroyed(this.destoyRef))
      .subscribe(([objects, animals]) => {
        this.clearPreviousBoundingBoxes();
        for (const child of [...objects, ...animals]) {
          this.renderFoundObject(child);
        }
      });

    this.petMonitoringService.modelLoaded$
      .pipe(
        switchMap((modelLoaded) => {
          if (!modelLoaded)
            return of([
              [[], []],
              [[], []],
            ]);
          return combineLatest([
            this.petMonitoringService.objectsToMonitor$.pipe(startWith([])),
            this.petMonitoringService.naughtyAnimals$.pipe(startWith([])),
          ]).pipe(pairwise());
        }),
        takeUntilDestroyed(this.destoyRef)
      )
      .subscribe(([[_, previousNaughtyAnimals], [objects, naughtyAnimals]]) => {
        if (
          naughtyAnimals.length > previousNaughtyAnimals.length &&
          this.sendAlerts
        ) {
          console.log('sendalerts incs');
          this.sendAlerts = false;
          this.sendAlert(objects, naughtyAnimals);
          setTimeout(() => {
            this.cooldown();
          }, 5 * 1000);
        }
      });
  }

  private startAnimationFrameLoop(): void {
    const animate = (time: number) => {
      if (time - this.lastFrameTime > this.frameIntervalMilliseconds) {
        this.predictWebcam();
        this.lastFrameTime = time;
      }
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private cancelAnimationFrameLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  predictWebcam() {
    if (
      this.videoElement.nativeElement.srcObject &&
      this.selectedItemCategory &&
      this.selectedPetCategory
    ) {
      const img = this.videoElement.nativeElement;

      // Check if the video is ready
      if (img.videoWidth === 0 || img.videoHeight === 0) {
        // Wait for the video to be ready and then try again
        console.log('retry');
        return;
      }

      const offScreenCanvas: HTMLCanvasElement =
        document.createElement('canvas');
      offScreenCanvas.width = img.videoWidth;
      offScreenCanvas.height = img.videoHeight;
      const ctx = offScreenCanvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);

      const imageData = ctx?.getImageData(
        0,
        0,
        img.videoWidth,
        img.videoHeight
      );

      if (imageData) {
        this.petMonitoringService.requestPredictions(
          imageData,
          this.selectedItemCategory,
          this.selectedPetCategory
        );
      }
    }
  }

  sendAlert(
    monitoredObjects: DetectedObject[],
    naughtyAnimals: DetectedObject[]
  ) {
    const tempDetectionEvent: Omit<DetectionEvent, 'blob'> = {
      dateTime: Date.now(),
      monitoredObjects,
      naughtyAnimals,
      ratioX:
        this.videoElement.nativeElement.clientWidth /
        this.videoElement.nativeElement.videoWidth,
      ratioY:
        this.videoElement.nativeElement.clientHeight /
        this.videoElement.nativeElement.videoHeight,
    };
    console.log(tempDetectionEvent);
    this.toBlob(tempDetectionEvent);
  }

  cooldown() {
    this.sendAlerts = true;
    console.log('cooled down!');
  }

  toBlob(tempDetectionEvent: Omit<DetectionEvent, 'blob'>) {
    this.canvas.nativeElement
      .getContext('2d')
      ?.drawImage(this.videoElement.nativeElement, 0, 0);
    this.canvas.nativeElement.toBlob((blob) => {
      if (!blob) return;
      const detectionEvent: DetectionEvent = { ...tempDetectionEvent, blob };
      this.detectionEvents.push(detectionEvent);
      this.detectionEventsChange.emit(this.detectionEvents);

      console.log(blob);
    }, 'image/png');
  }

  renderFoundObject(prediction: DetectedObject): void {
    const ratioX =
      this.videoElement.nativeElement.clientWidth /
      this.videoElement.nativeElement.videoWidth;
    const ratioY =
      this.videoElement.nativeElement.clientHeight /
      this.videoElement.nativeElement.videoHeight;

    const p = this.renderer.createElement('p');
    this.renderer.setProperty(
      p,
      'innerText',
      `${prediction.class} - with ${Math.round(
        parseFloat(`${prediction.score}`) * 100
      )}% confidence.`
    );
    this.renderer.setStyle(p, 'left', `${prediction.bbox[0] * ratioX}px`);
    this.renderer.setStyle(p, 'top', `${prediction.bbox[1] * ratioY}px`);
    this.renderer.setStyle(p, 'width', `${prediction.bbox[2] * ratioX - 10}px`);

    const highlighter = this.renderer.createElement('div');
    this.renderer.addClass(highlighter, 'highlighter');
    this.renderer.setStyle(
      highlighter,
      'left',
      `${prediction.bbox[0] * ratioX}px`
    );
    this.renderer.setStyle(
      highlighter,
      'top',
      `${prediction.bbox[1] * ratioY}px`
    );
    this.renderer.setStyle(
      highlighter,
      'width',
      `${prediction.bbox[2] * ratioX}px`
    );
    this.renderer.setStyle(
      highlighter,
      'height',
      `${prediction.bbox[3] * ratioY}px`
    );

    const liveView = this.el.nativeElement.querySelector('#liveView');
    this.renderer.appendChild(liveView, highlighter);
    this.renderer.appendChild(liveView, p);

    this.boxElements.push(highlighter);
    this.boxElements.push(p);
  }

  clearPreviousBoundingBoxes(): void {
    this.boxElements.forEach((child) => {
      this.renderer.removeChild(
        this.el.nativeElement.querySelector('#liveView'),
        child
      );
    });
    this.boxElements = [];
  }
}
