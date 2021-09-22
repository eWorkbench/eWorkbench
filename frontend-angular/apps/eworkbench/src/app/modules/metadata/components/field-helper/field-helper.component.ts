/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Metadata } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { isEqual } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'eworkbench-metadata-field-helper',
  templateUrl: './field-helper.component.html',
  styleUrls: ['./field-helper.component.scss'],
})
export class MetadataFieldHelperComponent implements OnInit {
  @Input()
  public parameter!: Metadata;

  @Input()
  public parametersCount = 0;

  @Input()
  public loading = false;

  @Input()
  public editable = false;

  @Output()
  public changed = new EventEmitter<Metadata>();

  @Output()
  public remove = new EventEmitter<string>();

  public cancelChanges = new EventEmitter<Metadata>();

  public initialValue!: Metadata;

  public deleted = false;

  public hasChanged = false;

  public constructor(private readonly translocoService: TranslocoService) {}

  public ngOnInit(): void {
    this.initFieldHelper();
  }

  public initFieldHelper(): void {
    if (!this.parameter.id) {
      this.parameter.id = uuidv4();
    }

    this.initialValue = { ...this.parameter };

    if (this.initialValue.added) {
      this.hasChanged = true;
    }
  }

  public onChanged(values?: any): void {
    const field: Metadata = { ...this.initialValue };

    if (this.deleted) {
      field.deleted = true;
    } else {
      field.added = Boolean(this.parameter.added);
    }

    if (values) {
      field.values = values;
    }

    if (!isEqual(this.initialValue.values, field.values)) {
      this.hasChanged = true;
    }

    this.changed.emit(field);
  }

  public showButtons(): boolean {
    return this.hasChanged && this.editable;
  }

  public onDelete(): void {
    this.deleted = true;
    this.hasChanged = true;
    this.onChanged();
  }

  public onCancel(): void {
    if (this.parameter.added) {
      this.remove.emit(this.parameter.id);
    } else {
      this.deleted = false;
      this.hasChanged = false;
      this.cancelChanges.next(this.initialValue);
    }
  }
}
