/*
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
    'use strict';

    var
        app = angular.module('app');

    /**
     * Define Application Routes / States / URLs
     */
    app.config(function (
        $stateProvider,
        $urlRouterProvider
    ) {
        'ngInject';

        console.log('Configuring app');

        $stateProvider.state('main',
            {
                url: '/', // Important: Do not leave this empty (e.g., ''). It needs to have an URL to work properly
                component: 'mainDashboard',
                needsAuth: true
            }
        ).state('main2',
            {
                url: '', // redirect an empty url to main view
                redirectTo: 'main'
            }
        ).state('contact-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Contacts");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.contact;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/contacts?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers',
                component: 'contactList',
                needsAuth: true,
                activeMenuItem: 'contact',
                reloadOnSearch: false
            }
        ).state('contact-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Contacts") + " - " +
                        $queryParams.contact.first_name + " " +
                        $queryParams.contact.last_name;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.contact.first_name + " " + $queryParams.contact.last_name;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.contact;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('contact-list')
                    ];
                },
                url: '/contacts/{contact:contact}',
                component: 'contactView',
                needsAuth: true,
                'resolve': {
                    contact: function ($stateParams) {
                        'ngInject';

                        return $stateParams.contact;
                    }
                },
                activeMenuItem: 'contact'
            }
        ).state('note-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Comments");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.note;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/notes?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers',
                component: 'noteList',
                needsAuth: true,
                activeMenuItem: 'note',
                reloadOnSearch: false
            }
        ).state('note-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Comments") + " - " + $queryParams.note.subject;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.note.subject;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.note;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('note-list')
                    ];
                },
                url: '/notes/{note:note}',
                component: 'noteView',
                needsAuth: true,
                'resolve': {
                    note: function ($stateParams) {
                        'ngInject';

                        return $stateParams.note;
                    }
                },
                activeMenuItem: 'note'
            }
        ).state('meeting-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Appointments");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.meeting;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/meetings?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers',
                component: 'meetingList',
                needsAuth: true,
                activeMenuItem: 'meeting',
                reloadOnSearch: false
            }
        ).state('meeting-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Appointments") + " - " + $queryParams.meeting.title;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.meeting.title;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.meeting;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('meeting-list')
                    ];
                },
                url: '/meetings/{meeting:meeting}',
                component: 'meetingView',
                needsAuth: true,
                'resolve': {
                    meeting: function ($stateParams) {
                        'ngInject';

                        return $stateParams.meeting;
                    }
                },
                activeMenuItem: 'meeting'
            }
        ).state('task-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    if ($queryParams.showOnlyMyElements) {
                        return gettextCatalog.getString("My Tasks");
                    }

                    return gettextCatalog.getString("Tasks");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.task;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/tasks?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers&filterSelectedTaskStates',
                component: 'taskList',
                needsAuth: true,
                activeMenuItem: 'task',
                reloadOnSearch: false
            }
        ).state('task-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Tasks") + " - #" +
                        $queryParams.task.task_id + ": " + $queryParams.task.title;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.task.title;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.task;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('task-list')
                    ];
                },
                url: '/tasks/{task:task}',
                component: 'taskView',
                needsAuth: true,
                resolve: {
                    task: function ($stateParams) {
                        'ngInject';

                        return $stateParams.task;
                    }
                },
                activeMenuItem: 'task'
            }
        ).state('file-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    if ($queryParams.showOnlyMyElements) {
                        return gettextCatalog.getString("My Files");
                    }

                    return gettextCatalog.getString("Files");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.file;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/files?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers',
                component: 'fileList',
                needsAuth: true,
                activeMenuItem: 'file',
                reloadOnSearch: false
            }
        ).state('file-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Files") + " - " + $queryParams.file.name;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.file.name;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.file;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('file-list')
                    ];
                },
                url: '/files/{file:file}',
                component: 'fileView',
                needsAuth: true,
                'resolve': {
                    file: function ($stateParams) {
                        'ngInject';

                        return $stateParams.file;
                    }
                },
                activeMenuItem: 'file'
            }
        ).state('dmp-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("DMPs");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.dmp;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/dmps?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers',
                component: 'dmpList',
                needsAuth: true,
                activeMenuItem: 'dmp',
                reloadOnSearch: false
            }
        ).state('dmp-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("DMPs") + " - " + $queryParams.dmp.title;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.dmp.title;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.dmp;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('dmp-list')
                    ];
                },
                url: '/dmps/{dmp:dmp}',
                component: 'dmpView',
                needsAuth: true,
                'resolve': {
                    dmp: function ($stateParams) {
                        'ngInject';

                        return $stateParams.dmp;
                    }
                },
                activeMenuItem: 'dmp'
            }
        ).state('labbook-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("LabBooks");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.labbook;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/labbooks?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers',
                component: 'labbookList',
                needsAuth: true,
                activeMenuItem: 'labbook',
                reloadOnSearch: false
            }
        ).state('labbook-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("LabBooks") + " - " +
                        $queryParams.labbook.title;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.labbook.title;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.labbook;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('labbook-list')
                    ];
                },
                url: '/labbooks/{labbook:labbook}',
                component: 'labbookView',
                needsAuth: true,
                'resolve': {
                    labbook: function ($stateParams) {
                        'ngInject';

                        return $stateParams.labbook;
                    }
                },
                activeMenuItem: 'labbook'
            }
        ).state('picture-edit',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Picture Edit");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.picture;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/pictures/demo',
                component: 'pictureEdit',
                needsAuth: true,
                'resolve': {},
                activeMenuItem: 'picture'
            }
        ).state('picture-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Pictures");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.picture;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/pictures?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers',
                component: 'pictureList',
                needsAuth: true,
                activeMenuItem: 'picture',
                reloadOnSearch: false
            }
        ).state('picture-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Pictures") + " - " +
                        $queryParams.picture.title;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.picture.title;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.picture;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('picture-list')
                    ];
                },
                url: '/pictures/{picture:picture}',
                component: 'pictureView',
                needsAuth: true,
                'resolve': {
                    picture: function ($stateParams) {
                        'ngInject';

                        return $stateParams.picture;
                    }
                },
                activeMenuItem: 'picture'
            }
        ).state('kanbanboard-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Task Boards");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.kanbanboard;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/kanbanboards?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers',
                component: 'kanbanboardList',
                needsAuth: true,
                activeMenuItem: 'kanbanboard',
                reloadOnSearch: false
            }
        ).state('kanbanboard-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Task Boards") + " - " +
                        $queryParams.kanbanboard.title;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.kanbanboard.title;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.kanbanboard;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('kanbanboard-list')
                    ];
                },
                url: '/kanbanboards/{kanbanboard:kanbanboard}',
                component: 'kanbanboardView',
                needsAuth: true,
                'resolve': {
                    kanbanboard: function ($stateParams) {
                        'ngInject';

                        return $stateParams.kanbanboard;
                    }
                },
                activeMenuItem: 'kanbanboard'
            }
        ).state('drive-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";
                    return gettextCatalog.getString("Storages");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";
                    return IconImagesService.mainElementIcons.drive;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/drives?showOnlyMyElements&filterProjects&filterSearchField&filterSelectedUsers',
                component: 'driveList',
                needsAuth: true,
                activeMenuItem: 'drive',
                reloadOnSearch: false
            }
        ).state('drive-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";
                    return gettextCatalog.getString("Storage") + " - " +
                        $queryParams.drive.title;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.drive.title;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";
                    return IconImagesService.mainElementIcons.drive;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('drive-list')
                    ];
                },
                url: '/drives/{drive:drive}',
                component: 'driveView',
                needsAuth: true,
                'resolve': {
                    drive: function ($stateParams) {
                        'ngInject';
                        return $stateParams.drive;
                    }
                },
                activeMenuItem: 'drive'
            }
        ).state('project-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Projects");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.project;
                },
                url: '/projects',
                component: 'projectList',
                needsAuth: true,
                activeMenuItem: 'project'
            }
        ).state('project-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Projects") + " - " + $queryParams.project.name;
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.project;
                },
                url: '/projects/{project:project}',
                component: 'projectView',
                needsAuth: true,
                'resolve': {
                    project: function ($stateParams) {
                        'ngInject';

                        return $stateParams.project;
                    }
                },
                activeMenuItem: 'project'
            }
        ).state('history-list',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Last Activities");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.genericIcons.history;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/history?filterProjects',
                component: 'historyList',
                needsAuth: true,
                activeMenuItem: 'history'
            }
        ).state('metadata-search',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Metadata Search");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.searchIcon;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [];
                },
                url: '/metadata-search',
                component: 'metadataSearchView',
                needsAuth: true,
                activeMenuItem: null
            })
        // Resources
            .state('resource-list',
                {
                    title: function ($queryParams, gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("Resources");
                    },
                    icon: function ($queryParams, IconImagesService) {
                        "ngInject";

                        return IconImagesService.mainElementIcons.resource;
                    },
                    breadcrumb: function ($queryParams, $state, gettextCatalog) {
                        "ngInject";

                        return [];
                    },
                    url: '/resources?filterProjects',
                    component: 'resourceList',
                    needsAuth: true,
                    activeMenuItem: 'resource'
                }
            ).state('resource-view',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Resources - Detail View");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.resource;
                },
                simpleTitle: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return $queryParams.resource.name;
                },
                breadcrumb: function ($queryParams, $state, gettextCatalog) {
                    "ngInject";

                    return [
                        $state.target('resource-list')
                    ];
                },
                url: '/resources/{resource:resource}',
                component: 'resourceView',
                needsAuth: true,
                resolve: {
                    resource: function ($stateParams) {
                        'ngInject';

                        return $stateParams.resource;
                    }
                },
                activeMenuItem: 'resource'
            }
        ).state('schedule',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Calendar");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.meeting;
                },
                breadcrumb: function () {
                    return [];
                },
                url: '/schedule?filterProjects',
                component: 'scheduleView',
                needsAuth: true,
                activeMenuItem: 'schedule'
            }
        ).state('study-room-booking',
            {
                title: function ($queryParams, gettextCatalog) {
                    "ngInject";

                    return gettextCatalog.getString("Study Room Booking");
                },
                icon: function ($queryParams, IconImagesService) {
                    "ngInject";

                    return IconImagesService.mainElementIcons.meeting;
                },
                breadcrumb: function () {
                    return [];
                },
                url: '/study-room-booking',
                component: 'studyRoomView',
                needsAuth: true
            })
        // User profile
            .state('preferences',
                {
                    url: '/preferences',
                    component: 'userProfile',
                    needsAuth: true
                }
            )
            .state('preferences/password',
                {
                    url: '/preferences/password',
                    component: 'userProfilePassword',
                    needsAuth: true
                }
            )
            .state('preferences/userSettings',
                {
                    url: '/preferences/userSettings',
                    component: 'userSettings',
                    needsAuth: true,
                    title: function (gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("Settings");
                    },
                    breadcrumb: function () {
                        return [];
                    }
                }
            )
            .state('notifications',
                {
                    url: '/notifications',
                    component: 'notificationsList',
                    needsAuth: true,
                    title: function (gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("Notifications");
                    },
                    icon: function () {
                        "ngInject";

                        return "fa fa-bell";
                    },
                    breadcrumb: function () {
                        return [];
                    }
                }
            )
            .state('notifications/redirect',
                {
                    url: '/notifications/{notification:notification}',
                    component: 'notificationRedirect',
                    needsAuth: true,
                    title: function (gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("Notifications");
                    },
                    icon: function () {
                        "ngInject";

                        return "fa fa-bell";
                    },
                    breadcrumb: function () {
                        return [];
                    },
                    resolve: {
                        notification: function ($stateParams) {
                            'ngInject';

                            return $stateParams.notification;
                        }
                    }
                }
            )
            .state('usermanual',
                {
                    url: '/usermanual',
                    component: 'userManualList',
                    needsAuth: true,
                    title: function ($queryParams, gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("User Manual");
                    },
                    icon: function ($queryParams, IconImagesService) {
                        "ngInject";

                        return "fa fa-question-circle";
                    },
                    breadcrumb: function () {
                        return [];
                    },
                    activeMenuItem: 'userManual'
                }
            )
            .state('usermanual/staff',
                {
                    url: '/usermanual/staff',
                    component: 'userManualStaff',
                    needsAuth: true,
                    title: function ($queryParams, gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("User Manual - Staff");
                    },
                    simpleTitle: function ($queryParams, gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("Staff");
                    },
                    icon: function ($queryParams) {
                        "ngInject";

                        return "fa fa-question-circle";
                    },
                    breadcrumb: function ($state) {
                        "ngInject";

                        return [
                            $state.target('usermanual')
                        ];
                    },
                    activeMenuItem: 'userManual'
                }
            )
            .state('usermanual/category',
                {
                    url: '/usermanual/{userManualCategory:usermanualcategory}',
                    component: 'userManualCategoryView',
                    needsAuth: true,
                    title: function ($queryParams, gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("User Manual") + " - " + $queryParams.userManualCategory.title;
                    },
                    simpleTitle: function ($queryParams, gettextCatalog) {
                        "ngInject";

                        return $queryParams.userManualCategory.title;
                    },
                    icon: function ($queryParams) {
                        "ngInject";

                        return "fa fa-question-circle";
                    },
                    breadcrumb: function ($state) {
                        "ngInject";

                        return [
                            $state.target('usermanual')
                        ];
                    },
                    resolve: {
                        userManualCategory: function ($stateParams) {
                            'ngInject';

                            return $stateParams.userManualCategory;
                        }
                    },
                    activeMenuItem: 'userManual'
                }
            )
            .state('login',
                {
                    title: function ($queryParams, gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("Login");
                    },
                    url: 'login',
                    template: 'Login'
                }
            )
            .state('passwordReset',
                {
                    title: function ($queryParams, gettextCatalog) {
                        "ngInject";

                        return gettextCatalog.getString("Reset Password");
                    },
                    url: '/password_reset/{password_reset_token}',
                    component: 'passwordReset',
                    resolve: {},
                    needsAuth: false
                }
            )
            .state('notFound',
                {
                    url: '/notFound',
                    templateUrl: 'js/notFound.html',
                    needsAuth: false
                }
            );

        // $urlRouterProvider.otherwise('login');
    });

    app.config(['$locationProvider', function ($locationProvider) {
        // use the old hash (#) as URL prefix instead of hash bang (#!) (new default since AngularJS 1.6)
        // (static links in the old format are used in password reset mails for example)
        $locationProvider.hashPrefix('');
    }]);

    app.run(function ($state, $transitions) {
        "ngInject";

        $transitions.onError({}, function (transition) {
            if (transition._error.status == 404) {
                $state.go('notFound');
            } else {
                // other error
                console.log(transition);
                console.log("Unknown error while redirecting...");
            }
        });
    });
})();
