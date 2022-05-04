/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectsService, RolesService } from '@app/services';
import { UserService } from '@app/stores/user';
import type { ExternalUserPayload, Role } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';

interface FormExternalUser {
  email: FormControl<string | null>;
  message: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-external-user-project-member-modal',
  templateUrl: './external-user.component.html',
  styleUrls: ['./external-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalUserModalComponent implements OnInit {
  public id: string = this.modalRef.data.id;

  public state = ModalState.Unchanged;

  public loading = false;

  public roles: Role[] = [];

  public form = this.fb.group<FormExternalUser>({
    email: this.fb.control(null, Validators.required),
    message: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly projectsService: ProjectsService,
    private readonly userService: UserService,
    private readonly rolesService: RolesService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get externalUser(): ExternalUserPayload {
    return {
      email: this.f.email.value!,
      message: this.f.message.value ?? '',
    };
  }

  public ngOnInit(): void {
    this.rolesService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(roles => {
        this.loading = false;
        this.roles = [...roles];
        this.cdr.markForCheck();
      });
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.userService
      .inviteUser(this.externalUser)
      .pipe(
        untilDestroyed(this),
        switchMap(user =>
          this.projectsService.addMember(this.id, {
            role: this.roles.find(role => role.name === 'No Access')!,
            role_pk: this.roles.find(role => role.name === 'No Access')!.pk,
            user_pk: user.pk!,
          })
        )
      )
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
