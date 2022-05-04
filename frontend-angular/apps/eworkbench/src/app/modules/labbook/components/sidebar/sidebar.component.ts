/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import type { LabBookElementEvent, ModalCallback } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { ImportLabBookElementsModalComponent } from '../../components/modals/import-elements/import-elements.component';
import { NewLabBookFileElementModalComponent } from '../modals/new/file/new.component';
import { NewLabBookNoteElementModalComponent } from '../modals/new/note/new.component';
import { NewLabBookPictureElementModalComponent } from '../modals/new/picture/new.component';
import { NewLabBookPluginElementModalComponent } from '../modals/new/plugin/new.component';
import { NewLabBookSectionElementModalComponent } from '../modals/new/section/new.component';
import { NewLabBookSketchModalComponent } from '../modals/new/sketch/new.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookSidebarComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public projects: string[] = [];

  @Input()
  public editable? = false;

  @Output()
  public created = new EventEmitter<LabBookElementEvent>();

  @Output()
  public refresh = new EventEmitter<boolean>();

  public modalRef?: DialogRef;

  public isMobileMode = false;

  public offsetHeader = 0;

  public offsetMargin = 15;

  public sidebarPosition = 'sticky';

  public constructor(
    private readonly breakpointObserver: BreakpointObserver,
    private readonly cdr: ChangeDetectorRef,
    private readonly modalService: DialogService
  ) {}

  public ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 992px)'])
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        /* istanbul ignore if */
        if (res.matches) {
          this.isMobileMode = true;
          return;
        }

        this.isMobileMode = false;
      });

    const parentElement = document.getElementById('site-header')!.offsetParent as HTMLElement;
    this.offsetHeader = parentElement.offsetTop + parentElement.offsetHeight;
  }

  @HostListener('window:scroll', ['$event'])
  public scrollEvent(event: any): void {
    this.setSidebarPosition(event.target.scrollingElement.scrollTop);
  }

  public setSidebarPosition(scrollTop: number): void {
    const drawBoardElement = document.getElementById('labbook-draw-board');
    const offsetTop = drawBoardElement!.offsetTop - this.offsetHeader;

    if (this.isMobileMode) {
      this.sidebarPosition = 'block';
    } else {
      this.sidebarPosition = scrollTop + this.offsetMargin > offsetTop ? 'fixed' : 'sticky';
    }

    this.cdr.markForCheck();
  }

  public onOpenNewNoteElementModal(): void {
    this.modalRef = this.modalService.open(NewLabBookNoteElementModalComponent, {
      closeButton: false,
      data: { labBookId: this.id, projects: this.projects },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenSketchModal(): void {
    this.modalRef = this.modalService.open(NewLabBookSketchModalComponent, {
      closeButton: false,
      width: '652px',
      data: { labBookId: this.id, projects: this.projects },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewPictureElementModal(): void {
    this.modalRef = this.modalService.open(NewLabBookPictureElementModalComponent, {
      closeButton: false,
      data: { labBookId: this.id, projects: this.projects },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewFileElementModal(): void {
    this.modalRef = this.modalService.open(NewLabBookFileElementModalComponent, {
      closeButton: false,
      data: { labBookId: this.id, projects: this.projects },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewPluginElementModal(): void {
    this.modalRef = this.modalService.open(NewLabBookPluginElementModalComponent, {
      closeButton: false,
      width: '1200px',
      data: { labBookId: this.id, projects: this.projects },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenImportModal(): void {
    this.modalRef = this.modalService.open(ImportLabBookElementsModalComponent, {
      closeButton: false,
      enableClose: false,
      data: { labBookId: this.id, projects: this.projects },
    });

    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: ModalCallback) => this.onImportModalClose(callback));
  }

  public onOpenNewSectionModal(): void {
    this.modalRef = this.modalService.open(NewLabBookSectionElementModalComponent, {
      closeButton: false,
      data: { projects: this.projects },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.created.emit(callback.data);
    }
  }

  public onImportModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.refresh.emit(true);
    }
  }
}
