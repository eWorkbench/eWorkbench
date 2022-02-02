/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommentsModalComponent } from '@app/modules/comment/components/modals/comments/comments.component';
import { AuthService, FilesService, LabBooksService, WebSocketService } from '@app/services';
import { File, FilePayload, LabBookElement, Lock, Privileges, User } from '@eworkbench/types';
import { DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { v4 as uuidv4 } from 'uuid';

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

interface FormFile {
  title: string | null;
  description: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardFileComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<File>;

  @Input()
  public section?: string;

  @Input()
  public editable? = false;

  @Input()
  public refreshElementRelations?: EventEmitter<{ model_name: string; model_pk: string }>;

  @Output()
  public removed = new EventEmitter<ElementRemoval>();

  @Output()
  public moved = new EventEmitter<ElementRemoval>();

  public currentUser: User | null = null;

  public initialState?: File;

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public loading = false;

  public uniqueHash = uuidv4();

  public refreshResetValue = new EventEmitter<boolean>();

  public form: FormGroup<FormFile> = this.fb.group<FormFile>({
    title: [null, [Validators.required]],
    description: [null],
  });

  public constructor(
    public readonly filesService: FilesService,
    private readonly labBooksService: LabBooksService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService
  ) {}

  public get f(): FormGroup<FormFile>['controls'] {
    return this.form.controls;
  }

  public get lockUser(): { ownUser: boolean; user?: User | undefined | null } {
    /* istanbul ignore next */
    if (this.lock) {
      if (this.lock.lock_details?.locked_by.pk === this.currentUser?.pk) {
        return { ownUser: true, user: this.lock.lock_details?.locked_by };
      }

      return { ownUser: false, user: this.lock.lock_details?.locked_by };
    }

    /* istanbul ignore next */
    return { ownUser: false, user: null };
  }

  private get file(): Omit<FilePayload, 'name' | 'path'> {
    return {
      title: this.f.title.value!,
      description: this.f.description.value ?? '',
    };
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initDetails();
    this.initPrivileges();

    this.websocketService.subscribe([{ model: 'file', pk: this.initialState!.pk }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ (data: any) => {
        /* istanbul ignore next */
        if (data.element_lock_changed?.model_pk === this.initialState!.pk) {
          this.lock = data.element_lock_changed;
          this.cdr.detectChanges();
        }
      }
    );

    /* istanbul ignore next */
    this.refreshElementRelations?.subscribe((event: { model_name: string; model_pk: string }) => {
      if (event.model_name === 'file' && event.model_pk === this.initialState!.pk) {
        this.refreshElementRelationsCounter();
      }
    });
  }

  public initDetails(): void {
    this.form.patchValue(
      {
        title: this.element.child_object.title,
        description: this.element.child_object.description,
      },
      { emitEvent: false }
    );

    this.initialState = { ...this.element.child_object };
  }

  public initPrivileges(): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.filesService
      .get(this.initialState!.pk, this.currentUser.pk)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ privilegesData => {
          const privileges = privilegesData.privileges;
          this.privileges = { ...privileges };

          if (!this.privileges.edit) {
            this.form.disable({ emitEvent: false });
          }

          this.cdr.markForCheck();
        }
      );
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.filesService
      .patch(this.initialState!.pk, this.file)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ file => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.filesService.unlock(this.initialState!.pk);
          }

          this.initialState = { ...file };
          this.form.markAsPristine();
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('file.details.toastr.success')
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

  public pendingChanges(): boolean {
    return this.form.dirty;
  }

  public onRemove(event: ElementRemoval): void {
    this.removed.emit(event);
  }

  public onMove(event: ElementRemoval): void {
    this.moved.emit(event);
  }

  public onOpenCommentsModal(): void {
    /* istanbul ignore next */
    this.modalService.open(CommentsModalComponent, {
      closeButton: false,
      width: '912px',
      data: { service: this.filesService, element: this.initialState, create: true },
    });
  }

  public refreshElementRelationsCounter(): void {
    this.labBooksService
      .getElement(this.id, this.element.pk)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ element => {
          this.element.num_related_comments = element.num_related_comments!;
          this.element.num_relations = element.num_relations!;
          this.cdr.markForCheck();
        }
      );
  }
}
