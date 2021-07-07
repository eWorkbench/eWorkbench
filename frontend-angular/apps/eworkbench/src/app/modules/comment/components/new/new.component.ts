/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { AuthService } from '@app/services/auth/auth.service';
import { NotesService } from '@app/services/notes/notes.service';
import { NotePayload, RelationPayload, User } from '@eworkbench/types';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

interface FormComment {
  subject: string | null;
  content: string | null;
  private: boolean | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-comment',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewCommentComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public contentType!: number;

  @Input()
  public service!: any;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Output()
  public created = new EventEmitter<boolean>();

  public currentUser: User | null = null;

  public loading = false;

  public uniqueHash = uuidv4();

  public form: FormGroup<FormComment> = this.fb.group<FormComment>({
    subject: [null, [Validators.required]],
    content: [null],
    private: [false],
  });

  public constructor(
    private readonly notesService: NotesService,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f(): FormGroup<FormComment>['controls'] {
    return this.form.controls;
  }

  public get note(): NotePayload {
    return {
      subject: this.f.subject.value!,
      content: this.f.content.value ?? '',
    };
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.notesService
      .add(this.note)
      .pipe(
        untilDestroyed(this),
        switchMap(
          /* istanbul ignore next */ note => {
            const relationPayload: RelationPayload = {
              left_content_type: note.content_type,
              left_object_id: note.pk,
              right_content_type: this.contentType,
              right_object_id: this.id,
              private: this.f.private.value ?? false,
            };

            return this.service.addRelation(this.id, relationPayload).pipe(untilDestroyed(this));
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ () => {
          this.form.reset();
          this.form.markAsPristine();
          this.loading = false;
          this.created.emit();
          this.refresh?.next(true);
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );

    this.cdr.markForCheck();
  }
}
