/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AfterViewInit, Component, ContentChild, EventEmitter, Input } from '@angular/core';
import { NgControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep, isEqual } from 'lodash-es';

@UntilDestroy()
@Component({
  selector: 'eworkbench-form-input',
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.scss'],
})
export class FormInputComponent implements AfterViewInit {
  @Input()
  public for!: string | null;

  @Input()
  public label?: string;

  @Input()
  public loading = false;

  @Input()
  public margin = true;

  @Input()
  public required = false;

  @Input()
  public onSubmit?: EventEmitter<boolean>;

  @ContentChild(NgControl)
  public ngControl?: NgControl;

  public resetValue!: any;

  public get showButtons(): boolean {
    return Boolean(this.ngControl?.dirty && !isEqual(this.ngControl.value, this.resetValue));
  }

  public ngAfterViewInit(): void {
    this.reset();

    /* istanbul ignore next */
    this.onSubmit?.pipe(untilDestroyed(this)).subscribe(() => this.reset());
  }

  public reset(): void {
    this.resetValue = cloneDeep(this.ngControl?.value);
  }

  public onCancel(): void {
    this.ngControl?.control?.setValue(this.resetValue, { emitEvent: false });
    this.ngControl?.control?.markAsPristine();
  }
}
