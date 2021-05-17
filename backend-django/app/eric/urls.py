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
from django.contrib.auth.views import LoginView, LogoutView
from django.views.generic import TemplateView
from rest_framework.documentation import include_docs_urls
from rest_framework.schemas import get_schema_view

from eric.core.rest.routers import get_api_router

API_BASE = r'^api/'

router = get_api_router()
schema_view = get_schema_view(title='API')

urlpatterns = [
    url(r'^admin/settings/', include('dbsettings.urls')),
    url(r'^admin/', admin.site.urls),

    url(r'^schema/$', schema_view),  # schema definition for Django Rest Framework
    url(r'^docs/', include_docs_urls(title="eRIC Workbench API")),
    url(r'^api/cms/', include('eric.cms.urls')),

    url(API_BASE, include('eric.core.urls')),

    url(r'webdav/', include('eric.webdav.urls')),
    url(r'caldav/', include('eric.caldav.urls')),
    url(r'short_url/', include('eric.short_url.urls')),

    url(API_BASE, include('eric.site_preferences.urls')),
    url(API_BASE, include('eric.user_manual.urls')),
    url(API_BASE, include('eric.search.urls')),  # fts search
    url(API_BASE, include('eric.model_privileges.urls')),
    url(r'^api/relations/', include('eric.relations.urls')),  # element links
    url(API_BASE, include('eric.shared_elements.urls')),
    url(API_BASE, include('eric.versions.urls')),  # workbench entity versions
    url(API_BASE, include('eric.metadata.urls')),  # metadata fields and search
    url(API_BASE, include('eric.dmp.urls')),
    url(API_BASE, include('eric.dss.urls')),
    url(API_BASE, include('eric.labbooks.urls')),
    url(API_BASE, include('eric.pictures.urls')),
    url(API_BASE, include('eric.plugins.urls')),
    url(API_BASE, include('eric.kanban_boards.urls')),  # task boards
    url(API_BASE, include('eric.drives.urls')),  # storages
    url(API_BASE, include('eric.sortable_menu.urls')),  # sortable navigation menu
    url(API_BASE, include('eric.dashboard.urls')),
    url(API_BASE, include('eric.contact_form.urls')),
    url(API_BASE, include('eric.notifications.urls')),
    url(API_BASE, include('eric.favourites.urls')),
    url(API_BASE, include('eric.base64_image_extraction.urls')),
    url(API_BASE, include('eric.projects.urls')),
    url(API_BASE, include('eric.public_user_groups.urls')),
    url(API_BASE, include('eric.appointments.urls')),
    url(API_BASE, include('eric.faq.urls')),
    url(API_BASE, include(router.urls)),  # DRF router URLs

    # core authentication
    url(r'^api/auth/', include('django_rest_multitokenauth.urls', namespace='multitokenauth')),
    url(r'^api/auth/reset_password/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    url(r'^login/', LoginView.as_view(template_name='login.html'), name='login'),
    url(r'^logout/', LogoutView.as_view(), name='logout'),

    url(r'^ckeditor/', include('ckeditor_uploader.urls')),
    url(r'^openapi/', include('eric.openapi.urls')),

    url(r'^', include(monitor_urls)),  # Anexia Version Monitoring
]

# serve debug toolbar in debug mode
if settings.DEBUG and 'debug_toolbar' in settings.INSTALLED_APPS:
    import debug_toolbar

    urlpatterns += [
        url(r'^__debug__/', include(debug_toolbar.urls)),
    ]

# serve media root for uploaded profile images in debug mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# serve a "/" for webdav in debug mode
if settings.DEBUG:
    urlpatterns += [
        url(r'^$', TemplateView.as_view(template_name='empty.html'), name='webdav-home')
    ]
