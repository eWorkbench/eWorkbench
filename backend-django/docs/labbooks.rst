LabBooks
========

This section describes special features and functionality of the LabBook component. For Workbench specific features,
such as Delete/Restore, Model Privileges, etc..., please see the more generic sections.

Feature Description
-------------------

A LabBook is a Workbench Element, which contains a Grid (implemented via angular-gridster within the frontend app),
whereas several other workbench elements can be positioned within the grid. Those elements are called child elements:

* Note
* Picture
* File

The main idea is to provide a quick and easy way to upload files, aswell as write texts and draw on pictures.

Also, the user should be able to move and resize each item within the LabBook.


Technical Description
---------------------

In the backend we store the relation between a LabBook and each child element in the ``LabBookChildElement`` model,
which contains a Generic Foreign Key (to either Note, Picture or File).

If the linked child element is deleted (e.g., a picture), we need to make sure that the respective ``LabBookChildElement``
is deleted. This is done in the function/handler ``on_delete_labbook_element`` in ``app/eric/labbooks/models/handlers.py``.


Privileges and Permissions
--------------------------

Each Picture, File and Note within a LabBook can be viewed/changed by each user that is allowed to change the LabBook.
This privilege is inherited within ``app/eric/labbooks/models/model_privileges.py`` aswell as ``app/eric/labbooks/models/querysets.py``.
