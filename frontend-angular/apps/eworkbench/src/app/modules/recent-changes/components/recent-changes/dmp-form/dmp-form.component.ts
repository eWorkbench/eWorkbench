/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { DMPFormsService } from '@app/services/dmp-forms/dmp-forms.service';
import type { DMPForm } from '@eworkbench/types';
import { UntilDestroy } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-recent-changes-dmp-form',
  templateUrl: './dmp-form.component.html',
  styleUrls: ['./dmp-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentChangesDMPFormComponent implements OnInit {
  @Input()
  public value!: string;

  public dmpForm?: DMPForm;

  public constructor(private readonly dmpFormsService: DMPFormsService, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.dmpFormsService
      .get(this.value)
      .pipe(
        map(dmpForm => {
          this.dmpForm = { ...dmpForm };
          this.cdr.markForCheck();
        })
      )
      .subscribe();
  }
}
