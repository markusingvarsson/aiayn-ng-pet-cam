import { DatePipe, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BehaviorSubject } from 'rxjs';
import { AnimalCategory, availablePets } from '../../models/animal-category';
import { ItemCategory, availableItems } from '../../models/item-category';
import { Steps } from './models/steps';

import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { PetMonitorVideoComponent } from './components/pet-monitor-video/pet-monitor-video.component';
import { MatIconModule } from '@angular/material/icon';
import { DetectionEvent } from '../../models/detection-event';
import { MatDialog } from '@angular/material/dialog';
import { PetMonitorDialogComponent } from './components/pet-monitor-dialog/pet-monitor-dialog.component';

@Component({
  selector: 'app-pet-monitor',
  standalone: true,
  imports: [
    NgClass,
    MatStepperModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    PetMonitorVideoComponent,
    DatePipe,
  ],
  templateUrl: './pet-monitor.component.html',
  styleUrl: './pet-monitor.component.scss',
})
export class PetMonitorComponent {
  Steps = Steps;
  step$: BehaviorSubject<Steps> = new BehaviorSubject<Steps>(
    Steps.ActivateWebCamStep
  );

  availablePets: AnimalCategory[] = availablePets;
  avaibleItemsToMonitor: ItemCategory[] = availableItems;
  startingCamera: boolean = false;
  cameraMode: 'rear' | 'front' = 'front';

  selectedPetCategory: string = '';
  selectedItemCategory: string = '';

  detectionEvents: any[] = [];

  constructor(public dialog: MatDialog) {}

  onDetectionEventsChange(event: any[]) {
    this.detectionEvents = event;
  }

  showEvent(event: DetectionEvent) {
    this.dialog.open(PetMonitorDialogComponent, {
      data: event,
    });
  }

  startRearCamera() {
    this.startingCamera = true;
    this.cameraMode = 'rear';
  }

  startFrontCamera() {
    this.startingCamera = true;
    this.cameraMode = 'front';
  }
}
