/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { DrivesService } from '@app/services';
import { Directory, DirectoryPayload, Drive } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface FormDirectory {
  title: string | null;
  parent: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-storage-directory-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewStorageDirectoryModalComponent implements OnInit {
  public storage?: Drive = this.modalRef.data?.storage;

  public parent?: Directory = this.modalRef.data?.parent;

  public directories: Directory[] = [];

  public loading = false;

  public state = ModalState.Unchanged;

  public form = this.fb.group<FormDirectory>({
    title: [null, [Validators.required]],
    parent: [null],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly drivesService: DrivesService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.directories = this.storage!.sub_directories;

    if (this.parent) {
      this.f.parent.setValue(this.parent.pk);
    } else {
      this.parent = this.directories.find(directory => directory.is_virtual_root);
    }
  }

  public get f(): FormGroup<FormDirectory>['controls'] {
    return this.form.controls;
  }

  public get directory(): DirectoryPayload {
    return {
      name: this.f.title.value!,
      directory: this.f.parent.value!,
    };
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.drivesService
      .addDirectory(this.storage!.pk, this.directory)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ directory => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, data: { newContent: directory } });
          this.translocoService
            .selectTranslate('storages.newFolder.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
