import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DetectionEvent } from '../../../../models/detection-event';
import { DetectedObject } from '../../../../models/detected-object';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-pet-monitor-dialog',
  standalone: true,
  imports: [MatDialogModule, NgOptimizedImage],
  templateUrl: './pet-monitor-dialog.component.html',
  styleUrl: './pet-monitor-dialog.component.scss',
})
export class PetMonitorDialogComponent implements OnDestroy, AfterViewInit {
  @ViewChild('eventImage') eventImage!: ElementRef;

  imageUrl!: string;
  private boxElements: ElementRef[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DetectionEvent,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngAfterViewInit() {
    this.imageUrl = URL.createObjectURL(this.data.blob);

    this.data.monitoredObjects.forEach((prediction) => {
      this.renderFoundObject(prediction, 1, 1);
    });
    this.data.naughtyAnimals.forEach((prediction) => {
      this.renderFoundObject(prediction, 1, 1);
    });
  }

  ngOnDestroy(): void {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
  }

  renderFoundObject(
    prediction: DetectedObject,
    ratioX: number,
    ratioY: number
  ): void {
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

    const imageView = this.el.nativeElement.querySelector('#imageView');
    this.renderer.appendChild(imageView, highlighter);
    this.renderer.appendChild(imageView, p);

    this.boxElements.push(highlighter);
    this.boxElements.push(p);
  }

  clearPreviousBoundingBoxes(): void {
    this.boxElements.forEach((child) => {
      this.renderer.removeChild(
        this.el.nativeElement.querySelector('#imageView'),
        child
      );
    });
    this.boxElements = [];
  }
}
