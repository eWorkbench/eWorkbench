/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ProjectsService } from '@app/services';
import { ProjectMember } from '@eworkbench/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-project-members-hierarchy',
  templateUrl: './project-members-hierarchy.component.html',
  styleUrls: ['./project-members-hierarchy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMembersHierarchyComponent implements OnInit {
  @Input()
  public id!: string;

  public members: ProjectMember[] = [];

  public memberRoles: Record<number, string[]> = {};

  public loading = false;

  public constructor(private readonly projectsService: ProjectsService, private readonly cdr: ChangeDetectorRef) {}

  public ngOnInit(): void {
    this.initMembers();
  }

  public initMembers(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.projectsService
      .getMembersUp(this.id)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ members => {
            const projectMembers: ProjectMember[] = [];
            const projectMembersRoles: Record<number, string[]> = {};

            members.forEach(member => {
              projectMembers.push(member);
              projectMembersRoles[member.user_pk] ??= [];
              projectMembersRoles[member.user_pk].push(member.role.name);
            });

            this.members = [...new Map(projectMembers.map(member => [member.user_pk, member])).values()];
            this.memberRoles = { ...projectMembersRoles };
          }
        )
      )
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
  }

  public formatRoles(data: string[]): string {
    return [...new Set(data)].join(', ');
  }
}
