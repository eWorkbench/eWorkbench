.. _storageQuota:

Storage Quota
=============

Storage Limit/Quota is defined and calculated in ``eric.projects.models.models``. Each User receives a custom ``UserStorageLimit``,
which by default is initialized by ``settings.DEFAULT_QUOTA_PER_USER_MEGABYTE`` (see :ref:`settings` for details).

This quota is set to an integer greater than 0, specifying the maximum number of MegaByte that a single user can have stored within
eRIC Workbench. If a user tries to upload files which would exceed this quota, an exception is raised and the file is not stored.
This is handled by ``FileSystemStorageLimitByUser`` aswell as ``FileSystemStorageLimitByUserUploadHandler``.

FileSystemStorageLimitByUser
----------------------------

Whenever a File is saved, it should be saved in this storage. This needs to be configured for the respective fields, e.g., ``FileField``:

.. code:: python

    some_file = models.FileField(
        storage=FileSystemStorageLimitByUser()
    )


FileSystemStorageLimitByUserUploadHandler
-----------------------------------------

Whenever a File Upload with MultiPart is started, the file is saved either in a temp file or in memory, before being processed. This is potentially
bad, as a user that wants to upload a file with 10 GigaByte will cause the system to temporarily store a 10 GigaByte file, even if the user has a quota
of 100 MegaByte. To prevent this from happening, we intercept the upload using a Django UploadHandler, which needs to be specified within the 
``settings.py`` file:

.. code:: python

    FILE_UPLOAD_HANDLERS = [
        'eric.projects.models.models.FileSystemStorageLimitByUserUploadHandler',
        'django.core.files.uploadhandler.TemporaryFileUploadHandler',
    ]