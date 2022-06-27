/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { NewTaskBoardModalComponent } from '@app/modules/task-board/components/modals/new/new.component';
import { NewTaskModalComponent } from '@app/modules/task/components/modals/new/new.component';
import { NewContactModalComponent } from '@app/pages/contacts/components/modals/new/new.component';
import { NewDMPModalComponent } from '@app/pages/dmps/components/modals/new/new.component';
import { NewFileModalComponent } from '@app/pages/files/components/modals/new.component';
import { NewLabBookModalComponent } from '@app/pages/labbooks/components/modals/new/new.component';
import { NewNoteModalComponent } from '@app/pages/notes/components/modals/new/new.component';
import { NewPictureModalComponent } from '@app/pages/pictures/components/modals/new/new.component';
import { NewProjectModalComponent } from '@app/pages/projects/components/modals/new/new.component';
import { NewStorageModalComponent } from '@app/pages/storages/components/modals/new/new.component';
import { DMPService, NotesService, PicturesService } from '@app/services';
import { AppointmentsService } from '@app/services/appointments/appointments.service';
import { ContactsService } from '@app/services/contacts/contacts.service';
import { DrivesService } from '@app/services/drives/drives.service';
import { FilesService } from '@app/services/files/files.service';
import { LabBooksService } from '@app/services/labbooks/labbooks.service';
import { PluginInstancesService } from '@app/services/plugin-instances/plugin-instances.service';
import { ProjectsService } from '@app/services/projects/projects.service';
import { TaskBoardsService } from '@app/services/task-board/task-board.service';
import { TasksService } from '@app/services/tasks/tasks.service';
import type { TableColumn } from '@eworkbench/table';
import type { ModalCallback, RelationPayload } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormArray, FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TabDirective, TabsetComponent } from 'ngx-bootstrap/tabs';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

