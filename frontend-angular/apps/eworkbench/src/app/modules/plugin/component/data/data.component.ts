/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-plugin-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginDataComponent implements OnInit {
  @Input()
  public authUrl!: string;

  @Input()
  public dataPicture?: string;

  @Input()
  public pluginLogo!: string;

  @Input()
  public pluginTitle!: string;

  @Input()
  public refresh?: EventEmitter<boolean>;

  public active = false;

  public constructor(private readonly sanitizer: DomSanitizer, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.deactivate();
      this.cdr.markForCheck();
    });
  }

  public onActivate(): void {
    this.active = true;
  }

  public deactivate(): void {
    this.active = false;
  }

  public safeAuthURL(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.authUrl);
  }
}
