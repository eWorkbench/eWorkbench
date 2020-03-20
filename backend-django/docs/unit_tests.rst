.. _UnitTests:

Unit Tests / Integration Tests
==============================

This document provides information about unit/integration tests in eRIC Workbench.

General Information
-------------------

Most functionality of eRIC Workbench is triggered via REST API calls, therefore most of our tests are running via
REST API calls (e.g., create a project, assign a new project manager, add a note to a project).

Django Tests
------------

Each Django application contains a ``tests`` directory, which usually contains the test cases in ``test_*.py`` files.
In addition, we usually have a ``core.py`` file which contains Mixin Classes for REST API calls.


AngularJS Tests
---------------

There are a couple of simple tests within the frontend (e.g., the authentication service is tested). Those tests
are stored in the ``tests`` directory.
