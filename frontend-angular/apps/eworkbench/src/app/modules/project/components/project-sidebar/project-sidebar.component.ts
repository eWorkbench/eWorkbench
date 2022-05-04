/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { AuthService, ProjectsSidebarModelService } from '@app/services';
import { CMSService } from '@app/stores/cms/services/cms.service';
import { UserService, UserStore } from '@app/stores/user';
import type { ProjectSidebarModelItem, ProjectSidebarModels } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { switchMap, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-project-sidebar',
  templateUrl: './project-sidebar.component.html',
  styleUrls: ['./project-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSidebarComponent implements OnInit {
  @Input()
  public sidebarItem = ProjectSidebarItem.Overview;

  public projectId = this.route.snapshot.paramMap.get('projectId')!;

  public elements: string[] = [];

  public editMode = false;

  public cmsMessageShown = false;

  public constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly projectsSidebarModelService: ProjectsSidebarModelService,
    private readonly userStore: UserStore,
    private readonly route: ActivatedRoute,
    private readonly cmsService: CMSService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      const menuModels = Object.keys(this.projectsSidebarModelService.models);
      const menuModelsUISettings = (state.user?.userprofile.ui_settings?.projects_sidebar ?? []) as string[];

      this.elements = [...menuModels];

      // We must check if menu items have been added or removed from the service models and update the UI setting in the user's profile
      if (menuModelsUISettings.length) {
        const itemsToRemove = menuModelsUISettings.filter(
          (settingsField: string) => !menuModels.some((modelField: string) => settingsField === modelField)
        );
        const itemsToAdd = menuModels.filter(
          (modelField: string) => !menuModelsUISettings.some((settingsField: string) => modelField === settingsField)
        );
        this.elements = [...menuModelsUISettings.filter(element => !itemsToRemove.includes(element)), ...itemsToAdd];

        if (itemsToRemove.length || itemsToAdd.length) {
          this.save(false);
        }
      }
    });

    this.cmsService.get$.pipe(untilDestroyed(this)).subscribe(({ maintenance }) => {
      this.cmsMessageShown = maintenance.visible;
      this.cdr.markForCheck();
    });
  }

  public onSidebarDrop(event: CdkDragDrop<any>): void {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    this.elements = [...this.elements];
  }

  public save(notification = true): void {
    this.authService.user$
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(state => {
          const currentUser = state.user;

          return this.userService.changeSettings({
            userprofile: {
              ui_settings: {
                ...currentUser?.userprofile.ui_settings,
                projects_sidebar: [...this.elements],
              },
            },
          });
        })
      )
      .subscribe(user => {
        this.userStore.update(() => ({ user }));
        this.translocoService
          .selectTranslate('project.details.sidebar.toastr.success.updated')
          .pipe(untilDestroyed(this))
          .subscribe(updated => {
            if (notification) {
              this.toastrService.success(updated);
            }
          });
      });
  }

  public getSidebarModel(model: ProjectSidebarModels | string): ProjectSidebarModelItem | null {
    return this.projectsSidebarModelService.get(model as ProjectSidebarModels);
  }

  public onToggleEditMode(): void {
    if (this.editMode) {
      this.save();
    }
    this.editMode = !this.editMode;
  }
}
