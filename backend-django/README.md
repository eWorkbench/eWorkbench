# eRIC Workbench Backend

This repo contains the sourcecode of the eRIC Workbench backend. There is a separate repository for the frontend based on AngularJS.

The backend consists of an authenticated REST API built with Python 3, Django 1.11 and DjangoRestFramework.

See also:
* [Development Setup](README_DevSetup.md)
* [Commands](README_Commands.md)
* [General Changelog](CHANGELOG.md)
* [API Changelog](api-changes.md)

## Installation instructions for a production system
This README contains information for developers only. If you are looking for installation instructions, please take a 
look at the [docs/](docs/) folder.

## API documentation
OpenAPI/Swagger and Redoc documentation is generated automatically (by drf-yasg) and provided via the following endpoints:
* /openapi/swagger
* /openapi/redoc

Those endpoints might be called
* via http://0.0.0.0:8000/openapi/swagger/ in a Docker development setup
* or via https://mydomain.com/openapi/swagger/ in a production setup

You will only see those endpoints that are accessible by the currently logged-in user.
You may log in
* via the admin interface (if you are using a staff or superuser account)
* or via the "Django Login" link in the Swagger UI which will redirect you to a login page specifically for the API.

The "Authorize" function in the Swagger UI lets you enter your API token (e.g. "Token 987f89asdfas789df789dsf879safsd87f8sd"),
which will be used when running requests via the interface ("Try it out" and "execute" function).

The API token can be obtained by logging in in the frontend and inspecting the response of the `/api/auth/login` request.

The API documentation is generated automatically and not all shown information is completely accurate.
Some parameters (or POST data items) might be missing from the documentation, but required for a successful request.
The API response will tell you if more data is required.
The documentation will also show parameters that are not required (or even not expected to be sent).
Absolutely necessary data is marked as required in the documentation and can be used as the starting point of building more complex requests.

## Generating the Sphinx documentation

```bash
pip install sphinx
cd docs
make html
```

## Coding Conventions
Please follow general python coding conventions (i.e., [Pep8]).
There is one exception: We do allow up to 120 characters per line.
If you want to verify that your code matches those guidelines, you can use the ``pep8``/``pycodestyle`` tool:
* Install:
```bash
pip install pycodestyle
```

* Verify:
```bash
cd app/
find . -name "*.py" ! -path "*migrations*" ! -path "*tests*" -exec pycodestyle --max-line-length=120 --ignore=E402 {} +
```

# Project related external resources

[Django]: https://docs.djangoproject.com/en/1.11/
[Django REST Framework]: http://www.django-rest-framework.org/
[Django CORS headers]: https://github.com/ottoyiu/django-cors-headers
[Django debug toolbar]: https://django-debug-toolbar.readthedocs.io/en/stable/
[Pep8]: https://www.python.org/dev/peps/pep-0008/

* [Django]
* [Django REST Framework]
* [Django CORS headers]
* [Django debug toolbar]
* [Pep8]
