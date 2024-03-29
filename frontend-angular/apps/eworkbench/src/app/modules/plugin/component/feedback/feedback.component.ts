/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { PluginsService } from '@app/services';
import type { PluginFeedbackPayload, User } from '@eworkbench/types';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface FormFeedback {
  subject: FormControl<string | null>;
  message: FormControl<string | null>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-plugin-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginFeedbackComponent {
  @Input()
  public id?: string;

  @Input()
  public type? = 'feedback';

  @Input()
  public responsibleUsers: User[] = [];

  @Output()
  public canceled = new EventEmitter<boolean>();

  public loading = false;

  public form = this.fb.group<FormFeedback>({
    subject: this.fb.control(null, Validators.required),
    message: this.fb.control(null, Validators.required),
  });

  public constructor(
    public readonly pluginsService: PluginsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public get f() {
    return this.form.controls;
  }

  private get feedback(): PluginFeedbackPayload {
    return {
      pluginPk: this.id!,
      subject: this.subject,
      message: this.f.message.value ?? '',
      type: this.type!,
    };
  }

  private get subject(): string {
    if (this.type === 'request_access') {
      return this.translocoService.translate('plugin.feedback.subject.requestAccess');
    }

    return this.f.subject.value ?? this.translocoService.translate('plugin.feedback.subject.giveFeedback');
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.pluginsService
      .feedback(this.feedback)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.toastrMessage();
          this.loading = false;
          this.onCancel();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onCancel(): void {
    if (this.loading) {
      return;
    }

    this.canceled.emit(true);
  }

  public toastrMessage(): void {
    if (this.type === 'request_access') {
      this.translocoService
        .selectTranslate('plugin.feedback.toastr.requestAccess.success')
        .pipe(untilDestroyed(this))
        .subscribe(success => {
          this.toastrService.success(success);
        });
    } else {
      this.translocoService
        .selectTranslate('plugin.feedback.toastr.giveFeedback.success')
        .pipe(untilDestroyed(this))
        .subscribe(success => {
          this.toastrService.success(success);
        });
    }
  }
}
