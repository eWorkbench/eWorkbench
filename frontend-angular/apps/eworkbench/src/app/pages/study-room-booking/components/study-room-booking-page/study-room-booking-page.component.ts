/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService, PageTitleService, ResourcesService } from '@app/services';
import { DropdownElement, Privileges, Resource, User } from '@eworkbench/types';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface FormStudyRoomBookings {
  branchLibrary: string | null;
  studyRoom: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-study-room-booking-page',
  templateUrl: './study-room-booking-page.component.html',
  styleUrls: ['./study-room-booking-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyRoomBookingPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public branchLibraryItems: DropdownElement[] = [];

  public studyRooms: Resource[] = [];

  public selectedStudyRoom?: Resource;

  public privileges?: Privileges;

  public params = new HttpParams().set('bookable_by_students', 'true');

  public loading = false;

  public form = this.fb.group<FormStudyRoomBookings>({
    branchLibrary: null,
    studyRoom: null,
  });

  public constructor(
    private readonly resourcesService: ResourcesService,
    private readonly authService: AuthService,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  public get f(): FormGroup<FormStudyRoomBookings>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
      this.cdr.markForCheck();
    });

    this.initTranslations();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('studyRoomBooking.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('studyRoomBooking.branchLibraries')
      .pipe(untilDestroyed(this))
      .subscribe(branchLibrary => {
        this.branchLibraryItems = [
          { value: 'CHEM', label: branchLibrary.chemistry },
          { value: 'MAIT', label: branchLibrary.mathematicsAndInformatics },
          { value: 'MEDIC', label: branchLibrary.medicine },
          { value: 'PHY', label: branchLibrary.physics },
          { value: 'SHSCI', label: branchLibrary.sportAndHealthSciences },
          { value: 'MCAMP', label: branchLibrary.mainCampus },
          { value: 'WEIH', label: branchLibrary.weihenstephan },
        ];
      });
  }

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

  public onChangeBranchLibrary(): void {
    if (this.loading) {
      return;
    }

    this.studyRooms = [];
    this.selectedStudyRoom = undefined;

    if (this.f.branchLibrary.value) {
      this.loading = true;
      this.form.disable({ emitEvent: false });

      this.params = this.params.set('branch_library', this.f.branchLibrary.value);

      this.resourcesService
        .getList(this.params)
        .pipe(untilDestroyed(this))
        .subscribe(
          /* istanbul ignore next */ resources => {
            this.studyRooms = [...resources.data];
            this.loading = false;
            this.form.enable({ emitEvent: false });
            this.form.patchValue({ studyRoom: null }, { emitEvent: false });
            this.cdr.markForCheck();
          },
          /* istanbul ignore next */ () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    } else {
      this.form.patchValue({ studyRoom: null }, { emitEvent: false });
    }
  }

  public onChangeStudyRoom(resource?: Resource): void {
    if (this.loading) {
      return;
    }

    this.selectedStudyRoom = undefined;

    if (this.currentUser && resource) {
      this.loading = true;
      this.form.disable({ emitEvent: false });

      this.resourcesService
        .getUserPrivileges(resource.pk, this.currentUser.pk!, false)
        .pipe(untilDestroyed(this))
        .subscribe(
          /* istanbul ignore next */ privileges => {
            this.selectedStudyRoom = resource;
            this.privileges = { ...privileges };
            this.loading = false;
            this.form.enable({ emitEvent: false });
            this.cdr.markForCheck();
          },
          /* istanbul ignore next */ () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    }
  }
}
