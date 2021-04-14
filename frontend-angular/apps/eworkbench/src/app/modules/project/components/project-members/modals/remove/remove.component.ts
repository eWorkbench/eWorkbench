/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, ProjectsService, RolesService } from '@app/services';
import { ProjectMember, Role, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-remove-project-member-modal',
  templateUrl: './remove.component.html',
  styleUrls: ['./remove.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoveProjectMemberModalComponent implements OnInit {
  public projectId: string = this.modalRef.data.projectId;

  public member: ProjectMember = this.modalRef.data.member;

  public currentUser: User | null = null;

  public roles: Role[] = [];

  public state = ModalState.Unchanged;

  public loading = false;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly projectsService: ProjectsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly rolesService: RolesService
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

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

  public onInactive(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.projectsService
      .patchMember(this.projectId, this.member.pk, {
        pk: this.member.pk,
        role_pk: this.roles.find(role => role.name === 'No Access')!.pk,
      })
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

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.projectsService
      .deleteMember(this.projectId, this.member.pk)
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
