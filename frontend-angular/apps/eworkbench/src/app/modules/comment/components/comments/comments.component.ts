/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { NotesService, SitePreferencesService } from '@app/services';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';
import { DeepNonNullable } from 'utility-types';

interface FormComments {
  subject: string | null;
  content: string | null;
  projects: string[] | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsComponent implements OnInit {
  @Input()
  public service!: any;

  @Input()
  public id!: string;

  @Input()
  public contentType!: string;

  @Input()
  public projects: string[] = [];

  public data: any[] = [];

  public contentTypes: Record<string, number> = {};

  public state = ModalState.Unchanged;

  public loading = true;

  public form = this.fb.group<FormComments>({
    subject: [null, [Validators.required]],
    content: [null, [Validators.required]],
    projects: [[]],
  });

  public constructor(
    private readonly notesService: NotesService,
    private readonly sitePreferencesService: SitePreferencesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f(): FormGroup<FormComments>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get payload(): DeepNonNullable<FormComments> {
    return {
      subject: this.f.subject.value!,
      content: this.f.content.value ?? '',
      projects: this.projects,
    };
  }

  public ngOnInit(): void {
    this.initSitePreferences();
    this.initComments();
  }

  public initSitePreferences(): void {
    this.sitePreferencesService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (preferences: any) => {
          this.contentTypes = preferences.content_types;
          this.cdr.markForCheck();
        }
      );
  }

  public initComments(): void {
    this.service
      .getRelations(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (links: any) => {
          this.loading = false;
          this.data = links.filter((link: any) => link.left_content_type_model === 'shared_elements.note').reverse();
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
      .add(this.payload)
      .pipe(
        untilDestroyed(this),
        switchMap(note =>
          this.service.addRelation(this.id, {
            left_content_type: this.contentTypes['shared_elements.note'],
            left_object_id: note.pk,
            right_content_type: this.contentType,
            right_object_id: this.id,
          })
        )
      )
      .subscribe(
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.initComments();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