interface FormRelations {
  appointmentRelations: FormArray<RelationPayload[]>;
  noteRelations: FormArray<RelationPayload[]>;
  contactRelations: FormArray<RelationPayload[]>;
  dmpRelations: FormArray<RelationPayload[]>;
  fileRelations: FormArray<RelationPayload[]>;
  labBookRelations: FormArray<RelationPayload[]>;
  pictureRelations: FormArray<RelationPayload[]>;
  pluginInstanceRelations: FormArray<RelationPayload[]>;
  projectRelations: FormArray<RelationPayload[]>;
  driveRelations: FormArray<RelationPayload[]>;
  taskRelations: FormArray<RelationPayload[]>;
  taskBoardRelations: FormArray<RelationPayload[]>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewLinkModalComponent implements OnInit {
  public contentType: string = this.modalRef.data.contentType;

  public baseModel: any = this.modalRef.data.baseModel;

  public service: any = this.modalRef.data.service;

  public searchContentTabs?: TabsetComponent;

  @ViewChild('searchContentTabs') public set tabset(tabset: TabsetComponent) {
    this.searchContentTabs = tabset;
    this.initDetails();
  }

  @ViewChild('genericCreatedByCellTemplate', { static: true })
  public genericCreatedByCellTemplate!: TemplateRef<any>;

  @ViewChild('genericCreatedAtCellTemplate', { static: true })
  public genericCreatedAtCellTemplate!: TemplateRef<any>;

  @ViewChild('appointmentTitleCellTemplate', { static: true })
  public appointmentTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('appointmentStartDateCellTemplate', { static: true })
  public appointmentStartDateCellTemplate!: TemplateRef<any>;

  @ViewChild('noteSubjectCellTemplate', { static: true })
  public noteSubjectCellTemplate!: TemplateRef<any>;

  @ViewChild('contactFirstNameCellTemplate', { static: true })
  public contactFirstNameCellTemplate!: TemplateRef<any>;

  @ViewChild('contactLastNameCellTemplate', { static: true })
  public contactLastNameCellTemplate!: TemplateRef<any>;

  @ViewChild('dmpTitleCellTemplate', { static: true })
  public dmpTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('fileNameCellTemplate', { static: true })
  public fileNameCellTemplate!: TemplateRef<any>;

  @ViewChild('fileTitleCellTemplate', { static: true })
  public fileTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('labBookTitleCellTemplate', { static: true })
  public labBookTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('pictureTitleCellTemplate', { static: true })
  public pictureTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('picturePreviewCellTemplate', { static: true })
  public picturePreviewCellTemplate!: TemplateRef<any>;

  @ViewChild('pluginInstanceTitleCellTemplate', { static: true })
  public pluginInstanceTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('projectNameCellTemplate', { static: true })
  public projectNameCellTemplate!: TemplateRef<any>;

  @ViewChild('driveTitleCellTemplate', { static: true })
  public driveTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('taskIdCellTemplate', { static: true })
  public taskIdCellTemplate!: TemplateRef<any>;

  @ViewChild('taskTitleCellTemplate', { static: true })
  public taskTitleCellTemplate!: TemplateRef<any>;

  @ViewChild('taskPriorityCellTemplate', { static: true })
  public taskPriorityCellTemplate!: TemplateRef<any>;

  @ViewChild('taskStateCellTemplate', { static: true })
  public taskStateCellTemplate!: TemplateRef<any>;

  @ViewChild('taskBoardTitleCellTemplate', { static: true })
  public taskBoardTitleCellTemplate!: TemplateRef<any>;

  public appointmentListColumns: TableColumn[] = [];

  public noteListColumns: TableColumn[] = [];

  public contactListColumns: TableColumn[] = [];

  public dmpListColumns: TableColumn[] = [];

  public fileListColumns: TableColumn[] = [];

  public labbookListColumns: TableColumn[] = [];

  public pictureListColumns: TableColumn[] = [];

  public pluginDataListColumns: TableColumn[] = [];

  public projectListColumns: TableColumn[] = [];

  public driveListColumns: TableColumn[] = [];

  public taskListColumns: TableColumn[] = [];

  public taskBoardListColumns: TableColumn[] = [];

  public showAppointmentSearch = false;

  public showNoteSearch = false;

  public showContactSearch = false;

  public showDMPSearch = false;

  public showFileSearch = false;

  public showLabbookSearch = false;

  public showPictureSearch = false;

  public showPluginDataSearch = false;

  public showProjectSearch = false;

  public showDriveSearch = false;

  public showTaskSearch = false;

  public showTaskBoardSearch = false;

  public refreshAppointments = new EventEmitter<boolean>();

  public refreshNotes = new EventEmitter<boolean>();

  public refreshContacts = new EventEmitter<boolean>();

  public refreshDMPs = new EventEmitter<boolean>();

  public refreshFiles = new EventEmitter<boolean>();

  public refreshLabBooks = new EventEmitter<boolean>();

  public refreshPictures = new EventEmitter<boolean>();

  public refreshPluginData = new EventEmitter<boolean>();

  public refreshProjects = new EventEmitter<boolean>();

  public refreshDrives = new EventEmitter<boolean>();

  public refreshTasks = new EventEmitter<boolean>();

  public refreshTaskBoards = new EventEmitter<boolean>();

  public loading = false;

  public state = ModalState.Unchanged;

  public newContentModal: any;

  public newContentModalRef?: DialogRef;

  public newContentLabel = '';

  public refreshContent = new EventEmitter<boolean>();

  public form = this.fb.group<FormRelations>({
    appointmentRelations: this.fb.array([]),
    noteRelations: this.fb.array([]),
    contactRelations: this.fb.array([]),
    dmpRelations: this.fb.array([]),
    fileRelations: this.fb.array([]),
    labBookRelations: this.fb.array([]),
    pictureRelations: this.fb.array([]),
    pluginInstanceRelations: this.fb.array([]),
    projectRelations: this.fb.array([]),
    driveRelations: this.fb.array([]),
    taskRelations: this.fb.array([]),
    taskBoardRelations: this.fb.array([]),
  });

  public constructor(
    public readonly appointmentsService: AppointmentsService,
    public readonly notesService: NotesService,
    public readonly contactsService: ContactsService,
    public readonly dmpsService: DMPService,
    public readonly filesService: FilesService,
    public readonly labBooksService: LabBooksService,
    public readonly picturesService: PicturesService,
    public readonly pluginInstancesService: PluginInstancesService,
    public readonly projectsService: ProjectsService,
    public readonly drivesService: DrivesService,
    public readonly tasksService: TasksService,
    public readonly taskBoardsService: TaskBoardsService,
    public readonly modalRef: DialogRef,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly toastrService: ToastrService,
    private readonly modalService: DialogService
  ) {}

  public ngOnInit(): void {
    this.initTranslations();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('appointments.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.appointmentListColumns = [
          {
            cellTemplate: this.appointmentTitleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
            width: '25%',
          },
          {
            cellTemplate: this.appointmentStartDateCellTemplate,
            name: column.startDate,
            key: 'date_time_start',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('notes.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.noteListColumns = [
          {
            cellTemplate: this.noteSubjectCellTemplate,
            name: column.subject,
            key: 'subject',
            sortable: true,
            width: '33%',
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('contacts.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.contactListColumns = [
          {
            cellTemplate: this.contactFirstNameCellTemplate,
            name: column.firstName,
            key: 'first_name',
            sortable: true,
            width: '25%',
          },
          {
            cellTemplate: this.contactLastNameCellTemplate,
            name: column.lastName,
            key: 'last_name',
            sortable: true,
            width: '25%',
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('dmps.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.dmpListColumns = [
          {
            cellTemplate: this.dmpTitleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
            width: '25%',
          },
          {
            name: column.dmpForm,
            key: 'dmp_form_title',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('files.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.fileListColumns = [
          {
            cellTemplate: this.fileNameCellTemplate,
            name: column.name,
            key: 'name',
            sortable: true,
            width: '25%',
          },
          {
            cellTemplate: this.fileTitleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
            width: '25%',
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('labBooks.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.labbookListColumns = [
          {
            cellTemplate: this.labBookTitleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
            width: '33%',
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('pictures.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.pictureListColumns = [
          {
            cellTemplate: this.pictureTitleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
            width: '50%',
          },
          {
            cellTemplate: this.picturePreviewCellTemplate,
            name: column.preview,
            key: 'download_rendered_image',
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('pluginInstance.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.pluginDataListColumns = [
          {
            cellTemplate: this.pluginInstanceTitleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
            width: '33%',
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('projects.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.projectListColumns = [
          {
            cellTemplate: this.projectNameCellTemplate,
            name: column.name,
            key: 'name',
            sortable: true,
            width: '50%',
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('storages.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.driveListColumns = [
          {
            cellTemplate: this.driveTitleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
            width: '50%',
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('tasks.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.taskListColumns = [
          {
            cellTemplate: this.taskIdCellTemplate,
            name: column.taskId,
            key: 'task_id',
            sortable: true,
          },
          {
            cellTemplate: this.taskTitleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
            width: '25%',
          },
          {
            cellTemplate: this.taskPriorityCellTemplate,
            name: column.priority,
            key: 'priority',
            sortable: true,
          },
          {
            cellTemplate: this.taskStateCellTemplate,
            name: column.state,
            key: 'state',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.genericCreatedAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
        ];

        this.translocoService
          .selectTranslateObject('taskBoards.columns')
          .pipe(untilDestroyed(this))
          .subscribe(column => {
            this.taskBoardListColumns = [
              {
                cellTemplate: this.taskBoardTitleCellTemplate,
                name: column.title,
                key: 'title',
                sortable: true,
                width: '50%',
              },
              {
                cellTemplate: this.genericCreatedByCellTemplate,
                name: column.createdBy,
                key: 'created_by',
                sortable: true,
              },
              {
                cellTemplate: this.genericCreatedAtCellTemplate,
                name: column.createdAt,
                key: 'created_at',
                sortable: true,
              },
            ];
          });
      });
  }

  public initDetails(): void {
    this.searchContentTabs?.tabs.forEach(tab => {
      if (tab.id === this.contentType) tab.active = true;
    });
    this.showSearch(this.contentType);
    this.cdr.detectChanges();
  }

  public get f() {
    return this.form.controls;
  }

  public get relations(): RelationPayload[] {
    let relations: RelationPayload[] = [];
    relations = [
      ...relations,
      ...this.appointmentRelations.value,
      ...this.noteRelations.value,
      ...this.contactRelations.value,
      ...this.dmpRelations.value,
      ...this.fileRelations.value,
      ...this.labBookRelations.value,
      ...this.pictureRelations.value,
      ...this.pluginInstanceRelations.value,
      ...this.projectRelations.value,
      ...this.driveRelations.value,
      ...this.taskRelations.value,
      ...this.taskBoardRelations.value,
    ];

    return relations;
  }

  public get relationsCount(): number {
    return this.relations.length;
  }

  public get appointmentRelations(): FormArray<RelationPayload> {
    return this.form.get('appointmentRelations') as any;
  }

  public get noteRelations(): FormArray<RelationPayload> {
    return this.form.get('noteRelations') as any;
  }

  public get contactRelations(): FormArray<RelationPayload> {
    return this.form.get('contactRelations') as any;
  }

  public get dmpRelations(): FormArray<RelationPayload> {
    return this.form.get('dmpRelations') as any;
  }

  public get fileRelations(): FormArray<RelationPayload> {
    return this.form.get('fileRelations') as any;
  }

  public get labBookRelations(): FormArray<RelationPayload> {
    return this.form.get('labBookRelations') as any;
  }

  public get pictureRelations(): FormArray<RelationPayload> {
    return this.form.get('pictureRelations') as any;
  }

  public get pluginInstanceRelations(): FormArray<RelationPayload> {
    return this.form.get('pluginInstanceRelations') as any;
  }

  public get projectRelations(): FormArray<RelationPayload> {
    return this.form.get('projectRelations') as any;
  }

  public get driveRelations(): FormArray<RelationPayload> {
    return this.form.get('driveRelations') as any;
  }

  public get taskRelations(): FormArray<RelationPayload> {
    return this.form.get('taskRelations') as any;
  }

  public get taskBoardRelations(): FormArray<RelationPayload> {
    return this.form.get('taskBoardRelations') as any;
  }

  public showSearch(contentType?: string): void {
    switch (contentType) {
      case 'shared_elements.meeting': {
        this.showAppointmentSearch = true;
        this.newContentModal = NewAppointmentModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.appointment';
        this.refreshContent = this.refreshAppointments;
        break;
      }
      case 'shared_elements.note': {
        this.showNoteSearch = true;
        this.newContentModal = NewNoteModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.note';
        this.refreshContent = this.refreshNotes;
        break;
      }
      case 'shared_elements.contact': {
        this.showContactSearch = true;
        this.newContentModal = NewContactModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.contact';
        this.refreshContent = this.refreshContacts;
        break;
      }
      case 'shared_elements.dmp': {
        this.showDMPSearch = true;
        this.newContentModal = NewDMPModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.dmp';
        this.refreshContent = this.refreshDMPs;
        break;
      }
      case 'shared_elements.file': {
        this.showFileSearch = true;
        this.newContentModal = NewFileModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.file';
        this.refreshContent = this.refreshFiles;
        break;
      }
      case 'labbooks.labbook': {
        this.showLabbookSearch = true;
        this.newContentModal = NewLabBookModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.labBook';
        this.refreshContent = this.refreshLabBooks;
        break;
      }
      case 'shared_elements.picture': {
        this.showPictureSearch = true;
        this.newContentModal = NewPictureModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.picture';
        this.refreshContent = this.refreshPictures;
        break;
      }
      case 'plugins.plugininstance': {
        this.showPluginDataSearch = true;
        this.newContentModal = null;
        this.newContentLabel = '';
        this.refreshContent = this.refreshPluginData;
        break;
      }
      case 'projects.project': {
        this.showProjectSearch = true;
        this.newContentModal = NewProjectModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.project';
        this.refreshContent = this.refreshProjects;
        break;
      }
      case 'drivers.drive': {
        this.showDriveSearch = true;
        this.newContentModal = NewStorageModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.storage';
        this.refreshContent = this.refreshDrives;
        break;
      }
      case 'shared_elements.task': {
        this.showTaskSearch = true;
        this.newContentModal = NewTaskModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.task';
        this.refreshContent = this.refreshTasks;
        break;
      }
      case 'kanban_boards.kanbanboard': {
        this.showTaskBoardSearch = true;
        this.newContentModal = NewTaskBoardModalComponent;
        this.newContentLabel = 'link.newModal.newContentLabel.taskBoard';
        this.refreshContent = this.refreshTaskBoards;
        break;
      }
      default: {
        break;
      }
    }
  }

  public onSelectTab(event: TabDirective): void {
    this.showSearch(event.id);
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    Promise.all([
      ...this.relations.map(relation => lastValueFrom(this.service.addRelation(this.baseModel.pk, relation).pipe(untilDestroyed(this)))),
    ]).then(
      () => {
        this.state = ModalState.Changed;
        this.modalRef.close({ state: this.state });
        this.translocoService
          .selectTranslate('link.newModal.toastr.success')
          .pipe(untilDestroyed(this))
          .subscribe(success => {
            this.toastrService.success(success);
          });
      },
      () => {
        // TODO: Better error handling, if possible.
        this.state = ModalState.Changed;
        this.modalRef.close({ state: this.state });
      }
    );
  }

  public onOpenNewContentModal(): void {
    this.newContentModalRef = this.modalService.open(this.newContentModal, {
      closeButton: false,
      enableClose: false,
    });

    this.newContentModalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: ModalCallback) => this.onNewContentModalClose(callback));
  }

  public onNewContentModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.refreshContent.next(callback.data.newContent);
    }
  }
}
