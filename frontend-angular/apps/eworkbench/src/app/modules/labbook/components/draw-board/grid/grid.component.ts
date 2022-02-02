/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { LabBookSectionsService, LabBooksService, WebSocketService } from '@app/services';
import { environment } from '@environments/environment';
import { LabBookElement, LabBookElementEvent, LabBookElementPayload } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GridsterComponent, GridsterConfig, GridsterItem } from 'angular-gridster2';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { gridsterConfig } from '../../../config/gridster-config';
import { LabBookDrawBoardElementComponent } from '../element/element.component';

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardGridComponent implements OnInit, OnDestroy {
  @ViewChild('drawBoard', { static: true })
  public drawBoard!: TemplateRef<GridsterComponent>;

  @ViewChildren('elementComponent')
  public elements?: QueryList<LabBookDrawBoardElementComponent>;

  @Input()
  public id!: string;

  @Input()
  public section?: string;

  @Input()
  public created?: EventEmitter<LabBookElementEvent>;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Input()
  public editable? = false;

  public closeSection = new EventEmitter<string>();

  public refreshElementRelations = new EventEmitter<{ model_name: string; model_pk: string }>();

  public loading = true;

  public drawBoardElements: Array<GridsterItem> = [];

  public expandedSection?: string;

  public options: GridsterConfig = {
    ...gridsterConfig,
    itemChangeCallback: () => this.updateAllElements(),
    itemResizeCallback: () => this.updateAllElements(),
  };

  public socketLoading = false;

  public socketRefreshTimeout?: any;

  public queuedSocketRefreshes = false;

  public constructor(
    public readonly labBooksService: LabBooksService,
    public readonly labBookSectionsService: LabBookSectionsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly websocketService: WebSocketService
  ) {}

  public ngOnInit(): void {
    this.websocketService.subscribe([{ model: 'labbook', pk: this.id }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ (data: any) => {
        /* istanbul ignore next */
        if (data.labbook_child_element_changed?.model_pk === this.id) {
          // Sadly, we need a timeout here because the logic for the LabBook operations is
          // mainly in the frontend and the backend sends a socket request when the first
          // API request (in the browser of another user) resolved. But we really should wait
          // for all API calls which we can't, because we don't know what's going on in another
          // browser. If the logic moves to the backend, we can remove the timeout.
          if (this.socketRefreshTimeout) {
            clearTimeout(this.socketRefreshTimeout);
          }

          this.socketRefreshTimeout = setTimeout(() => this.softReload(), environment.labBookSocketRefreshInterval);
        } else if (data.element_relations_changed) {
          this.refreshElementRelations.next(data.element_relations_changed);
        }
      }
    );

    this.initDetails();

    /* istanbul ignore next */
    this.created?.subscribe((event: LabBookElementEvent) => {
      this.addElement(event);
    });

    /* istanbul ignore next */
    this.refresh?.subscribe((reload: boolean) => {
      if (reload) {
        this.reload();
      }
    });
  }

  public ngOnDestroy(): void {
    this.websocketService.unsubscribe();
  }

  public initDetails(): void {
    this.labBooksService
      .getElements(this.id, this.section)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ labBookElements => {
          labBookElements.forEach(element => this.drawBoardElements.push(...this.convertToGridItems([element])));

          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public addElement(event: LabBookElementEvent): void {
    // Basically it would be ideal to let all the grids (the main grid and all the section grids)
    // handle the add logic themselves. However, this is not possible because this code only gets
    // executed when the grid is initialized. This is only the case for the main grid as it is
    // always visible and sections can be closed at any time (which means the grid may not be
    // initialized at the time of adding an element to a section). That's why we must handle
    // section logic in the main grid too.
    // If logic for the LabBook moves to the backend this whole code can be deleted.

    if (this.loading) {
      return;
    }
    this.loading = true;

    const addToLabBook = event.parentElement === 'labBook';
    const addToSection = !addToLabBook;

    let getSectionElements$ = of([] as LabBookElement<any>[]);
    let sectionElements: LabBookElement<any>[] | undefined;

    if (addToSection) {
      getSectionElements$ = this.labBooksService.getElements(this.id, event.parentElement).pipe(untilDestroyed(this));
    }

    getSectionElements$
      .pipe(
        untilDestroyed(this),
        switchMap(
          /* istanbul ignore next */ elements => {
            if (addToSection) {
              sectionElements = [...elements];
            }

            const element: LabBookElementPayload = {
              child_object_content_type: event.childObjectContentType,
              child_object_id: event.childObjectId,
              position_x: 0,
              position_y: event.position === 'top' ? 0 : this.getMaxYPosition(sectionElements, addToSection),
              width: 20,
              height: this.getNewElementHeight(event.childObjectContentTypeModel),
            };

            return this.labBooksService.addElement(this.id, element).pipe(untilDestroyed(this));
          }
        ),
        switchMap(
          /* istanbul ignore next */ labBookElement => {
            if (addToLabBook) {
              return of(labBookElement);
            }

            sectionElements ??= [];

            return this.labBookSectionsService
              .patch(event.parentElement, {
                pk: event.parentElement,
                child_elements: [...sectionElements.map(e => e.pk), labBookElement.pk],
              })
              .pipe(
                untilDestroyed(this),
                map(/* istanbul ignore next */ () => labBookElement)
              );
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ labBookElement => {
          const newGridElement: GridsterItem = {
            label: labBookElement.display,
            x: labBookElement.position_x,
            y: labBookElement.position_y,
            cols: labBookElement.width,
            rows: labBookElement.height,
            resizeEnabled: this.getItemResizeEnabled(labBookElement.child_object_content_type_model),
            element: labBookElement,
          };

          if (addToLabBook) {
            if (event.position === 'top') {
              this.moveElementsVertically(labBookElement.height);
            }

            this.drawBoardElements.push(newGridElement);
          } else if (addToSection) {
            if (event.position === 'top') {
              if (sectionElements?.length) {
                const sectionGridElements = this.convertToGridItems(sectionElements);
                const movedSectionGridElements = this.moveElementsVertically(labBookElement.height, 'down', 0, sectionGridElements);
                this.updateAllElements([
                  ...this.convertToLabBookElementPayload([newGridElement]),
                  ...this.convertToLabBookElementPayload(movedSectionGridElements),
                ]);
              }
            }

            // emit section reload
          }

          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public updateAllElements(elements?: LabBookElementPayload[]): void {
    if (!this.editable) {
      return;
    }

    // Delay the process for a tick or else gridster won't recognize the changes
    setTimeout(() => {
      if (this.loading) {
        return;
      }
      this.loading = true;

      const elementsPayload = elements ?? this.convertToLabBookElementPayload(this.drawBoardElements);

      this.labBooksService
        .updateAllElements(this.id, elementsPayload)
        .pipe(untilDestroyed(this))
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
    }, 1);
  }

  public getMaxYPosition(elements?: LabBookElement<any>[], addToSection = false): number {
    let elementsToConsider: { y: number; rows: number }[] = [];

    if (elements?.length) {
      elementsToConsider = elements.map(element => ({ y: element.position_y, rows: element.height }));
    } else if (addToSection) {
      return 0;
    } else {
      elementsToConsider = this.drawBoardElements.map(element => ({ y: element.y, rows: element.rows }));
    }

    if (!elementsToConsider.length) {
      return 0;
    }

    return Math.max(...elementsToConsider.map(element => element.y + element.rows));
  }

  public onRemove(event: ElementRemoval): void {
    if (event.gridReload) {
      this.reload();
    } else {
      let index = 0;
      this.drawBoardElements.forEach(drawBoardElement => {
        if (drawBoardElement.element.pk === event.id) {
          this.drawBoardElements.splice(index, 1);
          this.moveElementsVertically(drawBoardElement.rows, 'up', drawBoardElement.y);
          return;
        }

        index++;
      });
    }
  }

  public reload(): void {
    this.drawBoardElements = [];
    this.initDetails();
  }

  public softReload(): void {
    if (this.socketLoading) {
      this.queuedSocketRefreshes = true;
      return;
    }
    this.socketLoading = true;

    this.labBooksService
      .getElements(this.id, this.section)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ labBookElements => {
          const oldDrawBoardElements = [...this.drawBoardElements];
          const newdrawBoardElements: GridsterItem[] = this.convertToGridItems(labBookElements);

          // Remove deleted elements
          const elementsToRemove = oldDrawBoardElements.filter((oldField: GridsterItem) => {
            return !newdrawBoardElements.some((newField: GridsterItem) => {
              return oldField.element.pk === newField.element.pk;
            });
          });
          elementsToRemove.forEach(element => {
            for (let index = this.drawBoardElements.length - 1; index >= 0; index--) {
              const drawBoardElement = this.drawBoardElements[index];
              if (drawBoardElement.element.pk === element.element.pk) {
                this.drawBoardElements.splice(index, 1);
              }
            }
          });

          // Update existing elements
          newdrawBoardElements
            .filter((newField: GridsterItem) => {
              return oldDrawBoardElements.some((oldField: GridsterItem) => {
                return newField.element.pk === oldField.element.pk;
              });
            })
            .forEach(element => {
              this.drawBoardElements.forEach((drawBoardElement, index) => {
                if (drawBoardElement.element.pk === element.element.pk) {
                  this.drawBoardElements[index].x = element.x;
                  this.drawBoardElements[index].y = element.y;
                  this.drawBoardElements[index].cols = element.cols;
                  this.drawBoardElements[index].rows = element.rows;
                }
              });
            });

          // We must tell the options that we changed them even though we didn't. This way Gridster will
          // check the changed properties of items and visually apply them. This is important if we move
          // or resize items. As long as Gridster won't implement better support we need this workaround.
          this.options.api?.optionsChanged?.();

          // Add new elements
          const elementsToAdd = newdrawBoardElements.filter((newField: GridsterItem) => {
            return !oldDrawBoardElements.some((oldField: GridsterItem) => {
              return newField.element.pk === oldField.element.pk;
            });
          });
          this.drawBoardElements = [...this.drawBoardElements, ...elementsToAdd];

          this.socketLoading = false;
          this.socketRefreshTimeout = undefined;
          this.cdr.markForCheck();

          if (this.queuedSocketRefreshes) {
            this.queuedSocketRefreshes = false;
            this.softReload();
          }
        }
      );
  }

  public onExpandSection(id: string): void {
    this.expandedSection = id;
    this.closeSection.next(id);
  }

  public convertToGridItems(elements: LabBookElement<any>[]): GridsterItem[] {
    return elements.map(element => ({
      label: element.display,
      x: element.position_x,
      y: element.position_y,
      cols: element.width,
      rows: element.height,
      resizeEnabled: this.getItemResizeEnabled(element.child_object_content_type_model),
      element: element,
    }));
  }

  public convertToLabBookElementPayload(elements: GridsterItem[]): LabBookElementPayload[] {
    return elements.map(element => ({
      pk: element.element.pk as string,
      width: element.cols,
      height: element.rows,
      position_x: element.x,
      position_y: element.y,
    }));
  }

  public moveElementsVertically(
    distance: number,
    direction: 'down' | 'up' = 'down',
    yStartPosition = 0,
    elements?: GridsterItem[]
  ): GridsterItem[] {
    let currentElements: GridsterItem[] = [];
    const movedElements: GridsterItem[] = [];

    if (elements?.length) {
      currentElements = elements;
    } else {
      currentElements = this.drawBoardElements;
    }

    currentElements.forEach(drawBoardElement => {
      let newY = drawBoardElement.y;

      if (drawBoardElement.y >= yStartPosition) {
        if (direction === 'down') {
          newY = drawBoardElement.y + distance;
        } else {
          newY = drawBoardElement.y - distance;
        }
      }

      movedElements.push({
        cols: drawBoardElement.cols,
        rows: drawBoardElement.rows,
        x: drawBoardElement.x,
        y: newY,
        resizeEnabled: drawBoardElement.resizeEnabled!,
        element: drawBoardElement.element,
      });
    });

    if (!elements?.length) {
      this.drawBoardElements = [...movedElements];
    }

    return movedElements;
  }

  public getItemZIndex(item: GridsterItem): number {
    if (item.element.child_object_content_type_model === 'labbooks.labbooksection') {
      if (this.expandedSection === item.element.child_object_id) {
        return 3;
      }

      return 2;
    }

    return 1;
  }

  public getItemOverflow(item: GridsterItem): string {
    return item.element.child_object_content_type_model === 'labbooks.labbooksection' ? 'initial' : 'hidden';
  }

  public getItemResizeEnabled(contentType: string): boolean {
    return contentType !== 'labbooks.labbooksection' && Boolean(this.editable);
  }

  public getNewElementHeight(contentType: string): number {
    return contentType === 'labbooks.labbooksection' ? 1 : 7;
  }

  public pendingChanges(): boolean {
    for (const element of this.elements ?? []) {
      if (element.pendingChanges()) {
        return true;
      }
    }

    return false;
  }
}
