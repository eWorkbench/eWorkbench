#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.urls import re_path

from eric.webdav.wsgidav_acls import FullAcl, ReadOnlyAcl
from eric.webdav.wsgidav_locks import DummyLock

from eric.projects.views import IsAuthenticatedViews
from eric.webdav.resources2 import MyDriveDavResource, MyDriveListResource, MyProjectListResource, AuthFsDavView

urlpatterns = [
    re_path(r'auth/', IsAuthenticatedViews.as_view(), name='is-authenticated'),

    # todo MFI: implement ElementLock instead of DummyLock
    # List all drives (read only)
    re_path(r'^d/$',
        AuthFsDavView.as_view(resource_class=MyDriveListResource, lock_class=DummyLock, acl_class=ReadOnlyAcl),
        name='webdav-list'
        ),

    # List all directories and files within the provided drive
    re_path(r'^d/(?P<drive_title>[\w \-]+) \((?P<drive>[0-9a-f-]+)\)(?P<path>.*)$',
        AuthFsDavView.as_view(resource_class=MyDriveDavResource, lock_class=DummyLock, acl_class=FullAcl),
        name='webdav-drive'
        ),


    # List all projects (read only)
    re_path(r'^p/$',
        AuthFsDavView.as_view(resource_class=MyProjectListResource, lock_class=DummyLock, acl_class=ReadOnlyAcl),
        name='project-list'
        ),

    # List all drives of the selected project (read only)
    re_path(r'^p/(?P<project_title>[\w \-]+) \((?P<project>[0-9a-f-]+)\)/$',
        AuthFsDavView.as_view(resource_class=MyDriveListResource, lock_class=DummyLock, acl_class=ReadOnlyAcl),
        name='project-webdav-list'
        ),

    # List all directories and files within the provided drive (of a project)
    re_path(r'^p/(?P<project_title>[\w \-]+) \((?P<project>[0-9a-f-]+)\)/(?P<drive_title>[\w \-]+) \((?P<drive>[0-9a-f-]+)\)(?P<path>.*)$',  # noqa
        AuthFsDavView.as_view(resource_class=MyDriveDavResource, lock_class=DummyLock, acl_class=FullAcl),
        name='project-webdav-drive'
        ),
]
