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
