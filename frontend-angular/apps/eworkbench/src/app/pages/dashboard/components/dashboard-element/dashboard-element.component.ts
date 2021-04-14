/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { switchMap, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-dashboard-element',
  templateUrl: './dashboard-element.component.html',
  styleUrls: ['./dashboard-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardElementComponent implements OnInit {
  @Input()
  public loading = false;

  @Input()
  public elementName = 'unknown_element';

  @Output()
  public collapseChange = new EventEmitter<boolean>();

  @Input()
  public collapseable = false;

  public collapsed = false;

  public constructor(
    public authService: AuthService,
    public userService: UserService,
    private readonly cdr: ChangeDetectorRef,
    private readonly userStore: UserStore,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService
  ) {}

  public ngOnInit(): void {
    if (this.collapseable) {
      this.authService.user$.pipe(untilDestroyed(this), take(1)).subscribe(state => {
        this.collapsed = state.user?.userprofile.ui_settings?.dashboard_elements?.[this.elementName]?.collapsed ?? false;
        this.cdr.markForCheck();
      });
    }
  }

  public onCollapse(): void {
    this.collapsed = !this.collapsed;

    this.authService.user$
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(
          /* istanbul ignore next */ state => {
            const currentUser = state.user;

            return this.userService.changeSettings({
              userprofile: {
                ui_settings: {
                  ...currentUser?.userprofile.ui_settings,
                  dashboard_elements: {
                    ...currentUser?.userprofile.ui_settings?.dashboard_elements,
                    [this.elementName]: {
                      collapsed: this.collapsed,
                    },
                  },
                },
              },
            });
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ user => {
          this.userStore.update(() => ({ user }));
          this.translocoService
            .selectTranslate('dashboard.elements.toastr.success.updated')
            .pipe(untilDestroyed(this))
            .subscribe(updated => {
              this.toastrService.success(updated);
            });
          this.collapseChange.emit(this.collapsed);
        }
      );
  }
}
