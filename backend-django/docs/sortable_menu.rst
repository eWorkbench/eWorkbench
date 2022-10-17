.. _sortableMenu:

Sortable Menu
=============

eRIC Workbench comes with a personalizable menu. This is handled in the django app ``eric.sortable_menu`` on a
per-user base.

When a user logs in for the first time, a default menu is populated for the user in
``eric.sortable_menu.models.handlers`` in the ``create_menu_entries_on_auth`` method. The default menu can be
configured within eRIC Workbench Settings ``default_menu_entries`` (see :ref:`settings`).

If the ``default_menu_entries`` setting is changed, a sync needs to be performed. This can be done by using the 
``sync_sortable_menu`` command:

.. code:: bash

    python manage.py sync_sortable_menu
