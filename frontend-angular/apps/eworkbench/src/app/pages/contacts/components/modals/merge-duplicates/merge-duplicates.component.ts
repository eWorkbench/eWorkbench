/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { ContactsService, SearchService } from '@app/services';
import type { Contact, ContactPayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormArray, FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom, of, Subject } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

interface FormMergeDuplicates {
  baseContact: any;
  mergeContacts: FormArray<(string | null)[]>;
  academicTitles: FormArray<string[]>;
  academicTitleIndex: number;
  firstNames: FormArray<string[]>;
  firstNameIndex: number;
  lastNames: FormArray<string[]>;
  lastNameIndex: number;
  emails: FormArray<string[]>;
  emailIndex: number;
  phones: FormArray<string[]>;
  phoneIndex: number;
  companies: FormArray<string[]>;
  companyIndex: number;
  notes: FormArray<string[]>;
  noteIndex: number;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-merge-duplicates-modal',
  templateUrl: './merge-duplicates.component.html',
  styleUrls: ['./merge-duplicates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MergeDuplicatesModalComponent implements OnInit {
  public loading = false;

  public canMerge = false;

  public selectedBaseContact?: Contact;

  public selectedMergeContacts: Contact[] = [];

  public contacts: Contact[] = [];

  public favoriteContacts: Contact[] = [];

  public contactInput$ = new Subject<string>();

  public state = ModalState.Unchanged;

  public refreshFields = new EventEmitter<boolean>();

  public form = this.fb.group<FormMergeDuplicates>({
    baseContact: null,
    // @ts-expect-error
    mergeContacts: this.fb.array([null]),
    academicTitles: this.fb.array([]),
    academicTitleIndex: 0,
    firstNames: this.fb.array([]),
    firstNameIndex: 0,
    lastNames: this.fb.array([]),
    lastNameIndex: 0,
    emails: this.fb.array([]),
    emailIndex: 0,
    phones: this.fb.array([]),
    phoneIndex: 0,
    companies: this.fb.array([]),
    companyIndex: 0,
    notes: this.fb.array([]),
    noteIndex: 0,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly contactsService: ContactsService,
    private readonly fb: FormBuilder,
    private readonly searchService: SearchService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public ngOnInit(): void {
    this.initSearchInput();
  }

  public initSearchInput(): void {
    this.contactInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.searchService.contacts(input) : of([...this.favoriteContacts])))
      )
      .subscribe(contacts => {
        this.contacts = this.getUnusedContacts([...contacts].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite)));
        this.cdr.markForCheck();
      });

    this.contactsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(contacts => {
        if (contacts.data.length) {
          this.favoriteContacts = [...contacts.data];
          this.contacts = [...this.contacts, ...this.favoriteContacts]
            .filter((value, index, array) => array.map(contact => contact.pk).indexOf(value.pk) === index)
            .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
      });
  }

  public get f() {
    return this.form.controls;
  }

  public get baseContact(): string {
    return this.form.get('baseContact').value;
  }

  public get mergeContacts(): FormArray<string | null> {
    return this.form.get('mergeContacts') as any;
  }

  public get academicTitles(): FormArray<string> {
    return this.form.get('academicTitles') as any;
  }

  public get academicTitleIndex(): number {
    return this.form.get('academicTitleIndex').value;
  }

  public get academicTitle(): string {
    return this.academicTitles.at(this.academicTitleIndex).value;
  }

  public get firstNames(): FormArray<string> {
    return this.form.get('firstNames') as any;
  }

  public get firstNameIndex(): number {
    return this.form.get('firstNameIndex').value;
  }

  public get firstName(): string {
    return this.firstNames.at(this.firstNameIndex).value;
  }

  public get lastNames(): FormArray<string> {
    return this.form.get('lastNames') as any;
  }

  public get lastNameIndex(): number {
    return this.form.get('lastNameIndex').value;
  }

  public get lastName(): string {
    return this.lastNames.at(this.lastNameIndex).value;
  }

  public get emails(): FormArray<string> {
    return this.form.get('emails') as any;
  }

  public get emailIndex(): number {
    return this.form.get('emailIndex').value;
  }

  public get email(): string {
    return this.emails.at(this.emailIndex).value;
  }

  public get phones(): FormArray<string> {
    return this.form.get('phones') as any;
  }

  public get phoneIndex(): number {
    return this.form.get('phoneIndex').value;
  }

  public get phone(): string {
    return this.phones.at(this.phoneIndex).value;
  }

  public get companies(): FormArray<string> {
    return this.form.get('companies') as any;
  }

  public get companyIndex(): number {
    return this.form.get('companyIndex').value;
  }

  public get company(): string {
    return this.companies.at(this.companyIndex).value;
  }

  public get notes(): FormArray<string> {
    return this.form.get('notes') as any;
  }

  public get noteIndex(): number {
    return this.form.get('noteIndex').value;
  }

  public get note(): string {
    return this.notes.at(this.noteIndex).value;
  }

  public getUnusedContacts(contacts: Contact[]): Contact[] {
    const unusedContacts: Contact[] = [];

    contacts.map(contact => {
      if (!this.selectedContacts.length || !this.selectedContacts.find(x => x.pk === contact.pk)) {
        unusedContacts.push(contact);
      }
    });

    return unusedContacts;
  }

  public get selectedContacts(): Contact[] {
    const selectedContacts = [...this.selectedMergeContacts];

    if (this.selectedBaseContact) {
      selectedContacts.unshift(this.selectedBaseContact);
    }

    return selectedContacts;
  }

  public get contact(): ContactPayload {
    return {
      academic_title: this.academicTitle,
      last_name: this.lastName,
      first_name: this.firstName,
      metadata: this.selectedBaseContact?.metadata ?? [],
      notes: this.note,
      projects: this.selectedBaseContact?.projects ?? [],
      email: this.email,
      phone: this.phone,
      company: this.company,
    };
  }

  public addContactAt(contact: Contact, index: number): void {
    this.academicTitles.insert(index, this.fb.control(contact.academic_title));
    this.firstNames.insert(index, this.fb.control(contact.first_name));
    this.lastNames.insert(index, this.fb.control(contact.last_name));
    this.emails.insert(index, this.fb.control(contact.email));
    this.phones.insert(index, this.fb.control(contact.phone));
    this.companies.insert(index, this.fb.control(contact.company));
    this.notes.insert(index, this.fb.control(contact.notes));
    this.refreshFields.next(true);
  }

  public onChangeBaseContact(contact?: Contact): void {
    if (contact) {
      this.selectedBaseContact = contact;
      this.addContactAt(contact, 0);
    } else {
      this.selectedBaseContact = undefined!;
      this.removeContactFields(0);
    }
    this.checkCanMerge();
  }

  public onAddMergeContact(): void {
    this.mergeContacts.push(this.fb.control(null) as any);
  }

  public onRemoveMergeContact(index: number): void {
    this.mergeContacts.removeAt(index);
    this.removeContactFields(index + 1);
    this.refreshFields.next(true);
    this.selectedMergeContacts.splice(index, 1);
    this.checkCanMerge();
  }

  public onChangeMergeContact(index: number, contact?: Contact): void {
    if (contact) {
      this.selectedMergeContacts[index] = contact;
      this.addContactAt(contact, index + 1);
    } else {
      this.selectedMergeContacts.splice(index, 1);
      this.removeContactFields(index + 1);
    }
    this.checkCanMerge();
  }

  public removeContactFields(index: number): void {
    this.academicTitles.removeAt(index);
    this.firstNames.removeAt(index);
    this.lastNames.removeAt(index);
    this.emails.removeAt(index);
    this.phones.removeAt(index);
    this.companies.removeAt(index);
    this.notes.removeAt(index);
  }

  public setContactAsBase(index: number): void {
    if (this.selectedBaseContact) {
      const mergeContact = this.selectedMergeContacts[index];
      let contacts: Contact[] = [];

      contacts.push(this.selectedBaseContact);
      this.contacts = contacts;
      this.cdr.detectChanges();
      // @ts-expect-error
      this.mergeContacts.at(index).setValue(this.selectedBaseContact.pk);
      this.selectedMergeContacts[index] = this.selectedBaseContact;
      this.removeContactFields(index + 1);
      this.addContactAt(this.selectedBaseContact, index + 1);
      contacts = [];

      contacts.push(mergeContact);
      this.contacts = contacts;
      this.cdr.detectChanges();
      this.f.baseContact.setValue(mergeContact.pk);
      this.selectedBaseContact = mergeContact;
      this.removeContactFields(0);
      this.addContactAt(mergeContact, 0);
      this.contacts = [];
    }
  }

  public checkCanMerge(): void {
    this.canMerge = Boolean(this.baseContact && this.selectedMergeContacts.length);
  }

  public onMergeContacts(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    Promise.all([
      lastValueFrom(this.contactsService.patch(this.baseContact, this.contact).pipe(untilDestroyed(this))),
      ...this.mergeContacts.value.map(contactPk => {
        if (contactPk) return lastValueFrom(this.contactsService.delete(contactPk).pipe(untilDestroyed(this)));
        return Promise.resolve({} as Contact);
      }),
    ]).then(
      () => {
        this.state = ModalState.Changed;
        this.modalRef.close({ state: this.state });
        this.translocoService
          .selectTranslate('contacts.mergeDuplicatesModal.toastr.success')
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
