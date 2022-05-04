/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FavoritesService } from '@app/services';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'eworkbench-favorite-button',
  templateUrl: './favorite-button.component.html',
  styleUrls: ['./favorite-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteButtonComponent {
  @Input()
  public id?: string;

  @Input()
  public contentType?: number;

  @Input()
  public favorited? = false;

  @Input()
  public btnClass = 'btn bg-transparent p-0';

  public loading = false;

  public constructor(
    private readonly favoritesService: FavoritesService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public onAddFavorite(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.favoritesService
      .add(this.id!, this.contentType!)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.favorited = true;
          this.loading = false;
          this.translocoService
            .selectTranslate('favorites.add.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
        }
      );
  }

  public onRemoveFavorite(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.favoritesService
      .delete(this.id!, this.contentType!)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.favorited = false;
          this.loading = false;
          this.translocoService
            .selectTranslate('favorites.delete.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
        }
      );
  }
}
