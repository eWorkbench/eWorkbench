/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CdkDragDrop, CdkDragExit, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { AuthService, MenuModelService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { MenuModelItem, MenuModels } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';
import { ToastrService } from 'ngx-toastr';
import { switchMap, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-ordered-menu',
  templateUrl: './ordered-menu.component.html',
  styleUrls: ['./ordered-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderedMenuComponent implements OnInit, AfterViewInit {
  @ViewChild('menu', { static: true })
  public menu!: ElementRef<HTMLUListElement>;

  @ViewChild('menuItem', { static: true })
  public menuItem!: TemplateRef<any>;

  @ViewChild('overflowMenuDropdown')
  public dropdown!: BsDropdownDirective;

  @Input()
  public navbarBrand!: HTMLAnchorElement;

  @Input()
  public navbarRightContent!: HTMLDivElement;

  public savedOrderedElements: MenuModels[] = [];

  public elements: MenuModels[] = [];

  public menuItems: MenuModels[] = [];

  public overflowMenuItems: MenuModels[] = [];

  public editMode = false;

  public constructor(
    private readonly menuModelService: MenuModelService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly userStore: UserStore,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ state => {
        const menuModels = Object.keys(this.menuModelService.models) as MenuModels[];
        const menuModelsUISettings = (state.user?.userprofile.ui_settings?.ordered_menu ?? []) as MenuModels[];

        this.elements = [...menuModels];
        this.savedOrderedElements = [...this.elements];

        // We must check if menu items have been added or removed from the service models and update the UI setting in the user's profile
        if (menuModelsUISettings.length) {
          const itemsToRemove = menuModelsUISettings.filter((settingsField: MenuModels) => {
            return !menuModels.some((modelField: MenuModels) => {
              return settingsField === modelField;
            });
          });
          const itemsToAdd = menuModels.filter((modelField: MenuModels) => {
            return !menuModelsUISettings.some((settingsField: MenuModels) => {
              return modelField === settingsField;
            });
          });
          this.elements = [...menuModelsUISettings.filter(element => !itemsToRemove.includes(element)), ...itemsToAdd];
          this.savedOrderedElements = [...this.elements];

          if (itemsToRemove.length || itemsToAdd.length) {
            this.saveMenu(false);
          }
        }
      }
    );
  }

  public ngAfterViewInit(): void {
    setTimeout(() => this.calculateLimit(), 1);
  }

  public calculateLimit(): void {
    const fullWidth = window.innerWidth;
    if (fullWidth > 992) {
      const navbarBrand = this.navbarBrand.offsetWidth;
      const navbarRightContent = this.navbarRightContent.offsetWidth;
      let menuWidth = fullWidth - navbarBrand - navbarRightContent - 250;
      let limit = 0;

      this.elements.forEach(element => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        const button = document.createElement('button');

        li.className = 'd-flex align-items-center';
        a.className = 'h-100 w-100';
        button.className = 'btn ewb-button-regular text-uppercase h-100 w-100 text-nowrap';

        button.textContent = this.getMenuModel(element)!.name;
        a.appendChild(button);
        li.appendChild(a);
        this.menu.nativeElement.appendChild(li);

        if (menuWidth > li.offsetWidth) {
          limit++;
          menuWidth -= li.offsetWidth;
        }

        li.remove();
      });

      this.menuItems = [...this.elements.slice(0, limit)];
      this.overflowMenuItems = [...this.elements.slice(limit, this.elements.length)];
    } else {
      this.menuItems = this.elements;
    }

    this.cdr.markForCheck();
  }

  public onMenuDrop(event: CdkDragDrop<any>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }

    this.menu.nativeElement.style.marginLeft = '0px';

    this.elements = [...this.menuItems, ...this.overflowMenuItems];

    this.calculateLimit();
  }

  public onMenuExit(event: CdkDragExit): void {
    this.menu.nativeElement.style.marginLeft = `${event.item.element.nativeElement.offsetWidth}px`;
  }

  public onMenuEnter(): void {
    this.menu.nativeElement.style.marginLeft = '0px';
  }

  public getMenuModel(model: MenuModels): MenuModelItem | null {
    return this.menuModelService.get(model);
  }

  public editMenu(): void {
    this.dropdown.autoClose = false;
    this.editMode = true;
  }

  public cancelEditMenu(): void {
    this.dropdown.autoClose = true;
    this.editMode = false;
    this.elements = [...this.savedOrderedElements];
    this.calculateLimit();
  }

  public saveMenu(notification = true): void {
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
                  ordered_menu: [...new Set(this.elements)],
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
            .selectTranslate('menu.toastr.success.updated')
            .pipe(untilDestroyed(this))
            .subscribe(updated => {
              if (notification) {
                this.toastrService.success(updated);
              }
              this.savedOrderedElements = [...new Set(this.elements)];
              this.cancelEditMenu();
            });
        }
      );
  }
}
