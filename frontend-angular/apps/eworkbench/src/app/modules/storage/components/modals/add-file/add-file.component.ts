/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, FilesService } from '@app/services';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import { Directory, User, File } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, skip } from 'rxjs/operators';

@UntilDestroy(this)
@Component({
  selector: 'eworkbench-add-file-modal',
  templateUrl: './add-file.component.html',
  styleUrls: ['./add-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFileModalComponent implements OnInit {
  public directory?: Directory = this.modalRef.data?.directory;

  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('nameCellTemplate', { static: true })
  public nameCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', { static: true })
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', { static: true })
  public createdByCellTemplate!: TemplateRef<any>;

  public loading = false;

  public currentUser: User | null = null;

  public listColumns!: TableColumn[];

  public searchControl = this.fb.control<string | null>(null);

  public params = new HttpParams();

  public selectedFile?: File;

  public state = ModalState.Unchanged;

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly filesService: FilesService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    if (this.currentUser?.pk) {
      this.params = this.params.set('recently_modified_by_me', this.currentUser.pk.toString());
    }

    this.initTranslations();
    this.initSearch();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('files.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.nameCellTemplate,
            name: column.name,
            key: 'name',
            sortable: true,
          },
          {
            cellTemplate: this.createdAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
          {
            cellTemplate: this.createdByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
        ];
      });
  }

  public initSearch(): void {
    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.params = this.params.delete('recently_modified_by_me');
          this.params = this.params.set('search', value);
        } else {
          if (this.currentUser?.pk) {
            this.params = this.params.set('recently_modified_by_me', this.currentUser.pk.toString());
          }
          this.params = this.params.delete('search');
        }
        this.tableView.loadData(false, this.params);
      }
    );
  }

  public get file(): any {
    return {
      pk: this.selectedFile?.pk,
      directory_id: this.directory?.pk,
    };
  }

  public selectFile(file: File): void {
    this.selectedFile = file;
  }

  public onSubmit(): void {
    if (this.selectedFile) {
      if (this.loading) {
        return;
      }
      this.loading = true;

      this.filesService
        .patch(this.selectedFile.pk, this.file)
        .pipe(untilDestroyed(this))
        .subscribe(
          /* istanbul ignore next */ file => {
            this.state = ModalState.Changed;
            this.modalRef.close({ state: this.state, data: { file: file } });
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
    }
  }
}
