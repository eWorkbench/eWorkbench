/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { ContactsService, ProjectsService } from '@app/services';
import { UserService } from '@app/stores/user';
import { Contact, ContactPayload, Project, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, mergeMap, switchMap } from 'rxjs/operators';

interface FormContact {
  copyProfile: any;
  academicTitle: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  projects: string[];
  duplicateMetadata: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-contact-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewContactModalComponent implements OnInit {
  public initialState?: Contact = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public duplicate?: string = this.modalRef.data?.duplicate;

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public users: User[] = [];

  public copyProfileInput$ = new Subject<string>();

  public notes = '';

  public form = this.fb.group<FormContact>({
    copyProfile: [null],
    academicTitle: [null],
    firstName: [null, [Validators.required]],
    lastName: [null, [Validators.required]],
    email: [null, [Validators.email]],
    phone: [null],
    company: [null],
    projects: [[]],
    duplicateMetadata: [true],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly contactsService: ContactsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService,
    private readonly userService: UserService
  ) {}

  public get f(): FormGroup<FormContact>['controls'] {
    return this.form.controls;
  }

  public get contact(): ContactPayload {
    return {
      academic_title: this.f.academicTitle.value ?? '',
      first_name: this.f.firstName.value!,
      last_name: this.f.lastName.value!,
      email: this.f.email.value ?? '',
      phone: this.f.phone.value ?? '',
      company: this.f.company.value ?? '',
      projects: this.f.projects.value,
      notes: this.notes,
      metadata: this.duplicate && this.f.duplicateMetadata.value ? this.initialState?.metadata : [],
    };
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.patchFormValues();
  }

  public initSearchInput(): void {
    this.projectInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(
        /* istanbul ignore next */ projects => {
          this.projects = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
      );

    this.copyProfileInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.users = [...users];
            this.cdr.markForCheck();
          }
        }
      );

    this.projectsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ projects => {
          if (projects.data.length) {
            this.favoriteProjects = [...projects.data];
            this.projects = [...this.projects, ...this.favoriteProjects]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          }
        }
      );
  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          academicTitle: this.initialState.academic_title,
          firstName: this.initialState.first_name,
          lastName: this.initialState.last_name,
          email: this.initialState.email,
          phone: this.initialState.phone,
          company: this.initialState.company,
          projects: this.initialState.projects,
        },
        { emitEvent: false }
      );

      /* istanbul ignore next */
      if (this.initialState.projects.length) {
        from(this.initialState.projects)
          .pipe(
            untilDestroyed(this),
            mergeMap(id =>
              this.projectsService.get(id).pipe(
                untilDestroyed(this),
                catchError(() => {
                  return of({ pk: id, name: this.translocoService.translate('formInput.unknownProject'), is_favourite: false } as Project);
                })
              )
            )
          )
          .subscribe(
            /* istanbul ignore next */ project => {
              this.projects = [...this.projects, project]
                .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
                .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
              this.cdr.markForCheck();
            }
          );
      }
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.contactsService
      .add(this.contact)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ contact => {
          this.state = ModalState.Changed;
          this.modalRef.close({
            state: this.state,
            data: { newContent: contact },
            navigate: [`${this.withSidebar ? '..' : ''}/contacts`, contact.pk],
          });
          this.translocoService
            .selectTranslate('contact.newModal.toastr.success')
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

  public changeCopyProfile(user?: User): void {
    if (user) {
      this.form.patchValue(
        {
          academicTitle: user.userprofile.academic_title,
          firstName: user.userprofile.first_name,
          lastName: user.userprofile.last_name,
          email: user.email,
          phone: user.userprofile.phone,
          company: user.userprofile.org_zug_mitarbeiter_lang?.join(', '),
        },
        { emitEvent: false }
      );

      if (user.userprofile.email_others?.length) {
        this.notes += '<ul>';
        user.userprofile.email_others.map(email => {
          this.notes += `<li>${email}</li>`;
        });
        this.notes += '</ul>';
      }
    } else {
      this.form.patchValue(
        {
          academicTitle: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
        },
        { emitEvent: false }
      );
      this.notes = '';
    }
  }
}
