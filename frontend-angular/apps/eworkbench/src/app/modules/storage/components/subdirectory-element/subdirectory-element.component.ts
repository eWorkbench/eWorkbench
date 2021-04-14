/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { DrivesService, FilesService } from '@app/services';
import { UserStore } from '@app/stores/user';
import { Directory, Drive, File, FilePayload, ModalCallback } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { AddFileModalComponent } from '../modals/add-file/add-file.component';
import { DeleteStorageDirectoryModalComponent } from '../modals/directory/delete/delete.component';
import { EditStorageDirectoryModalComponent } from '../modals/directory/edit/edit.component';
import { NewStorageDirectoryModalComponent } from '../modals/directory/new/new.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-subdirectory-element',
  templateUrl: './subdirectory-element.component.html',
  styleUrls: ['./subdirectory-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubdirectoryElementComponent implements OnInit {
  @ViewChild('collapseLabelTemplate', { static: true })
  public collapseLabelTemplate!: TemplateRef<any>;

  @Input()
  public storage!: Drive;

  @Input()
  public directory!: Directory;

  @Input()
  public files: File[] = [];

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Output()
  public refreshParentDirectory = new EventEmitter<void>();

  public loading = false;

  public directoryFiles?: File[] = [];

  public modalRef?: DialogRef;

  public constructor(
    public readonly filesService: FilesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly modalService: DialogService,
    private readonly userStore: UserStore,
    private readonly drivesService: DrivesService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService
  ) {}

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.initDetails();
    });

    this.initDetails();
  }

  public initDetails(): void {
    this.directoryFiles = this.files.filter(file => file.directory_id === this.directory.pk);
    this.directoryFiles = this.directoryFiles.map(file => {
      switch (file.mime_type) {
        case 'image/png': {
          file.icon_class = 'wb-image-file';
          break;
        }
        case 'image/jpeg': {
          file.icon_class = 'wb-image-file';
          break;
        }
        case 'image/tiff': {
          file.icon_class = 'wb-download';
          break;
        }
        case 'application/pdf': {
          file.icon_class = 'wb-pdf-file';
          break;
        }
        case 'application/octet-stream': {
          file.icon_class = 'wb-download';
          break;
        }
      }
      return file;
    });
    this.cdr.markForCheck();
  }

  public refreshDirectory(): void {
    this.cdr.markForCheck();
    this.refreshParentDirectory.emit();
  }

  public onOpenNewDirectoryModal(directory: Directory): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewStorageDirectoryModalComponent, {
      closeButton: false,
      data: { storage: this.storage, parent: directory },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.storage.sub_directories = [...this.storage.sub_directories, callback.data.newContent];
        this.refresh?.next(true);
      }
    });
  }

  public onOpenEditDirectoryModal(directory: Directory): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(EditStorageDirectoryModalComponent, {
      closeButton: false,
      data: { storage: this.storage, initialState: directory },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        const directories: Directory[] = [...this.storage.sub_directories];
        const index = directories.findIndex(item => item.pk === callback.data.newContent.pk);
        directories[index] = callback.data.newContent;
        this.storage.sub_directories = [...directories];
        this.refresh?.next(true);
        this.cdr.markForCheck();
      }
    });
  }

  public onOpenDeleteDirectoryModal(directory: Directory): void {
    const userStoreValue = this.userStore.getValue();
    /* istanbul ignore next */
    const skipTrashDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.['SkipDialog-RemoveDirectory']);

    if (skipTrashDialog) {
      this.deleteDirectory(directory.pk);
    } else {
      this.modalRef = this.modalService.open(DeleteStorageDirectoryModalComponent, {
        closeButton: false,
        data: { storage: this.storage, directory: directory },
      });
      /* istanbul ignore next */
      this.modalRef.afterClosed$
        .pipe(untilDestroyed(this), take(1))
        .subscribe((callback: ModalCallback) => this.onModalClose(directory, callback));
    }
  }

  public onModalClose(directory: Directory, callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      /* istanbul ignore next */
      const directories: Directory[] = [...this.storage.sub_directories];
      const index = directories.findIndex(item => item.pk === directory.pk);
      directories.splice(index, 1);
      this.storage.sub_directories = [...directories];
      this.cdr.markForCheck();
    }
  }

  public deleteDirectory(directoryId: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.drivesService
      .deleteDirectory(this.storage.pk, directoryId)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          const directories: Directory[] = [...this.storage.sub_directories];
          const index = directories.findIndex(item => item.pk === directoryId);
          directories.splice(index, 1);
          this.storage.sub_directories = [...directories];

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('storages.deleteDirectory.toastr.success')
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

  public onOpenAddFileModal(directory: Directory): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(AddFileModalComponent, {
      closeButton: false,
      width: '1000px',
      data: { directory: directory },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.files = [...this.files, callback.data.file];
        this.cdr.detectChanges();
        this.refreshParentDirectory.emit();
        this.refresh?.next(true);
      }
    });
  }

  public onUpload(event: Event, directory: Directory): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    /* istanbul ignore next */
    const files = (event.target as HTMLInputElement).files;
    /* istanbul ignore next */
    if (files?.length) {
      const reader = new FileReader();
      reader.onload = () => {
        const file: globalThis.File = files[0];

        const filePayload: FilePayload = {
          title: file.name,
          name: file.name,
          description: '',
          path: file,
          directory_id: directory.pk,
          projects: [...this.storage.projects],
        };

        this.filesService
          .add(filePayload)
          .pipe(untilDestroyed(this))
          .subscribe(
            /* istanbul ignore next */ file => {
              this.loading = false;
              this.files.push(file);
              this.cdr.markForCheck();
              this.refreshParentDirectory.emit();
              this.refresh?.next(true);
              this.translocoService
                .selectTranslate('storages.addFile.toastr.success')
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
      };
      reader.readAsBinaryString(files[0]);
    } else {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  public removeFile(file: File): void {
    const index = this.files.findIndex(item => item.pk === file.pk);
    this.files.splice(index, 1);
    this.cdr.markForCheck();
    this.initDetails();
  }
}
