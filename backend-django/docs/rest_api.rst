.. _RESTAPI:

REST API
========

We are using Django Rest Framework, which creates the documentation from inline comments. As an entrypoint, you need
to run the Django Server and login into the Admin panel as a superuser. After this you can go to the /api/ site (e.g.,
http://workbench.local:8000/api/) and navigate through a browsable API.

In addition, there is an automatic generated ``schema`` definition available at the ``/api/schema/`` endpoint.

Auth
----
For auth we are using `Django REST MultiAuthToken <https://github.com/anx-ckreuzberger/django-rest-multiauthtoken>`_.
The endpoints made available are:

* ``/api/auth/login`` - takes ``username`` and ``password``
* ``/api/auth/logout`
* ``/api/auth/reset_password``
* ``/api/auth/reset_password/confirm``

For all authenticated calls to the API the auth token needs to be transmitted as a HTTP Header, e.g.:

.. code::

    Authorization: Token abc12...........xyz

