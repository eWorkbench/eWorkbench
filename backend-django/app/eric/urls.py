#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" Main URL Config for eric workbench """
from anexia_monitoring import urls as monitor_urls
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib import admin
from django.views.generic import TemplateView
from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view

from eric.core.rest.routers import get_api_router

router = get_api_router()

# generate schema definition for REST
schema_view = get_schema_view(title='API')

urlpatterns = [
    # include dbsettings URL
    url(r'^admin/settings/', include('dbsettings.urls')),

    url(r'^admin/', admin.site.urls),

    # schema definition for Django Rest Framework
    url(r'^schema/$', schema_view),

    url(r'^docs/', include_docs_urls(title="eRIC Workbench API")),

    url(r'^api/cms/', include('eric.cms.urls')),

    url(r'api/', include('eric.core.urls')),

    # include webdav
    url(r'webdav/', include('eric.webdav.urls')),

    # include caldav
    url(r'caldav/', include('eric.caldav.urls')),

    # short URLs
    url(r'short_url/', include('eric.short_url.urls')),

    # site preferences
    url(r'api/', include('eric.site_preferences.urls')),

    # user manual
    url(r'^api/', include('eric.user_manual.urls')),

    # fts (search)
    url(r'^api/', include('eric.search.urls')),

    # include eric model privileges url
    url(r'^api/', include('eric.model_privileges.urls')),

    # include eric relations (links)
    url(r'^api/relations/', include('eric.relations.urls')),

    # include shared elements
    url(r'^api/', include('eric.shared_elements.urls')),
    url(r'^api/', include('eric.versions.urls')),  # workbench entity versions
    url(r'^api/', include('eric.metadata.urls')),  # metadata fields and search
    url(r'^api/', include('eric.dmp.urls')),

    # include labbooks
    url(r'^api/', include('eric.labbooks.urls')),

    # include pictures
    url(r'^api/', include('eric.pictures.urls')),

    # include kanban boards
    url(r'^api/', include('eric.kanban_boards.urls')),

    # include drives
    url(r'^api/', include('eric.drives.urls')),

    # include eric sortable menu
    url(r'^api/', include('eric.sortable_menu.urls')),

    # dashboard
    url(r'^api/', include('eric.dashboard.urls')),

    # contact form
    url(r'^api/', include('eric.contact_form.urls')),

    # notifications
    url(r'^api/', include('eric.notifications.urls')),

    # base64 image extraction
    url(r'^api/', include('eric.base64_image_extraction.urls')),

    # include the whole API from eric workbench
    url(r'^api/', include('eric.projects.urls')),

    # public user groups
    url(r'^api/', include('eric.public_user_groups.urls')),

    # "all" REST Endpoints
    url(r'^api/', include(router.urls)),

    # include core auth
    url(r'^api/auth/', include('django_rest_multitokenauth.urls', namespace='multitokenauth')),
    url(r'^api/auth/reset_password/', include('django_rest_passwordreset.urls', namespace='password_reset')),

    # Anexia monitoring urls
    url(r'^', include(monitor_urls)),

    # ckeditor uploader urls
    url(r'^ckeditor/', include('ckeditor_uploader.urls')),
]

# print("Serving", settings.MEDIA_URL, "at", settings.MEDIA_ROOT)

if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
    import debug_toolbar
    # serve django debug toolbar
    # ToDo: log this
    urlpatterns += [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ]

# serve media root for uploaded profile images
if settings.DEBUG:
    # ToDo: Log this
    # print("Serving medias in {media_root} as {media_url}".format(
    #     media_url=settings.MEDIA_URL, media_root=settings.MEDIA_ROOT)
    # )
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# serve a "/" for webdav
if settings.DEBUG:
    urlpatterns += [
        url(r'^$', TemplateView.as_view(template_name='empty.html'), name='webdav-home')
    ]
