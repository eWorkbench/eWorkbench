.. _drives_webdav:

Drives and WebDav
=================

Drive/Storage
-------------

The implementation details for Drive are in the ``eric.drives`` app.
The ``Drive`` model (called Storage within the Frontend) contains Directories (called Folder within the Frontend),
and each ``Directory`` can contain multiple other Directories or Files.

Therefore, the ``File`` model has a Foreign Key to a ``Directory``:

.. code:: python

    class File(...):
        
        # ...

        directory = models.ForeignKey(
            'drives.Directory',
            verbose_name=_("Directory of a Drive where the file is stored at"),
            related_name='files',
            on_delete=models.SET_NULL,
            blank=True,
            null=True
        )


However, a ``File`` can not be directly assigned to a ``Drive``. Instead, we always create a **virtual root directory**,
which is handled in ``eric/drives/models/handlers.py`` in the function ``create_new_root_directory_for_drive``.
In addition, there can only be one **virtual root directory**, which is handled in the function ``ensure_only_one_root_directory``.


WebDav Integration
------------------

WebDav integration was accomplished using `DjangoDav <https://github.com/anx-ckreuzberger/djangodav>`_ within the ``eric.webdav`` app.

The entrypoint for developers would be the ``urls.py`` aswell as ``resources.py``. 

* Authentication:
  Authentication for WebDav is handled via Basic Authentication. The WebDav client always has to send the ``Authorization`` header. 
  As this behaviour is quite insecure, it is highly recommended that WebDav is only used over secure HTTP connections (SSL/TLS).

* Authentication Caching:
  As every call to the WebDav endpoint contains a Basic Authentication Header, a potentially expensive Database and/or LDAP call need to
  be made. This sums up to a lot of calls, which will slow down all involved servers, and in the last instance, the user. 
  To improve this behaviour, we implemented a caching scheme for the ``Authorization`` header. The details of this implementation can be
  found in the class ``CachedBasicAuthentication``.

* Available Endpoints:
  The following endpoints are made available via WebDav:

  * List of all Drives: ``/webdav/d/``
  * List of all Directories and Files within a Drive: ``/webdav/d/${drive_title} (${drive_pk})``
  * Access a specific file in a directory within the Drive: ``/webdav/d/${drive_title} (${drive_pk})/${directory_name}/${directory_name}/${directory_name}/${file_name}``
  * List of all Projects: ``/webdav/p/``
  * List of all Drives within a Project: ``/webdav/p/${project_title} (${project_pk})``
  * Below the projects, the same structure as for drives is available

* Virtual Root Directory:
  Each Drive has a Virtual Root Directory, named ``/``. When accessing a drive, the contents of this virtual root
  directory are displayed. This task sounds simple, but was quite hard to accomplish, as we had to overwrite the
  following functions within ``MyDriveDavResource``:

  * ``__init__``: We need to query the virtual root and put the object in ``kwargs["obj"]``
  * ``get_model_by_path`` needs to make sure that the given path always contains the virtual root directory
  * ``get_parent_path`` also needs to make sure that the path always starts with a ``/``, indicating that the
    virtual root directory is used.


WebDav mapping from Windows VM to local dev server
------------------

If the mapping doesn't work for local dev servers set the following registry key in your windows wm:

1. Right-click Start and select Run.
2. Type regedit and press Enter to open Windows Registry Editor.
3. Go to the directory path: “HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\WebClient\Parameters.”
4. Modify BasicAuthLevel and set "Value data" to 2.
