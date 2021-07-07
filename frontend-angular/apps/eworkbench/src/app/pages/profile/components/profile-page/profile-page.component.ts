/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { PageTitleService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { CropperComponent } from '@crawl/angular-cropperjs';
import { User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormArray, FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { fromEvent, Observable, of } from 'rxjs';
import { map, pluck, take } from 'rxjs/operators';

interface FormProfile {
  avatar: string | null;
  academicTitle: string | null;
  firstName: string | null;
  lastName: string | null;
  employeeAffiliation: string[];
  studentAffiliation: string[];
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  aboutMe: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  public title = '';

  public initialState?: User;

  @ViewChild('avatarCropper')
  public avatarCropper!: CropperComponent;

  @ViewChild('avatarFileSelect')
  public avatarFileSelect!: FileList;

  public loading = false;

  public avatar?: string;

  public newAvatar?: string;

  public avatarCropperConfig: any = {
    viewMode: 1,
    aspectRatio: 1,
  };

  public usedStorage?: string;

  public availableStorage?: string;

  public usedStoragePercentage = '0.00';

  public showEmployeeAffiliationButton = false;

  public showStudentAffiliationButton = false;

  public modalRef?: DialogRef;

  public refreshResetValue = new EventEmitter<boolean>();

  public form = this.fb.group<FormProfile>({
    avatar: null,
    academicTitle: null,
    firstName: null,
    lastName: null,
    employeeAffiliation: this.fb.array([]),
    studentAffiliation: this.fb.array([]),
    country: null,
    phone: null,
    email: [null, [Validators.required, Validators.email]],
    website: null,
    aboutMe: null,
  });

  public constructor(
    private readonly userService: UserService,
    private readonly userStore: UserStore,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly modalService: DialogService
  ) {}

  public get f(): FormGroup<FormProfile>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get isLDAPUser(): boolean {
    return this.initialState?.userprofile.type === 'l';
  }

  public get employeeAffiliation(): FormArray<string> {
    return this.form.get('employeeAffiliation') as FormArray<string>;
  }

  public get studentAffiliation(): FormArray<string> {
    return this.form.get('studentAffiliation') as FormArray<string>;
  }

  private get user(): User {
    if (this.isLDAPUser && this.initialState) {
      return {
        email: this.initialState.email,
        userprofile: {
          academic_title: this.initialState.userprofile.academic_title,
          additional_information: this.f.aboutMe.value ?? '',
          country: this.initialState.userprofile.country,
          first_name: this.initialState.userprofile.first_name!,
          last_name: this.initialState.userprofile.last_name!,
          org_zug_mitarbeiter_lang: this.initialState.userprofile.org_zug_mitarbeiter_lang,
          org_zug_student_lang: this.initialState.userprofile.org_zug_student_lang,
          phone: this.initialState.userprofile.phone,
          website: this.f.website.value,
        },
      };
    }

    return {
      email: this.f.email.value ?? '',
      userprofile: {
        academic_title: this.f.academicTitle.value ?? '',
        additional_information: this.f.aboutMe.value ?? '',
        country: this.f.country.value ?? '',
        first_name: this.f.firstName.value ?? '',
        last_name: this.f.lastName.value ?? '',
        org_zug_mitarbeiter_lang: this.f.employeeAffiliation.value,
        org_zug_student_lang: this.f.studentAffiliation.value,
        phone: this.f.phone.value ?? '',
        website: this.f.website.value,
      },
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initDetails();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('profile.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });
  }

  public initDetails(): void {
    this.loading = true;

    this.userService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ user => {
          this.form.patchValue(
            {
              academicTitle: user.userprofile.academic_title,
              firstName: user.userprofile.first_name,
              lastName: user.userprofile.last_name,
              country: user.userprofile.country,
              phone: user.userprofile.phone,
              email: user.email,
              website: user.userprofile.website,
              aboutMe: user.userprofile.additional_information,
            },
            { emitEvent: false }
          );

          this.avatar = user.userprofile.avatar!;
          this.usedStorage = user.used_storage_megabyte?.toFixed(2) as any;
          this.availableStorage = user.available_storage_megabyte?.toFixed(2) as any;
          this.recalculateStoragePercentage(user);

          this.initialState = { ...user };

          user.userprofile.org_zug_mitarbeiter_lang?.forEach(value => {
            this.employeeAffiliation.push(this.fb.control({ value, disabled: this.isLDAPUser }));
          });

          user.userprofile.org_zug_student_lang?.forEach(value => {
            this.studentAffiliation.push(this.fb.control({ value, disabled: this.isLDAPUser }));
          });

          this.loading = false;

          this.disableFieldsForLDAPUser();
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public disableFieldsForLDAPUser(): void {
    if (this.isLDAPUser) {
      this.f.academicTitle.disable();
      this.f.firstName.disable();
      this.f.lastName.disable();
      this.f.country.disable();
      this.f.phone.disable();
      this.f.email.disable();
    }
  }

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.userService
      .put(this.user)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ user => {
          this.initialState = { ...user };

          this.avatar = user.userprofile.avatar!;
          this.usedStorage = user.used_storage_megabyte?.toFixed(2) as any;
          this.availableStorage = user.available_storage_megabyte?.toFixed(2) as any;
          this.recalculateStoragePercentage(user);

          this.updateStore();

          this.form.markAsPristine();
          this.showEmployeeAffiliationButton = false;
          this.showStudentAffiliationButton = false;
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('profile.toastr.success.profileUpdated')
            .pipe(untilDestroyed(this))
            .subscribe(profileUpdated => {
              this.toastrService.success(profileUpdated);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public pendingChanges(): Observable<boolean> {
    if (this.form.dirty) {
      this.modalRef = this.modalService.open(PendingChangesModalComponent, {
        closeButton: false,
      });
      /* istanbul ignore next */
      return this.modalRef.afterClosed$.pipe(
        untilDestroyed(this),
        take(1),
        map(val => Boolean(val))
      );
    }

    return of(true);
  }

  public onCancelEmployeeAffiliation(): void {
    this.onClearEmployeeAffiliation();
    this.initialState?.userprofile.org_zug_mitarbeiter_lang?.forEach(val => {
      this.employeeAffiliation.push(this.fb.control(val));
    });
    this.showEmployeeAffiliationButton = false;
  }

  public onCancelStudentAffiliation(): void {
    this.onClearStudentAffiliation();
    this.initialState?.userprofile.org_zug_student_lang?.forEach(val => {
      this.studentAffiliation.push(this.fb.control(val));
    });
    this.showStudentAffiliationButton = false;
  }

  public updateStore(): void {
    this.userService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe((user: User) => {
        this.userStore.update(() => ({ user }));
        this.cdr.markForCheck();
      });
  }

  public onSaveAvatar(): void {
    /* istanbul ignore next */
    this.avatarCropper.exportCanvas();
  }

  public onExportAvatar(): void {
    /* istanbul ignore next */
    this.avatar = this.avatarCropper.cropper.getCroppedCanvas().toDataURL('image/jpeg', 0.7);
    /* istanbul ignore next */
    this.avatarCropper.cropper.getCroppedCanvas().toBlob(
      (blob: Blob | null) => {
        if (blob) {
          this.userService
            .updateAvatar(new File([blob], 'avatar.jpg'))
            .pipe(untilDestroyed(this))
            .subscribe((user: User) => {
              this.userStore.update(() => ({ user }));

              if (this.initialState) {
                this.initialState = {
                  ...this.initialState,
                  userprofile: {
                    ...this.initialState.userprofile,
                    avatar: user.userprofile.avatar!,
                  },
                };
              }

              this.cdr.markForCheck();
              this.translocoService
                .selectTranslate('profile.toastr.success.avatarUpdated')
                .pipe(untilDestroyed(this))
                .subscribe(avatarUpdated => {
                  this.toastrService.success(avatarUpdated);
                });
            });
        }
      },
      'image/jpeg',
      0.7
    );
    /* istanbul ignore next */
    this.onCancelAvatarChange();
  }

  public onUploadAvatar(event: Event): void {
    /* istanbul ignore next */
    const files = (event.target as HTMLInputElement).files;
    /* istanbul ignore next */
    if (files?.length) {
      this.fileToBase64(files[0]).subscribe(data => {
        this.newAvatar = data as string;
        this.cdr.markForCheck();
      });
    }
  }

  public onCancelAvatarChange(): void {
    this.newAvatar = undefined!;
    this.form.patchValue({
      avatar: '',
    });
  }

  public fileToBase64(file: File): Observable<unknown> {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    return fromEvent(reader, 'load').pipe(untilDestroyed(this), pluck('currentTarget', 'result'));
  }

  public onAddEmployeeAffiliation(): void {
    this.employeeAffiliation.push(this.fb.control(''));
    this.showEmployeeAffiliationButton = true;
  }

  public onRemoveEmployeeAffiliation(element: number): void {
    this.employeeAffiliation.removeAt(element);
    this.showEmployeeAffiliationButton = true;
  }

  public onClearEmployeeAffiliation(): void {
    while (this.employeeAffiliation.length) {
      this.onRemoveEmployeeAffiliation(0);
    }
  }

  public onAddStudentAffiliation(): void {
    this.studentAffiliation.push(this.fb.control(''));
    this.showStudentAffiliationButton = true;
  }

  public onRemoveStudentAffiliation(element: number): void {
    this.studentAffiliation.removeAt(element);
    this.showStudentAffiliationButton = true;
  }

  public onClearStudentAffiliation(): void {
    while (this.studentAffiliation.length) {
      this.onRemoveStudentAffiliation(0);
    }
  }

  public recalculateStoragePercentage(user: User): void {
    if (user.used_storage_megabyte && user.available_storage_megabyte) {
      this.usedStoragePercentage = ((user.used_storage_megabyte / user.available_storage_megabyte) * 100).toFixed(2);
    }
  }
}
