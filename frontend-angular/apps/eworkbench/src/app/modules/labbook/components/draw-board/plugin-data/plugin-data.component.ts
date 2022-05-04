/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { CommentsModalComponent } from '@app/modules/comment/components/modals/comments/comments.component';
import { AuthService, LabBooksService, PluginInstancesService, WebSocketService } from '@app/services';
import type { LabBookElement, Lock, PluginInstance, PluginInstancePayload, Privileges, User } from '@eworkbench/types';
import { DialogService } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { v4 as uuidv4 } from 'uuid';

interface ElementRemoval {
  id: string;
  gridReload: boolean;
}

interface FormPluginData {
  title: FormControl<string | null>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-labbook-draw-board-plugin-data',
  templateUrl: './plugin-data.component.html',
  styleUrls: ['./plugin-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabBookDrawBoardPluginDataComponent implements OnInit {
  @Input()
  public id!: string;

  @Input()
  public element!: LabBookElement<PluginInstance>;

  @Input()
  public section?: string;

  @Input()
  public editable? = false;

  @Input()
  public refreshElementRelations?: EventEmitter<{ model_name: string; model_pk: string }>;

  @Output()
  public removed = new EventEmitter<ElementRemoval>();

  @Output()
  public moved = new EventEmitter<ElementRemoval>();

  public currentUser: User | null = null;

  public initialState?: PluginInstance;

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public loading = false;

  public uniqueHash = uuidv4();

  public refreshResetValue = new EventEmitter<boolean>();

  public form = this.fb.group<FormPluginData>({
    title: this.fb.control(null, Validators.required),
  });

  public constructor(
    public readonly pluginInstancesService: PluginInstancesService,
    private readonly labBooksService: LabBooksService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get lockUser(): { ownUser: boolean; user?: User | undefined | null } {
    if (this.lock) {
      if (this.lock.lock_details?.locked_by.pk === this.currentUser?.pk) {
        return { ownUser: true, user: this.lock.lock_details?.locked_by };
      }

      return { ownUser: false, user: this.lock.lock_details?.locked_by };
    }

    return { ownUser: false, user: null };
  }

  private get pluginInstance(): PluginInstancePayload {
    return {
      title: this.f.title.value!,
    };
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initDetails();
    this.initPrivileges();

    this.websocketService.subscribe([{ model: 'plugininstance', pk: this.initialState!.pk }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      if (data.element_lock_changed?.model_pk === this.initialState!.pk) {
        this.lock = data.element_lock_changed;
        this.cdr.detectChanges();
      }

      if (data.element_changed?.model_pk === this.initialState!.pk || data.element_relations_changed?.model_pk === this.initialState!.pk) {
        this.getDetails();
        this.cdr.detectChanges();
      }
    });

    this.refreshElementRelations?.subscribe((event: { model_name: string; model_pk: string }) => {
      if (event.model_name === 'plugininstance' && event.model_pk === this.initialState!.pk) {
        this.refreshElementRelationsCounter();
      }
    });
  }

  public getDetails(): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.pluginInstancesService
      .get(this.initialState!.pk, this.currentUser.pk)
      .pipe(untilDestroyed(this))
      .subscribe(
        privilegesData => {
          const pluginInstance = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.form.patchValue(
            {
              title: pluginInstance.title,
            },
            { emitEvent: false }
          );

          this.initialState = { ...pluginInstance };
          this.privileges = { ...privileges };

          this.loading = false;
          this.refreshResetValue.next(true);
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public initDetails(): void {
    this.form.patchValue(
      {
        title: this.element.child_object.title,
      },
      { emitEvent: false }
    );

    this.initialState = { ...this.element.child_object };
  }

  public initPrivileges(): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.pluginInstancesService
      .get(this.initialState!.pk, this.currentUser.pk)
      .pipe(untilDestroyed(this))
      .subscribe(privilegesData => {
        const privileges = privilegesData.privileges;
        this.privileges = { ...privileges };

        if (!this.privileges.edit) {
          this.form.disable({ emitEvent: false });
        }

        this.cdr.markForCheck();
      });
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.pluginInstancesService
      .patch(this.initialState!.pk, this.pluginInstance)
      .pipe(untilDestroyed(this))
      .subscribe(
        pluginInstance => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.pluginInstancesService.unlock(this.initialState!.pk);
          }

          this.initialState = { ...pluginInstance };
          this.form.markAsPristine();
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('plugin.details.toastr.success')
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

  public pendingChanges(): boolean {
    return this.form.dirty;
  }

  public onRemove(event: ElementRemoval): void {
    this.removed.emit(event);
  }

  public onMove(event: ElementRemoval): void {
    this.moved.emit(event);
  }

  public onOpenCommentsModal(): void {
    this.modalService.open(CommentsModalComponent, {
      closeButton: false,
      width: '912px',
      data: { service: this.pluginInstancesService, element: this.initialState, create: true },
    });
  }

  public refreshElementRelationsCounter(): void {
    this.labBooksService
      .getElement(this.id, this.element.pk)
      .pipe(untilDestroyed(this))
      .subscribe(element => {
        this.element.num_related_comments = element.num_related_comments!;
        this.element.num_relations = element.num_relations!;
        this.cdr.markForCheck();
      });
  }
}
