/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { TaskBoardsService } from '@app/services';
import type { TaskBoard } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { lastValueFrom } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

interface FormTaskBoardSettings {
  backgroundImage: File | string | null;
  backgroundColor: string | null;
  transparency: number | null;
  minimalistic: boolean | null;
  dayIndication: boolean | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-settings-modal',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsModalComponent implements OnInit {
  public taskBoard: TaskBoard = this.modalRef.data.taskBoard;

  public userSettings = this.modalRef.data.userSettings;

  public loading = false;

  public filePlaceholder = this.translocoService.translate('taskBoard.settingsModal.file.placeholder');

  public fileCleared = false;

  public form = this.fb.group<FormTaskBoardSettings>({
    backgroundImage: null,
    backgroundColor: null,
    transparency: 100,
    minimalistic: false,
    dayIndication: true,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly taskBoardsService: TaskBoardsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.form.patchValue(
      {
        backgroundImage: this.taskBoard.download_background_image,
        backgroundColor: this.taskBoard.background_color,
        minimalistic: this.userSettings.restrict_task_information,
        dayIndication: this.userSettings.day_indication ?? true,
      },
      { emitEvent: false }
    );
  }

  public onUpload(event: Event): void {
    const files = (event.target as HTMLInputElement).files;

    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        this.filePlaceholder = files[0].name;
        this.form.patchValue({ backgroundImage: files[0] });
        this.f.backgroundImage.markAsDirty();
        this.cdr.markForCheck();
      };
      reader.readAsBinaryString(files[0]);
    }
  }

  public onClear(): void {
    this.fileCleared = true;
  }

  public onColorChange(color: string): void {
    this.f.backgroundColor.setValue(color);
    this.f.backgroundColor.markAsDirty();
  }

  public onTransparencyChange(value: number): void {
    this.f.transparency.setValue(value);
    this.f.transparency.markAsDirty();
  }

  public async onSubmit(): Promise<void> {
    if (this.loading) {
      return;
    }
    this.loading = true;

    if (this.f.backgroundImage.dirty && this.f.backgroundImage.value) {
      await lastValueFrom(
        this.taskBoardsService.changeBackgroundImage(this.taskBoard.pk, this.f.backgroundImage.value).pipe(untilDestroyed(this))
      );
    }

    if (this.fileCleared) {
      await lastValueFrom(this.taskBoardsService.clearBackgroundImage(this.taskBoard.pk).pipe(untilDestroyed(this)));
    }

    if (this.f.backgroundColor.dirty && this.f.backgroundColor.value) {
      await lastValueFrom(
        this.taskBoardsService
          .changeBoardSettings(this.taskBoard.pk, { background_color: this.f.backgroundColor.value })
          .pipe(untilDestroyed(this))
      );
    }

    if (this.f.transparency.dirty && this.f.transparency.value) {
      await lastValueFrom(
        this.taskBoardsService.changeColumnTransparency(this.taskBoard.pk, this.f.transparency.value / 100).pipe(untilDestroyed(this))
      );
    }

    await lastValueFrom(
      this.taskBoardsService.getUserSettings(this.taskBoard.pk).pipe(
        untilDestroyed(this),
        take(1),
        switchMap(([settings]) =>
          this.taskBoardsService.upsertUserSettings(
            this.taskBoard.pk,
            {
              ...settings,
              kanban_board_pk: this.taskBoard.pk,
              restrict_task_information: this.f.minimalistic.value,
              day_indication: this.f.dayIndication.value,
            },
            settings?.pk
          )
        )
      )
    );

    this.modalRef.close({ state: ModalState.Changed });
  }
}
