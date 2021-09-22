/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserDetailsModalComponent } from '@app/modules/user/components/modals/user-details/user-details.component';
import { AuthService } from '@app/services';
import { Note, Relation, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs';
import { DeleteCommentModalComponent } from '../modals/delete/delete.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentComponent implements OnInit {
  @Input()
  public comment!: Relation<any, Note>;

  @Input()
  public service!: any;

  @Output()
  public refresh = new EventEmitter<boolean>();

  public currentUser: User | null = null;

  public modalRef?: DialogRef;

  public loading = false;

  public constructor(
    private readonly authService: AuthService,
    private readonly modalService: DialogService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });
  }

  public onChangePrivateState(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.comment.private = !this.comment.private;

    this.service
      .putRelation(this.comment.right_object_id, this.comment.pk, this.comment)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */
        (result: Relation) => {
          const toastMsg = result.private
            ? this.translocoService.translate('comments.private.toastr.success')
            : this.translocoService.translate('comments.public.toastr.success');

          this.loading = false;
          this.cdr.markForCheck();
          this.toastrService.success(toastMsg);
        }
      );
  }

  public openUserModal(): void {
    this.modalRef = this.modalService.open(UserDetailsModalComponent, {
      closeButton: false,
      data: {
        user: this.comment.left_content_object.created_by,
      },
    });
  }

  public onOpenDeleteModal(): void {
    this.modalRef = this.modalService.open(DeleteCommentModalComponent, {
      closeButton: false,
      data: {
        service: this.service,
        baseModelId: this.comment.right_object_id,
        relationId: this.comment.pk,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe(() => {
      this.refresh.next(true);
    });
  }
}
