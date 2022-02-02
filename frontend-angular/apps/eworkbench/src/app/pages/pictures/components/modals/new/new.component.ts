/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DOCUMENT } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ModalState } from '@app/enums/modal-state.enum';
import { scriptLoader } from '@app/modules/picture/util/script-loader';
import { PicturesService, ProjectsService } from '@app/services';
import { UserStore } from '@app/stores/user';
import { environment } from '@environments/environment';
import { Picture, PicturePayload, Project } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import pdfjs from 'pdfjs-dist';
import { PDFPageProxy } from 'pdfjs-dist/types/display/api';
import { from, lastValueFrom, of, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, mergeMap, switchMap } from 'rxjs/operators';
import { ConvertTiffModalComponent } from '../convert-tiff/convert-tiff.component';

declare global {
  interface Window {
    pdfjsLib: typeof pdfjs;
  }
}

interface FormPicture {
  title: string | null;
  height: number | null;
  width: number | null;
  aspectRatio: number | null;
  keepAspectRatio: boolean;
  file: globalThis.File | Blob | string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-file-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPictureModalComponent implements OnInit, AfterViewInit {
  public initialState?: Picture = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public filePlaceholder = this.translocoService.translate('picture.newModal.file.placeholder');

  public originalImage = new Image();

  public displayImage: SafeUrl | null = null;

  public convertTiffModalRef?: DialogRef;

  public form = this.fb.group<FormPicture>({
    title: [null, [Validators.required]],
    height: [null],
    width: [null],
    aspectRatio: [null],
    keepAspectRatio: [true],
    file: [null, [Validators.required]],
    projects: [[]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly picturesService: PicturesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService,
    private readonly domSanitizer: DomSanitizer,
    private readonly modalService: DialogService,
    private readonly userStore: UserStore,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  public get f(): FormGroup<FormPicture>['controls'] {
    return this.form.controls;
  }

  public get picture(): PicturePayload {
    return {
      title: this.f.title.value!,
      height: this.f.height.value!,
      width: this.f.width.value!,
      aspectRatio: this.f.aspectRatio.value!,
      background_image: this.f.file.value,
      projects: this.f.projects.value,
    };
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.patchFormValues();

    this.f.width.valueChanges.pipe(untilDestroyed(this), distinctUntilChanged()).subscribe(value => {
      if (value && this.f.aspectRatio.value && this.f.keepAspectRatio.value) {
        this.f.height.setValue(Math.round(value / this.f.aspectRatio.value), { emitEvent: false });
      }
    });

    this.f.height.valueChanges.pipe(untilDestroyed(this), distinctUntilChanged()).subscribe(value => {
      if (value && this.f.aspectRatio.value && this.f.keepAspectRatio.value) {
        this.f.width.setValue(Math.round(value * this.f.aspectRatio.value), { emitEvent: false });
      }
    });
  }

  public ngAfterViewInit(): void {
    scriptLoader(this.document, 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.6.347/build/pdf.min.js', () => {});
  }

  public initSearchInput(): void {
    this.projectInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(
        /* istanbul ignore next */ projects => {
          this.projects = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
      );

    this.projectsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ projects => {
          if (projects.data.length) {
            this.favoriteProjects = [...projects.data];
            this.projects = [...this.projects, ...this.favoriteProjects]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          }
        }
      );
  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          title: this.initialState.title,
          height: this.initialState.height,
          width: this.initialState.width,
          projects: this.initialState.projects,
        },
        { emitEvent: false }
      );

      if (this.initialState.width && this.initialState.height) {
        this.form.patchValue(
          {
            aspectRatio: this.initialState.width / this.initialState.height,
          },
          { emitEvent: false }
        );
      }

      /* istanbul ignore next */
      if (this.initialState.projects.length) {
        from(this.initialState.projects)
          .pipe(
            untilDestroyed(this),
            mergeMap(id =>
              this.projectsService.get(id).pipe(
                untilDestroyed(this),
                catchError(() => {
                  return of({ pk: id, name: this.translocoService.translate('formInput.unknownProject'), is_favourite: false } as Project);
                })
              )
            )
          )
          .subscribe(
            /* istanbul ignore next */ project => {
              this.projects = [...this.projects, project]
                .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
                .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
              this.cdr.markForCheck();
            }
          );
      }
    }
  }

  public onUpload(event: Event): void {
    /* istanbul ignore next */
    let files = (event.target as HTMLInputElement).files as any;

    /* istanbul ignore next */
    if (files.length) {
      const reader = new FileReader();
      reader.onload = async () => {
        if (files[0].type === 'application/pdf') {
          const pdf = await window.pdfjsLib.getDocument(reader.result as Parameters<typeof pdfjs.getDocument>[0]).promise;
          if (pdf.numPages === 1) {
            const firstPage = await pdf.getPage(1);
            const blob = await this.convertPDFtoCanvas(firstPage);
            files = [new File([blob], `${files[0].name as string}.png`)];
          }
        } else if (files[0].type === 'image/tiff') {
          const userStoreValue = this.userStore.getValue();
          const userSetting = 'SkipDialog-ConvertTiff';

          /* istanbul ignore next */
          const skipTiffDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.[userSetting]);
          let shouldConvert = false;

          if (!skipTiffDialog) {
            this.convertTiffModalRef = this.modalService.open(ConvertTiffModalComponent, {
              closeButton: false,
            });
            shouldConvert = await lastValueFrom(this.convertTiffModalRef.afterClosed$);
          }

          if (skipTiffDialog || shouldConvert) {
            const tiffFile: any = await fetch(URL.createObjectURL(files[0])).then(res => res.blob());
            const blob = await lastValueFrom(
              this.picturesService.convertTiff(`${environment.apiUrl}/convert_tiff_to_png/`, { file: tiffFile })
            );
            files = [new File([blob], `${files[0].name as string}.png`)];
          } else {
            return this.modalRef.close();
          }
        }

        const image = URL.createObjectURL(files[0]);
        this.displayImage = this.domSanitizer.bypassSecurityTrustUrl(image);
        this.originalImage.src = image;
        this.originalImage.onload = () => {
          this.filePlaceholder = files[0].name;
          const height = this.originalImage.naturalHeight || this.originalImage.height;
          const width = this.originalImage.naturalWidth || this.originalImage.width;
          this.form.patchValue({ file: files[0], height, width, aspectRatio: width / height });
          this.f.file.markAsDirty();
          this.cdr.markForCheck();
        };
      };
      reader.readAsArrayBuffer(files[0]);
    }
  }

  public async onSubmit(): Promise<void> {
    if (this.loading) {
      return;
    }
    this.loading = true;

    const height = this.originalImage.naturalHeight || this.originalImage.height;
    const width = this.originalImage.naturalWidth || this.originalImage.width;
    if (this.f.width.value !== width || this.f.height.value !== height) {
      this.form.patchValue({
        file: await this.resizeImage(this.originalImage, this.f.width.value!, this.f.height.value!),
      });
    }

    this.picturesService
      .add(this.picture)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ file => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, navigate: [`${this.withSidebar ? '..' : ''}/pictures`, file.pk] });
          this.translocoService
            .selectTranslate('picture.newModal.toastr.success')
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

  private async convertPDFtoCanvas(page: PDFPageProxy): Promise<any> {
    const toBlob = (canvas: HTMLCanvasElement): Promise<unknown> => new Promise(resolve => canvas.toBlob(resolve));

    const viewport = page.getViewport({ scale: 1 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: ctx!,
      viewport: viewport,
    }).promise;

    return toBlob(canvas);
  }

  private async resizeImage(image: HTMLImageElement, width: number, height: number): Promise<any> {
    const toBlob = (canvas: HTMLCanvasElement): Promise<unknown> => new Promise(resolve => canvas.toBlob(resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);

    return toBlob(canvas);
  }
}
