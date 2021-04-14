/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { TaskBoardsService } from '@app/services';
import { TaskBoard } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, skip, switchMap } from 'rxjs/operators';

interface FormTaskBoardBackground {
  backgroundImage: File | string | null;
  backgroundColor: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-background-modal',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackgroundModalComponent implements OnInit {
  public taskBoard: TaskBoard = this.modalRef.data.taskBoard;

  public state = ModalState.Unchanged;

  public loading = false;

  public form = this.fb.group<FormTaskBoardBackground>({
    backgroundImage: [null],
    backgroundColor: [null],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly taskBoardsService: TaskBoardsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f(): FormGroup<FormTaskBoardBackground>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.form.patchValue(
      {
        backgroundImage: this.taskBoard.download_background_image,
        backgroundColor: this.taskBoard.background_color,
      },
      { emitEvent: false }
    );

    this.f.backgroundColor.value$
      .pipe(
        untilDestroyed(this),
        skip(1),
        debounceTime(500),
        switchMap(color =>
          this.taskBoardsService.changeBackgroundColor(this.taskBoard.pk, color!).pipe(untilDestroyed(this), debounceTime(500))
        )
      )
      .subscribe();
  }

  public onUpload(event: Event): void {
    /* istanbul ignore next */
    const files = (event.target as HTMLInputElement).files;
    /* istanbul ignore next */
    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        this.form.patchValue({ backgroundImage: files[0] });
        this.f.backgroundImage.markAsDirty();
      };
      reader.readAsBinaryString(files[0]);
    }
  }

  public onClear(event?: Event): void {
    /* istanbul ignore next */
    event?.preventDefault();
    this.taskBoardsService.clearBackgroundImage(this.taskBoard.pk).subscribe(
      /* istanbul ignore next */ () => {
        this.state = ModalState.Changed;
        this.modalRef.close({ state: this.state });
      }
    );
  }

  public onColorChange(color: string): void {
    this.f.backgroundColor.setValue(color);
    this.f.backgroundColor.markAsDirty();
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    /* istanbul ignore next */
    if (this.f.backgroundImage.dirty && /* istanbul ignore next */ this.f.backgroundImage.value) {
      this.taskBoardsService
        .changeBackgroundImage(this.taskBoard.pk, this.f.backgroundImage.value)
        .pipe(untilDestroyed(this))
        .subscribe(
          /* istanbul ignore next */ () => {
            this.state = ModalState.Changed;
            this.modalRef.close({ state: this.state });
          }
        );
      /* istanbul ignore next */
    } else if (this.f.backgroundColor.dirty && /* istanbul ignore next */ this.f.backgroundColor.value) {
      this.taskBoardsService
        .changeBackgroundColor(this.taskBoard.pk, this.f.backgroundColor.value)
        .pipe(untilDestroyed(this))
        .subscribe(
          /* istanbul ignore next */ () => {
            this.state = ModalState.Changed;
            this.modalRef.close({ state: this.state });
          },
          /* istanbul ignore next */ () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    }
  }
}
