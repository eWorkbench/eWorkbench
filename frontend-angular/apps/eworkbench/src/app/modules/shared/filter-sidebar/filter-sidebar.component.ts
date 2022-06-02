/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CMSService } from '@app/stores/cms/services/cms.service';
import { UserService } from '@app/stores/user';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { filter, shareReplay, switchMap, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-filter-sidebar',
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSidebarComponent implements OnInit {
  @Input()
  public set open(value: boolean) {
    this.open$.next(value);
  }

  @Input()
  public activeFilters = false;

  @Input()
  public savedFilters = false;

  @Input()
  public miniTop = false;

  @Input()
  public rememberFilters = true;

  @Output()
  public resetFilters = new EventEmitter<boolean>();

  @Output()
  public saveFilters = new EventEmitter<boolean>();

  public cmsMessageShown = false;

  private readonly user$ = this.userService.get().pipe(shareReplay(1));

  public readonly open$ = new BehaviorSubject<boolean>(false);

  public constructor(
    private readonly cmsService: CMSService,
    private readonly cdr: ChangeDetectorRef,
    private readonly userService: UserService
  ) {}

  public ngOnInit(): void {
    this.cmsService.get$.pipe(untilDestroyed(this)).subscribe(({ maintenance }) => {
      this.cmsMessageShown = maintenance.visible;
      this.cdr.markForCheck();
    });

    this.user$.pipe(take(1)).subscribe(user => {
      const open = user.userprofile.ui_settings?.filter_sidebar?.open;
      this.open$.next(open ?? false);
    });
  }

  public toggleSidebar(open: boolean): void {
    this.open$.next(open);
    this.user$
      .pipe(
        filter(Boolean),
        switchMap(user =>
          this.userService.changeSettings({
            userprofile: {
              ui_settings: {
                ...user.userprofile.ui_settings,
                filter_sidebar: {
                  open: open,
                },
              },
            },
          })
        ),
        take(1)
      )
      .subscribe();
  }
}
