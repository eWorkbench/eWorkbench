/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PicturesService } from '@app/services';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { switchMap, take } from 'rxjs/operators';
import { UserService, UserStore } from '@app/stores/user';

interface FormConvertTiff {
  doNotShowMessageAgain: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-convert-tiff-modal',
  templateUrl: './convert-tiff.component.html',
  styleUrls: ['./convert-tiff.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConvertTiffModalComponent {
  public form = this.fb.group<FormConvertTiff>({
    doNotShowMessageAgain: [false],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly picturesService: PicturesService,
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly userStore: UserStore
  ) {}

  public get f(): FormGroup<FormConvertTiff>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public saveUserDialogSettings(): void {
    this.userService
      .get()
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(user => {
          return this.userService.changeSettings({
            userprofile: {
              ui_settings: {
                ...user.userprofile.ui_settings,
                confirm_dialog: {
                  ...user.userprofile.ui_settings?.confirm_dialog,
                  'SkipDialog-ConvertTiff': this.f.doNotShowMessageAgain.value,
                },
              },
            },
          });
        })
      )
      .subscribe(
        /* istanbul ignore next */ user => {
          this.userStore.update(() => ({ user }));
          this.translocoService
            .selectTranslate('picture.convertTiffModal.toastr.success.doNotShowMessageAgainUpdated')
            .pipe(untilDestroyed(this))
            .subscribe(doNotShowMessageAgainUpdated => {
              this.toastrService.success(doNotShowMessageAgainUpdated);
            });
        }
      );
  }
}
