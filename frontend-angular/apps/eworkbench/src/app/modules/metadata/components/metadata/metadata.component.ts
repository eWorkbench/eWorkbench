/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { MetadataService } from '@app/services';
import { DropdownElement, Metadata, MetadataField, ModalCallback } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { NewMetadataFieldComponent } from '../modals/new/new.component';

interface ParametersData {
  [id: string]: MetadataField;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-metadata',
  templateUrl: './metadata.component.html',
  styleUrls: ['./metadata.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataComponent implements OnInit {
  @Input()
  public loading = true;

  @Input()
  public editable = false;

  @Input()
  public selectedParameters: Metadata[] = [];

  @Input()
  public refresh? = new EventEmitter<boolean>();

  @Output()
  public changed = new EventEmitter<Metadata[]>();

  public dropListOrientation = 'vertical';

  public hasChanged = false;

  public parameters: DropdownElement[] = [];

  public parametersData: ParametersData = {};

  public parametersFormControl = new FormControl();

  public modalRef?: DialogRef;

  public constructor(
    private readonly metadataService: MetadataService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initMetadata();

    /* istanbul ignore next */
    this.refresh?.subscribe(() => {
      this.hideButtons();
    });
  }

  public initMetadata(autoSelect?: string): void {
    this.metadataService
      .getFields()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ fields => {
          const parametersData: ParametersData = {};
          const parameters: DropdownElement[] = [];

          fields.map(field => {
            parametersData[field.pk!] = field;
            parameters.push({ value: field.pk!, label: field.display! });
          });
          this.parametersData = parametersData;
          this.parameters = parameters;

          if (autoSelect) {
            this.onAdd(autoSelect);
          }

          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onAdd(id?: string, index?: number): void {
    const parameterId = id ?? this.parametersFormControl.value;
    if (parameterId) {
      const selectedParameters = [...this.selectedParameters];

      const parameter: Metadata = {
        added: true,
        field: parameterId,
        field_info: this.parametersData[parameterId],
      };

      if (index === undefined) {
        selectedParameters.push(parameter);
      } else {
        selectedParameters.splice(index, 0, parameter);
      }
      this.selectedParameters = selectedParameters;
    }
    this.parametersFormControl.patchValue(null);
    this.refreshOrdering();
  }

  public onRemove(id: string): void {
    const selectedParameters = [...this.selectedParameters];
    const newSelectedParameters = [];
    for (const parameter of selectedParameters) {
      if (parameter.id !== id) {
        newSelectedParameters.push(parameter);
      }
    }
    this.selectedParameters = newSelectedParameters;
    this.refreshOrdering();
  }

  public onElementDrop(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    this.hasChanged = true;
    this.refreshOrdering();
  }

  public refreshOrdering(): void {
    const selectedParameters = [...this.selectedParameters];
    let i = 1;
    for (const parameter of selectedParameters) {
      parameter.ordering = i++;
    }
    this.selectedParameters = selectedParameters;
    this.emitChanges();
  }

  public onChanged(field: Metadata): void {
    const parameters = [...this.selectedParameters];

    for (const parameter of parameters) {
      if (parameter.id === field.id) {
        parameter.deleted = field.deleted;
        parameter.values = field.values;
      }
    }

    this.selectedParameters = parameters;
    this.refreshOrdering();
  }

  public showButtons(): boolean {
    return this.hasChanged;
  }

  public onCancel(): void {
    // TODO: reset ordering
    this.hasChanged = false;
  }

  public hideButtons(): void {
    this.hasChanged = false;
  }

  public emitChanges(): void {
    const parameters: Metadata[] = [];
    this.selectedParameters.map(field => {
      if (!field.deleted) {
        parameters.push(field);
      }
    });

    this.changed.emit(parameters);
  }

  public openNewModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewMetadataFieldComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.initMetadata(callback.data);
      this.cdr.markForCheck();
    }
  }
}
