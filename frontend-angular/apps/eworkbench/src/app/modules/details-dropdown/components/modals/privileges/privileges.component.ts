/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AuthService, PrivilegesService } from '@app/services';
import { UserService } from '@app/stores/user';
import { TableColumn } from '@eworkbench/table';
import { Privileges, PrivilegesApi, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { debounceTime, map, skip, switchMap } from 'rxjs/operators';

interface InitialPrivileges {
  [key: number]: PrivilegesApi;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-privileges-modal',
  templateUrl: './privileges.component.html',
  styleUrls: ['./privileges.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivilegesModalComponent implements OnInit {
  public id: string = this.modalRef.data.id;

  public service: any = this.modalRef.data.service;

  public data: any = this.modalRef.data.data;

  public listColumns: TableColumn[] = [];

  public currentUser: User | null = null;

  public userPrivileges?: Privileges;

  public privileges: PrivilegesApi[] = [];

  public initialPrivileges: InitialPrivileges = {};

  public users: User[] = [];

  public usersInput$ = new Subject<string>();

  public loading = true;

  public readonly = true;

  public usersControl = this.fb.control<string | null>(null);

  @ViewChild('userCellTemplate', { static: true })
  public userCellTemplate!: TemplateRef<any>;

  @ViewChild('fullAccessButtonCellTemplate', { static: true })
  public fullAccessButtonCellTemplate!: TemplateRef<any>;

  @ViewChild('selectiveAccessButtonsCellTemplate', { static: true })
  public selectiveAccessButtonsCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly privilegesService: PrivilegesService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations();
    this.initPrivileges();
    this.initSearch();
    this.initSearchInput();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('detailsDropdown.privilegesModal.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.userCellTemplate,
            name: column.user,
            key: 'user',
          },
          {
            cellTemplate: this.fullAccessButtonCellTemplate,
            name: column.fullAccess,
            key: 'full_access',
          },
          {
            cellTemplate: this.selectiveAccessButtonsCellTemplate,
            name: column.selectiveAccess,
            key: 'selective_access',
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
          },
        ];
      });
  }

  public initPrivileges(): void {
    this.service
      .getUserPrivileges(this.id, this.currentUser?.pk, this.data.deleted)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ (privileges: Privileges) => {
            this.userPrivileges = { ...privileges };
            this.readonly = !privileges.fullAccess;
            this.cdr.markForCheck();
          }
        ),
        switchMap(() => {
          return this.service.getPrivilegesList(this.id).pipe(
            untilDestroyed(this),
            map(
              /* istanbul ignore next */ (privileges: PrivilegesApi[]) => {
                this.privileges = [...privileges];
                privileges.map(privilege => (this.initialPrivileges[privilege.user_pk] = cloneDeep(privilege)));
              }
            )
          );
        })
      )
      .subscribe(
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public initSearch(): void {
    this.usersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.addUser(value);
        }

        this.usersControl.patchValue(null);
        this.cdr.markForCheck();
      }
    );
  }

  public initSearchInput(): void {
    this.usersInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.users = cloneDeep(users);
            this.cdr.markForCheck();
          }
        }
      );
  }

  public addUser(userId: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .addUserPrivileges(this.id, userId)
      .pipe(
        untilDestroyed(this),
        map((privileges: PrivilegesApi) => {
          const privilegesList = cloneDeep(this.privileges);
          privilegesList.push(privileges);
          this.privileges = privilegesList;
          this.initialPrivileges[privileges.user_pk] = cloneDeep(privileges);
        })
      )
      .subscribe(
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('detailsDropdown.privilegesModal.addUser.toastr.success')
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

  public onChangePrivilege(
    privilegeKey: 'full_access_privilege' | 'view_privilege' | 'edit_privilege' | 'trash_privilege' | 'restore_privilege',
    userId: number
  ): void {
    if (this.loading) {
      return;
    }

    this.privileges.map(privilege => {
      if (privilege.user_pk === userId) {
        this.loading = true;
        privilege[privilegeKey] = this.getNextPrivilegeValue(privilege[privilegeKey]);
        this.service
          .putUserPrivileges(this.id, privilege.user_pk, privilege)
          .pipe(untilDestroyed(this))
          .subscribe(
            /* istanbul ignore next */ (p: PrivilegesApi) => {
              privilege.full_access_privilege = p.full_access_privilege;
              privilege.view_privilege = p.view_privilege;
              privilege.edit_privilege = p.edit_privilege;
              privilege.trash_privilege = p.trash_privilege;
              privilege.restore_privilege = p.restore_privilege;
              privilege.delete_privilege = p.delete_privilege;

              this.loading = false;
              this.cdr.markForCheck();
              this.translocoService
                .selectTranslate('detailsDropdown.privilegesModal.changePrivilege.toastr.success')
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
    });
  }

  public getNextPrivilegeValue(value: string): 'AL' | 'NE' | 'DE' {
    if (value === 'AL') {
      return 'DE';
    } else if (value === 'DE') {
      return 'AL';
    } else if (value === 'NE') {
      return 'AL';
    }
    return 'NE';
  }

  public onRestorePrivileges(userId: number): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    let restorePrivileges;
    if (userId in this.initialPrivileges) {
      restorePrivileges = {
        ...this.initialPrivileges[userId],
        delete_privilege: 'NE',
        edit_privilege: 'NE',
        full_access_privilege: 'NE',
        restore_privilege: 'NE',
        trash_privilege: 'NE',
        view_privilege: 'NE',
      };
    } else {
      return;
    }

    this.service
      .putUserPrivileges(this.id, userId, restorePrivileges)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (privileges: PrivilegesApi) => {
          const currentPrivileges = cloneDeep(this.privileges);
          currentPrivileges.map(privilege => {
            if (privilege.user_pk === userId) {
              privilege.full_access_privilege = privileges.full_access_privilege;
              privilege.view_privilege = privileges.view_privilege;
              privilege.edit_privilege = privileges.edit_privilege;
              privilege.trash_privilege = privileges.trash_privilege;
              privilege.restore_privilege = privileges.restore_privilege;
              privilege.delete_privilege = privileges.delete_privilege;
            }
          });
          this.privileges = [...currentPrivileges];

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('detailsDropdown.privilegesModal.privilegesRestored.toastr.success')
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

  public onDeleteUser(userId: number): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .deleteUserPrivileges(this.id, userId)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (privileges: PrivilegesApi[]) => {
          this.privileges = [...privileges];

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('detailsDropdown.privilegesModal.deleteUser.toastr.success')
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

  public getTooltip(privilegeKey: string): string | null {
    if (privilegeKey === 'full_access_privilege') {
      return this.translocoService.translate('detailsDropdown.privilegesModal.fullAccess.tooltip');
    } else if (privilegeKey === 'view_privilege') {
      return this.translocoService.translate('detailsDropdown.privilegesModal.view.tooltip');
    } else if (privilegeKey === 'edit_privilege') {
      return this.translocoService.translate('detailsDropdown.privilegesModal.edit.tooltip');
    } else if (privilegeKey === 'trash_privilege') {
      return this.translocoService.translate('detailsDropdown.privilegesModal.trash.tooltip');
    } else if (privilegeKey === 'restore_privilege') {
      return this.translocoService.translate('detailsDropdown.privilegesModal.restore.tooltip');
    }

    return null;
  }

  public canReset(privileges: PrivilegesApi): boolean {
    if (
      privileges.full_access_privilege === 'NE' &&
      privileges.view_privilege === 'NE' &&
      privileges.edit_privilege === 'NE' &&
      privileges.restore_privilege === 'NE' &&
      privileges.delete_privilege === 'NE'
    ) {
      return false;
    }

    return Boolean(privileges.pk);
  }
}
