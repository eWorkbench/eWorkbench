/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { DrivesService, FilesService } from '@app/services';
import type { Directory, Drive, File, FilePayload, ModalCallback } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, skip, take } from 'rxjs/operators';
import { AddFileModalComponent } from '../modals/add-file/add-file.component';
import { NewStorageDirectoryModalComponent } from '../modals/directory/new/new.component';
import { WebDavModalComponent } from '../modals/web-dav/web-dav.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-storage-element',
  templateUrl: './storage-element.component.html',
  styleUrls: ['./storage-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageElementComponent implements OnInit {
  @ViewChild('collapseLabelTemplate', { static: true })
  public collapseLabelTemplate!: TemplateRef<any>;

  @Input()
  public storage!: Drive;

  @Input()
  public collapsed = true;

  @Input()
  public withSidebar = false;

  @Input()
  public favoriteMarker = true;

  @Input()
  public restored = new EventEmitter<boolean>();

  public refresh = new EventEmitter<boolean>();

  public files: File[] = [];

  public rootDirectory?: Directory;

  public loading = false;

  public params = new HttpParams();

  public searchControl = this.fb.control<string | null>(null);

  public refreshSubdirectory = new EventEmitter<boolean>();

  public modalRef?: DialogRef;

  public constructor(
    public readonly drivesService: DrivesService,
    private readonly filesService: FilesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public ngOnInit(): void {
    this.refresh.pipe(untilDestroyed(this)).subscribe(collapsed => {
      this.collapsed = collapsed;
      if (!collapsed) {
        this.loadFiles();
      }
    });

    if (!this.collapsed) {
      this.loadFiles();
    }

    this.rootDirectory = this.storage.sub_directories.find(directory => directory.is_virtual_root)!;
    this.cdr.markForCheck();

    this.initSearch();
  }

  public initSearch(): void {
    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      if (value) {
        this.params = this.params.set('search', value);
        this.loadFiles();
        return;
      }

      this.params = this.params.delete('search');
      this.loadFiles();
    });
  }

  public onRestore(restored: boolean): void {
    if (restored) {
      this.restored.next(true);
    }
  }

  public loadFiles(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.params = this.params.set('drive', this.storage.pk);

    this.filesService
      .getList(this.params)
      .pipe(untilDestroyed(this))
      .subscribe(
        result => {
          this.files = result.data;
          this.loading = false;
          this.cdr.detectChanges();
          this.refreshSubdirectory.next(true);
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
    this.cdr.markForCheck();
  }

  public onOpenNewDirectoryModal(): void {
    this.modalRef = this.modalService.open(NewStorageDirectoryModalComponent, {
      closeButton: false,
      data: { storage: this.storage },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.storage.sub_directories = [...this.storage.sub_directories, callback.data.newContent];
        this.refreshSubdirectory.next(true);
      }
    });
  }

  public onOpenWebDavModal(): void {
    this.modalRef = this.modalService.open(WebDavModalComponent, {
      closeButton: false,
      data: { storage: this.storage },
    });
  }

  public onOpenAddFileModal(directory: Directory): void {
    this.modalRef = this.modalService.open(AddFileModalComponent, {
      closeButton: false,
      width: '1000px',
      data: { directory: directory },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.files.push(callback.data.file);
        this.refreshSubdirectory.next(true);
      }
    });
  }

  public onUpload(event: Event, directory: Directory): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    const files = (event.target as HTMLInputElement).files;

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
            file => {
              this.files.push(file);
              this.loading = false;
              this.cdr.markForCheck();
              this.refreshSubdirectory.next(true);
              this.translocoService
                .selectTranslate('storages.addFile.toastr.success')
                .pipe(untilDestroyed(this))
                .subscribe(success => {
                  this.toastrService.success(success);
                });
            },
            () => {
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
}
