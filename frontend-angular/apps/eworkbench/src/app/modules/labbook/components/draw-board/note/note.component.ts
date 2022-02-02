/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommentsModalComponent } from '@app/modules/comment/components/modals/comments/comments.component';
import { AuthService, LabBooksService, NotesService, WebSocketService } from '@app/services';
import { LabBookElement, Lock, Note, NotePayload, Privileges, User } from '@eworkbench/types';
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

interface FormNote {
  subject: string | null;
  content: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardNoteComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<Note>;

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

  public initialState?: Note;

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public loading = false;

  public uniqueHash = uuidv4();

  public refreshResetValue = new EventEmitter<boolean>();

  public form: FormGroup<FormNote> = this.fb.group<FormNote>({
    subject: [null, [Validators.required]],
    content: null,
  });

  public constructor(
    public readonly notesService: NotesService,
    private readonly labBooksService: LabBooksService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService
  ) {}

  public get f(): FormGroup<FormNote>['controls'] {
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

  private get note(): NotePayload {
    return {
      subject: this.f.subject.value!,
      content: this.f.content.value ?? '',
    };
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initDetails();
    this.initPrivileges();

    this.websocketService.subscribe([{ model: 'note', pk: this.initialState!.pk }]);
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
      if (event.model_name === 'note' && event.model_pk === this.initialState!.pk) {
        this.refreshElementRelationsCounter();
      }
    });
  }

  public initDetails(): void {
    this.form.patchValue(
      {
        subject: this.element.child_object.subject,
        content: this.element.child_object.content,
      },
      { emitEvent: false }
    );

    this.initialState = { ...this.element.child_object };
  }

  public initPrivileges(): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.notesService
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

    this.notesService
      .patch(this.initialState!.pk, this.note)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ note => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.notesService.unlock(this.initialState!.pk);
          }

          this.initialState = { ...note };
          this.form.markAsPristine();
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('note.details.toastr.success')
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
      data: { service: this.notesService, element: this.initialState, create: true },
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
