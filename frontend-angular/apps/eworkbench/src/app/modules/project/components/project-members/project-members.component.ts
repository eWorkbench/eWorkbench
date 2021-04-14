/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, ProjectsService, RolesService } from '@app/services';
import { TableColumn } from '@eworkbench/table';
import { ModalCallback, ProjectMember, ProjectPrivileges, Role, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormArray, FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { ChangeProjectMemberRoleModalComponent } from './modals/change-role/change-role.component';
import { ExternalUserModalComponent } from './modals/external-user/external-user.component';
import { NewProjectMemberModalComponent } from './modals/new/new.component';
import { RemoveProjectMemberModalComponent } from './modals/remove/remove.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-project-members',
  templateUrl: './project-members.component.html',
  styleUrls: ['./project-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMembersComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public projectPrivileges!: ProjectPrivileges;

  @ViewChild('userCellTemplate', { static: true })
  public userCellTemplate!: TemplateRef<any>;

  @ViewChild('selectCellTemplate', { static: true })
  public selectCellTemplate!: TemplateRef<any>;

  public refreshResetValue = new EventEmitter<boolean>();

  public currentUser: User | null = null;

  public listColumns!: TableColumn[];

  public data: ProjectMember[] = [];

  public roles: Role[] = [];

  public expanded = new Set<string>();

  public loading = false;

  public modalRef?: DialogRef;

  public form = this.fb.group<Record<any, any>>({
    roles: this.fb.array([]),
  });

  private readonly order = ['Project Manager', 'Project Member', 'Observer', 'No Access'];

  public constructor(
    private readonly router: Router,
    private readonly modalService: DialogService,
    private readonly fb: FormBuilder,
    private readonly projectService: ProjectsService,
    private readonly rolesService: RolesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService
  ) {}

  public get f(): FormGroup['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get fRoles(): FormArray<string> {
    return this.form.get('roles') as FormArray<string>;
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.listColumns = [
      {
        cellTemplate: this.userCellTemplate,
        name: '',
        key: 'user',
      },
      {
        cellTemplate: this.selectCellTemplate,
        name: '',
        key: 'select2',
        hideable: false,
      },
    ];

    this.loading = true;

    this.initMembers();
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

  public initMembers(): void {
    this.projectService
      .getMembers(this.id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ members => {
          this.loading = false;
          if (this.fRoles.length) {
            this.fRoles.clear();
          }
          members = members.sort((a, b) => this.order.indexOf(a.role.name) - this.order.indexOf(b.role.name));
          for (const member of members) {
            this.fRoles.push(this.fb.control(member.role_pk));
          }
          this.data = [...members];

          if (!this.projectPrivileges.editRoles) {
            this.form.disable({ emitEvent: false });
          }

          this.cdr.markForCheck();
        }
      );
  }

  public onExpandChange(data: ProjectMember, expanded: boolean): void {
    if (expanded) {
      this.expanded.add(data.pk);
    } else {
      this.expanded.delete(data.pk);
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.fRoles.controls.forEach((control, i) => {
      if (control.dirty) {
        this.projectService
          .patchMember(this.id, this.data[i].pk, { pk: this.data[i].pk, role_pk: control.value })
          .pipe(untilDestroyed(this))
          .subscribe(
            () => {
              this.loading = false;
              this.refreshResetValue.next(true);
              this.cdr.markForCheck();
            },
            () => {
              this.loading = false;
              this.cdr.markForCheck();
            }
          );
      }
    });
  }

  public openNewProjectMemberModal(id: string, users?: ProjectMember[]): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewProjectMemberModalComponent, {
      closeButton: false,
      data: { id, users, projectPrivileges: this.projectPrivileges },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openExternalUserModal(id: string): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(ExternalUserModalComponent, {
      closeButton: false,
      data: { id },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openRemoveProjectMemberModal(user: User): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(RemoveProjectMemberModalComponent, {
      closeButton: false,
      data: { projectId: this.id, member: this.data.find(member => member.user_pk === user.pk) },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openChangeProjectMemberRoleModal(user: User): void {
    if (user.pk === this.currentUser?.pk) {
      /* istanbul ignore next */
      this.modalService.open(ChangeProjectMemberRoleModalComponent, {
        closeButton: false,
      });
    }
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      this.initMembers();
    } else if (callback?.state === ModalState.Unchanged) {
      if (callback.data.external) {
        this.openExternalUserModal(callback.data.external);
      }
    }
  }
}
