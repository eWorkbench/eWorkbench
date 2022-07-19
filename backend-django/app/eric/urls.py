#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" Main URL Config for eric workbench """
from anexia_monitoring import urls as monitor_urls
from django.conf import settings
from django.conf.urls import include
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth.views import LoginView, LogoutView
from django.urls import re_path
from django.views.generic import TemplateView
from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view

from eric.core.rest.routers import get_api_router

API_BASE = r'^api/'

router = get_api_router()
schema_view = get_schema_view(title='API')

urlpatterns = [
    re_path(r'^admin/settings/', include('dbsettings.urls')),
    re_path(r'^admin/', admin.site.urls),

    re_path(r'^schema/$', schema_view),  # schema definition for Django Rest Framework
    re_path(r'^docs/', include_docs_urls(title="eRIC Workbench API")),
    re_path(r'^api/cms/', include('eric.cms.urls')),

    re_path(API_BASE, include('eric.core.urls')),

    re_path(r'webdav/', include('eric.webdav.urls')),
    re_path(r'caldav/', include('eric.caldav.urls')),
    re_path(r'short_url/', include('eric.short_url.urls')),

    re_path(API_BASE, include('eric.site_preferences.urls')),
    re_path(API_BASE, include('eric.user_manual.urls')),
    re_path(API_BASE, include('eric.search.urls')),  # fts search
    re_path(API_BASE, include('eric.model_privileges.urls')),
    re_path(r'^api/relations/', include('eric.relations.urls')),  # element links
    re_path(API_BASE, include('eric.shared_elements.urls')),
    re_path(API_BASE, include('eric.versions.urls')),  # workbench entity versions
    re_path(API_BASE, include('eric.metadata.urls')),  # metadata fields and search
    re_path(API_BASE, include('eric.dmp.urls')),
    re_path(API_BASE, include('eric.dss.urls')),
    re_path(API_BASE, include('eric.labbooks.urls')),
    re_path(API_BASE, include('eric.pictures.urls')),
    re_path(API_BASE, include('eric.plugins.urls')),
    re_path(API_BASE, include('eric.kanban_boards.urls')),  # task boards
    re_path(API_BASE, include('eric.drives.urls')),  # storages
    re_path(API_BASE, include('eric.sortable_menu.urls')),  # sortable navigation menu
    re_path(API_BASE, include('eric.dashboard.urls')),
    re_path(API_BASE, include('eric.contact_form.urls')),
    re_path(API_BASE, include('eric.notifications.urls')),
    re_path(API_BASE, include('eric.favourites.urls')),
    re_path(API_BASE, include('eric.base64_image_extraction.urls')),
    re_path(API_BASE, include('eric.projects.urls')),
    re_path(API_BASE, include('eric.public_user_groups.urls')),
    re_path(API_BASE, include('eric.appointments.urls')),
    re_path(API_BASE, include('eric.faq.urls')),
    re_path(API_BASE, include(router.urls)),  # DRF router URLs

    # core authentication
    re_path(r'^api/auth/', include('django_rest_multitokenauth.urls', namespace='multitokenauth')),
    re_path(r'^api/auth/reset_password/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    re_path(r'^login/', LoginView.as_view(template_name='login.html'), name='login'),
    re_path(r'^logout/', LogoutView.as_view(), name='logout'),

    re_path(r'^ckeditor/', include('ckeditor_uploader.urls')),
    re_path(r'^openapi/', include('eric.openapi.urls')),

    re_path(r'^', include(monitor_urls)),  # Anexia Version Monitoring
]

# serve debug toolbar in debug mode
if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
    import debug_toolbar

    urlpatterns += [
        re_path(r'^__debug__/', include(debug_toolbar.urls)),
    ]

# serve media root for uploaded profile images in debug mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# serve a "/" for webdav in debug mode
if settings.DEBUG:
    urlpatterns += [
        re_path(r'^$', TemplateView.as_view(template_name='empty.html'), name='webdav-home')
    ]
