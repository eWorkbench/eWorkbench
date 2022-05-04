/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import { Location } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AppVersionService, AuthService } from '@app/services';
import type { User } from '@eworkbench/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  @ViewChild('navbarBrand', { static: true })
  public navbarBrand!: HTMLAnchorElement;

  @ViewChild('navbarRightContent', { static: true })
  public navbarRightContent!: HTMLDivElement;

  public currentUser: User | null = null;

  public collapsed = true;

  public userCollapsed = true;

  public dropdown = true;

  public minimalisticNavbar = false;

  public isDSSCurator = false;

  public version = '2.0';

  public constructor(
    private readonly authService: AuthService,
    private readonly appVersionService: AppVersionService,
    private readonly location: Location,
    private readonly router: Router,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.breakpointObserver
      .observe(['(min-width: 992px)'])
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        /* istanbul ignore if */
        if (res.matches) {
          this.dropdown = true;
          this.userCollapsed = true;
          this.cdr.markForCheck();
          return;
        }
        this.dropdown = false;
        this.cdr.markForCheck();
      });

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
      if (this.currentUser?.permissions?.includes('dss.add_dsscontainer')) {
        this.isDSSCurator = true;
      }
      this.cdr.markForCheck();
    });

    this.router.events
      .pipe(
        untilDestroyed(this),
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.minimalisticNavbar = this.location.path() === '/study-room-booking';
      });

    this.initAppVersion();
  }

  public initAppVersion(): void {
    this.appVersionService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        version => {
          this.version = version;
          this.cdr.markForCheck();
        },
        () => {
          this.cdr.markForCheck();
        }
      );
  }

  public onLogout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  public getUserName(): string | undefined {
    if (!this.currentUser) {
      return 'Profile';
    } else if (this.currentUser.userprofile.first_name && this.currentUser.userprofile.last_name) {
      return `${this.currentUser.userprofile.first_name} ${this.currentUser.userprofile.last_name}`;
    }
    return this.currentUser.username;
  }
}
