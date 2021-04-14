/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormArray } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-merge-duplicates-input-group',
  templateUrl: './merge-duplicates-input-group.component.html',
  styleUrls: ['./merge-duplicates-input-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MergeDuplicatesInputGroupComponent implements OnInit {
  @Input()
  public label!: string;

  @Input()
  public key!: string;

  @Input()
  public formGroup!: FormGroup;

  @Input()
  public fields!: FormArray<string>;

  @Input()
  public baseFormControlName!: string;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Input()
  public editor?: boolean = false;

  public selectedFieldIndex = 0;

  public constructor(public readonly translocoService: TranslocoService, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.cdr.markForCheck();
    });

    this.checkFieldStatus();
  }

  public onChangeFieldIndex(index: number): void {
    this.selectedFieldIndex = index;
    this.checkFieldStatus();
  }

  public checkFieldStatus(): void {
    this.fields.controls.forEach((control, index) => {
      index === this.selectedFieldIndex ? control.enable() : control.disable();
    });
    this.cdr.detectChanges();
  }
}
