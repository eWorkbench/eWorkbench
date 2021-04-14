/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectsService, RolesService } from '@app/services';
import { UserService } from '@app/stores/user';
import { ProjectMember, ProjectMemberPayload, ProjectPrivileges, Role, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of, Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

interface FormProjectMember {
  assignee: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-project-member-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectMemberModalComponent implements OnInit {
  public id: string = this.modalRef.data.id;

  public users: ProjectMember[] = this.modalRef.data.users ?? [];

  public projectPrivileges: ProjectPrivileges = this.modalRef.data.projectPrivileges;

  public state = ModalState.Unchanged;

  public loading = false;

  public assignees: User[] = [];

  public assigneesInput$ = new Subject<string>();

  public roles: Role[] = [];

  public form = this.fb.group<FormProjectMember>({
    assignee: [null],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly projectsService: ProjectsService,
    private readonly userService: UserService,
    private readonly rolesService: RolesService,
    private readonly modalService: DialogService
  ) {}

  public get f(): FormGroup<FormProjectMember>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get projectMember(): ProjectMemberPayload {
    return {
      role: this.roles.find(role => role.name === 'No Access')!,
      role_pk: this.roles.find(role => role.name === 'No Access')!.pk,
      user_pk: this.f.assignee.value!,
    };
  }

  public ngOnInit(): void {
    this.assigneesInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          const selectedUsers = this.users.map(user => user.user_pk);
          const filteredUsers = users.filter(user => !selectedUsers.includes(user.pk!));
          if (filteredUsers.length) {
            this.assignees = [...filteredUsers];
            this.cdr.markForCheck();
          }
        }
      );

    this.rolesService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ roles => {
          this.loading = false;
          this.roles = [...roles];
          this.cdr.markForCheck();
        }
      );
  }

  public openExternalUserModal(id: string, event?: Event): void {
    /* istanbul ignore next */
    event?.preventDefault();
    /* istanbul ignore next */
    this.state = ModalState.Unchanged;
    this.modalRef.close({ state: this.state, data: { external: id } });
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.projectsService
      .addMember(this.id, this.projectMember)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
