/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TaskModule } from '@app/modules/task/task.module';
import { UserModule } from '@app/modules/user/user.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { IconsModule } from '@eworkbench/icons';
import { mockKanbanTask } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { DialogService } from '@ngneat/dialog';
import { createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TaskCardComponent } from './task-card.component';

describe('TaskCardComponent', () => {
  let spectator: Spectator<TaskCardComponent>;
  const createComponent = createRoutingFactory({
    component: TaskCardComponent,
    imports: [
      HttpClientTestingModule,
      getTranslocoModule(),
      BsDropdownModule.forRoot(),
      SharedModule,
      UserModule,
      ModalsModule,
      IconsModule,
      TaskModule,
    ],
    mocks: [DialogService],
  });

  beforeEach(() => (spectator = createComponent({ props: { task: mockKanbanTask, expanded: true } })));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onOpenChange()', () => {
    const onOpenChangeSpy = jest.spyOn(spectator.component, 'onOpenChange');
    spectator.component.onOpenChange(true);
    expect(onOpenChangeSpy).toHaveBeenCalledWith(true);
    expect(onOpenChangeSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      expanded: true,
    });
    spectator.component.onOpenChange(false);
    expect(onOpenChangeSpy).toHaveBeenCalledWith(false);
    expect(onOpenChangeSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onRemove()', () => {
    const onRemoveSpy = jest.spyOn(spectator.component, 'onRemove');
    spectator.component.onRemove();
    expect(onRemoveSpy).toHaveBeenCalledTimes(1);
  });

  it('should have a title of task title', () => {
    const element = spectator.query('.task-card-title > a') as HTMLLinkElement;
    expect(element).toHaveText(mockKanbanTask.task.title);
  });

  /* it('should have a state', () => {
    const stateElement = spectator.query('.task-card-expanded > div > div:nth-child(2) > span:nth-child(2)');
    expect(stateElement).toHaveText('New');
  });

  it('should have a priority', () => {
    const priorityElement = spectator.query('.task-card-expanded > div > div:nth-child(3) > span:nth-child(2)');
    expect(priorityElement).toHaveText('Normal');
  }); */

  it('should have a task id', () => {
    const taskIdElement = spectator.query('.task-card-expanded > div > div:nth-child(4) > a');
    expect(taskIdElement).toHaveText('#12');
  });

  it('should have a created by', () => {
    const createdByElement = spectator.query('.task-card-expanded > div > div:nth-child(5) > eworkbench-user-details > a');
    const firstName = mockKanbanTask.task.created_by.userprofile.first_name ?? '';
    const lastName = mockKanbanTask.task.created_by.userprofile.last_name ?? '';
    expect(createdByElement).toHaveText(`${firstName} ${lastName}`);
  });

  it('should have a last modified by', () => {
    const lastModifiedByElement = spectator.query('.task-card-expanded > div > div:nth-child(6) > eworkbench-user-details > a');
    const firstName = mockKanbanTask.task.last_modified_by.userprofile.first_name ?? '';
    const lastName = mockKanbanTask.task.last_modified_by.userprofile.last_name ?? '';
    expect(lastModifiedByElement).toHaveText(`${firstName} ${lastName}`);
  });
});
