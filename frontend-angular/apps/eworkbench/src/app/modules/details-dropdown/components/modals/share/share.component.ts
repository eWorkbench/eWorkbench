/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService } from '@app/services';
import { UserService, UserState } from '@app/stores/user';
import type { Contact, PrivilegesData, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { cloneDeep } from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { debounceTime, map, switchMap, take } from 'rxjs/operators';

interface FormShareContact {
  user: number | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-share-modal',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareModalComponent implements OnInit {
  public id: string = this.modalRef.data.id;

  public service: any = this.modalRef.data.service;

  public loading = false;

  public state = ModalState.Unchanged;

  public users: User[] = [];

  public element: any;

  public userInput$ = new Subject<string>();

  public form = this.fb.group<FormShareContact>({
    user: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get userPk() {
    return this.form.get('user').value;
  }

  // TODO: needs proper interface for return type.
  public get baseModelClone(): any {
    const clone = cloneDeep(this.element);

    delete clone.pk;
    delete clone.created_at;
    delete clone.created_by;
    delete clone.last_modified_at;
    delete clone.last_modified_by;
    delete clone.url;
    delete clone.display;
    delete clone.deleted;
    delete clone.version_number;

    clone.created_for = this.userPk;

    return clone;
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.initDetails();
  }

  public initSearchInput(): void {
    this.userInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(users => {
        if (users.length) {
          this.users = [...users];
          this.cdr.markForCheck();
        }
      });
  }

  public initDetails(): void {
    this.authService.user$
      .pipe(
        untilDestroyed(this),
        take(1),
        map((state: NonNullable<UserState>) => {
          const user = state.user!;

          return user;
        }),
        switchMap(user =>
          this.service.get(this.id, user.pk!).pipe(
            untilDestroyed(this),
            map((response: PrivilegesData<Contact>) => {
              this.element = response.data;
            })
          )
        )
      )
      .subscribe(
        () => {
          this.cdr.markForCheck();
        },
        () => {
          this.cdr.markForCheck();
        }
      );
  }

  public onShareContact(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .share(this.baseModelClone)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
          this.translocoService
            .selectTranslate('detailsDropdown.shareModal.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
