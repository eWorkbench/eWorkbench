/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from '@app/services';
import type { Drive, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface Details {
  protocol: string;
  host: string;
  port: string;
  path: string;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-web-dav-modal',
  templateUrl: './web-dav.component.html',
  styleUrls: ['./web-dav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebDavModalComponent implements OnInit {
  public storage?: Drive = this.modalRef.data?.storage;

  public details?: Details;

  public currentUser: User | null = null;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly clipboard: Clipboard,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    const url = new URL(this.storage!.webdav_url);
    this.details = {
      protocol: url.protocol,
      host: url.host,
      port: url.port,
      path: url.pathname,
    };
    this.cdr.markForCheck();
  }

  public onCopyToClipboard(copyText: string): void {
    this.clipboard.copy(copyText);
    this.translocoService
      .selectTranslate('storage.webDavModal.copiedToClipboard')
      .pipe(untilDestroyed(this))
      .subscribe(copiedToClipboard => {
        this.toastrService.success(copiedToClipboard);
      });
  }
}
