/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import {
  FilesService,
  LabBookSectionsService,
  LabBooksService,
  NotesService,
  PicturesService,
  PluginInstancesService,
} from '@app/services';
import { DropdownElement, LabBookElement, LabBookElementPayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

interface FormImport {
  labBook: string | null;
  insertAll: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-import-labbook-elements-modal',
  templateUrl: './import-elements.component.html',
  styleUrls: ['./import-elements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportLabBookElementsModalComponent implements OnInit {
  public labBookId = this.modalRef.data.labBookId;

  public projectsList: string[] = this.modalRef.data.projects ?? [];

  public state = ModalState.Unchanged;

  public labBooks: DropdownElement[] = [];

  public selectedLabBook?: string | null;

  public loading = true;

  public elements: LabBookElement<any>[] = [];

  public selectedElements: LabBookElement<any>[] = [];

  public sectionElements: Record<string, LabBookElement<any>[]> = {}; // map section to element

  public elementsSection: Record<string, string> = {}; // map element to section

  public params = new HttpParams().set('is_template', 'true');

  public totalElements = 0;

  public form = this.fb.group<FormImport>({
    labBook: [null],
    insertAll: [false],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly labBookSectionsService: LabBookSectionsService,
    private readonly notesService: NotesService,
    private readonly labBooksService: LabBooksService,
    private readonly pluginInstancesService: PluginInstancesService,
    private readonly picturesService: PicturesService,
    private readonly filesService: FilesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public get f(): FormGroup<FormImport>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.labBooksService
      .getList(this.params)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ labBooks => {
            this.labBooks = labBooks.data.map(labBook => ({ value: labBook.pk.toString(), label: labBook.display }));
          }
        )
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

  public async onSubmit(): Promise<void> {
    if (this.loading) {
      return;
    }
    this.loading = true;

    const sectionMap: Record<string, string> = {};
    const elements: LabBookElement<any>[] = [];
    const elementsForSection: Record<string, LabBookElement<any>[]> = {};

    const getElementsOperation = async (): Promise<void> => {
      await this.labBooksService
        .getElements(this.labBookId)
        .pipe(
          untilDestroyed(this),
          map(/* istanbul ignore next*/ labBookElements => elements.push(...labBookElements))
        )
        .toPromise();
    };

    const sectionOperation = async (): Promise<void> => {
      const sections = this.selectedElements.filter(e => e.child_object_content_type_model === 'labbooks.labbooksection');

      if (!sections.length) {
        return;
      }

      for (const section of sections) {
        await this.importLabBookElement(section, elements)
          .pipe(
            map(newSection => {
              elements.push(newSection);
              sectionMap[section.child_object_id] = newSection.child_object_id;
            })
          )
          .toPromise();
      }
    };

    const elementsOperation = async (): Promise<void> => {
      const labBookElements = this.selectedElements.filter(e => e.child_object_content_type_model !== 'labbooks.labbooksection');

      if (!labBookElements.length) {
        return;
      }

      for (const labBookElement of labBookElements) {
        const oldSectionId = this.elementsSection[labBookElement.pk];
        const newSectionId = sectionMap[oldSectionId];
        const parentSectionSelected = this.selectedElements.filter(
          e => e.child_object_content_type_model === 'labbooks.labbooksection' && e.child_object_id === oldSectionId
        ).length;

        await this.importLabBookElement(labBookElement, parentSectionSelected ? elementsForSection[newSectionId] : elements)
          .pipe(
            map(newLabBookElement => {
              if (parentSectionSelected) {
                elementsForSection[newSectionId] ??= [];
                elementsForSection[newSectionId] = [...elementsForSection[newSectionId], newLabBookElement];
              } else {
                elements.push(newLabBookElement);
              }
            })
          )
          .toPromise();
      }
    };

    const sectionPatchOperation = async (): Promise<void> => {
      if (!Object.keys(elementsForSection).length) {
        return;
      }

      for (const [sectionId, elements] of Object.entries(elementsForSection)) {
        await this.labBookSectionsService
          .patch(sectionId, {
            pk: sectionId,
            child_elements: [...elements.map(e => e.pk)],
          })
          .toPromise();
      }
    };

    await getElementsOperation();
    await sectionOperation();
    await elementsOperation();
    await sectionPatchOperation();

    this.state = ModalState.Changed;
    this.modalRef.close({ state: this.state });
    this.translocoService
      .selectTranslate('labBook.importModal.toastr.success')
      .pipe(untilDestroyed(this))
      .subscribe(success => {
        this.toastrService.success(success);
      });
  }

  public onChangeLabBook(): void {
    const labBookId = this.f.labBook.value;
    this.selectedLabBook = labBookId;

    if (labBookId) {
      this.getElements(labBookId);
    }

    this.form.patchValue({ labBook: null });
  }

  public async getElements(id: string): Promise<void> {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.elements = [];
    this.sectionElements = {};

    const getElementsOperation = async (): Promise<void> => {
      await this.labBooksService
        .getElements(id)
        .pipe(
          untilDestroyed(this),
          map(
            /* istanbul ignore next*/ labBookElements => {
              this.elements.push(...labBookElements);
              this.totalElements += labBookElements.length;
            }
          )
        )
        .toPromise();
    };

    const sectionOperation = async (): Promise<void> => {
      const sections = this.elements.filter(e => e.child_object_content_type_model === 'labbooks.labbooksection');

      if (!sections.length) {
        return;
      }

      for (const labBookElement of this.elements) {
        await this.labBooksService
          .getElements(id, labBookElement.child_object_id)
          .pipe(
            untilDestroyed(this),
            map(childElements => {
              this.sectionElements[labBookElement.child_object_id] = childElements;
              this.totalElements += childElements.length;

              childElements.forEach(childElement => {
                this.elementsSection[childElement.pk] = labBookElement.child_object_id;
              });

              this.cdr.markForCheck();
            })
          )
          .toPromise();
      }
    };

    await getElementsOperation();
    await sectionOperation();

    this.loading = false;
    this.cdr.markForCheck();
  }

  public importLabBookElement(element: LabBookElement<any>, elements?: LabBookElement<any>[]): Observable<LabBookElement<any>> {
    return this.addLabBookElement(element).pipe(
      untilDestroyed(this),
      mergeMap(
        /* istanbul ignore next */ newElement => {
          const newLabBookElement: LabBookElementPayload = {
            child_object_content_type: newElement.content_type,
            child_object_id: newElement.pk,
            position_x: 0,
            position_y: this.getMaxYPosition(elements),
            width: element.width,
            height: element.height,
          };
          return this.labBooksService.addElement(this.labBookId, newLabBookElement).pipe(untilDestroyed(this));
        }
      )
    );
  }

  public addLabBookElement(element: LabBookElement<any>): Observable<any> {
    if (element.child_object_content_type_model === 'labbooks.labbooksection') {
      return this.labBookSectionsService.add(element.child_object).pipe(untilDestroyed(this));
    } else if (element.child_object_content_type_model === 'shared_elements.note') {
      return this.notesService.add(element.child_object).pipe(untilDestroyed(this));
    } else if (element.child_object_content_type_model === 'plugins.plugininstance') {
      return this.pluginInstancesService.add(element.child_object).pipe(untilDestroyed(this));
    } else if (element.child_object_content_type_model === 'pictures.picture') {
      return this.picturesService.add(element.child_object).pipe(untilDestroyed(this));
    } else if (element.child_object_content_type_model === 'shared_elements.file') {
      return this.filesService.add(element.child_object).pipe(untilDestroyed(this));
    }

    return of();
  }

  public getMaxYPosition(elements?: LabBookElement<any>[]): number {
    if (!elements?.length) {
      return 0;
    }

    return Math.max(...elements.map(element => element.position_y + element.height));
  }

  public onToggleSelected(element: LabBookElement<any>): void {
    if (this.selectedElements.map(e => e.pk).includes(element.pk)) {
      this.selectedElements = this.selectedElements.filter(e => e.pk !== element.pk);
    } else {
      this.selectedElements.push(element);

      if (element.child_object_content_type_model === 'labbooks.labbooksection') {
        this.selectSectionElements(element.child_object_id);
      }
    }
  }

  public selectSectionElements(id: string): void {
    this.sectionElements[id].forEach(element => {
      if (!this.selectedElements.includes(element)) {
        this.selectedElements.push(element);
      }
    });
  }

  public onToggleAll(): void {
    if (this.selectedElements.length === this.totalElements) {
      this.selectedElements = [];
    } else {
      this.selectedElements = [...this.elements];
      for (const elements of Object.values(this.sectionElements)) {
        this.selectedElements.push(...elements);
      }
    }
  }
}
