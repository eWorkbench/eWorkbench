.. _downloadAndExports:

Download and Exports via REST API
=================================

Authorization with JSON Web Tokens via GET Parameter
----------------------------------------------------

Within the eRIC Workbench Frontend Application (AngularJS) we are using Authorization headers (see RESTAPI_). However,
for download/save as/open in new tab functionality to work, it is necessary to allow authorization via a get parameter.

We are handling this via JSON Web Tokens, which are verified and checked for validation in
``eric.jwt_auth.authentication.JWTAuthentication``. Essentially, the JWT needs to be passed as a get parameter as
follows (example for a single task): ``http://workbench.local:8000/api/tasks/{task_pk}/export/?jwt={jwt}``

The JWT must have at least the following parameters to pass verification and validation:

- ``user``
  the primary key of the user that generated the token
- ``path``
  the base API path of the endpoint that is called, e.g., ``/api/tasks/{task_pk}/export/``
- ``jwt_verification_token``
  the users JWT verification token, which needs to match ``user.userprofile.jwt_verification_token``;
  this enables revoking a JWT afterwards (by changing ``jwt_verification_token`` in the database)

For generating a JWT we use the `PyJWT <https://pypi.python.org/pypi/PyJWT>`_ library.

Obtaining a JWT is specific to the export/download, see below.

PDF Export for a single object
------------------------------

Each object (task, meeting, contact, note, file, dmp) of the workbench can be exported as a PDF. The workflow is as
follows:

1. Call ``get_export_link`` API endpoint of the desired object, e.g.:
   ``GET /api/tasks/{task_pk}/get_export_link/``
2. Above API call generates an URL with a JWT in it. You can just call this URL and you will retrieve the PDF

The provided JWT is only valid for a certain amount of time (e.g., 1 hour), which can be configured within the
Workbench Setting ``download_token_validity_in_hours`` (see Settings_).

Models need to define the Meta Class Setting ``export_template``, which needs to point to a template file. If a model
does not define this setting, the API responds with an error (400 Bad Request).

Export functionality is implemented as a generic ``ViewSet`` method in ``eric.core.rest.viewsets`` in class
``ExportableViewSetMixIn``, and API ViewSets for Task, DMP, etc..., just need to inherit from this mixin.

ICAL Export
-----------

The meetings endpoint (``/api/meetings/``) supports an ICAL export. This export also requires the following two steps:

1. Call ``get_export_link`` API endpoint:
   ``GET /api/meetings/get_export_link/``
2. Above API call generates an URL with a JWT in it. You can just call this URL and you will retrieve the ICAL

The provided JWT is valid for ever (only for the ``/api/meetings/export/`` url), therefore enabling the url to be
shared with 3rd-party applications, such as Outlook or Google Calendar.

Public Study Room Booking Export
--------------------------------
There are two publicly available API endpoints that provide booking information for study rooms.

* ``/api/study-room-booking-export/calendar/``
Intended for use with public calendars. Provides the bookings of the next 14 days.

* ``/api/study-room-booking-export/display/``
Intended for use with simple room displays and the Breece system.
Shows a limited amount of upcoming bookings for the current day.
The amount of bookings per room can be defined in the admin area (site preferences).

Access restrictions can be applied via the web-server configuration (e.g. IP address restrictions).
