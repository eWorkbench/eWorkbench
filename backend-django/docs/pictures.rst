Pictures
========

This section describes special features and functionality of the Picture component. For Workbench specific features,
such as Delete/Restore, Model Privileges, etc..., please see the more generic sections.

Feature Description
-------------------

A Picture is a Workbench Element, which contains a drawing board (implemented via Literally Canvas within the frontend app).
A user can upload one or multiple pictures, move and resize those pictures, aswell as draw on the whole board (pen, line, rectangle, circle).


The `Literally Canvas <http://literallycanvas.com/>`_ library provides several ``tools`` to modify the provided canvas.
Each modification of the canvas is stored as a so called ``shape``. The library works on all modern browsers (Internet
Explorer, Edge, Firefox, Chrome) and operating system (Windows, Linux, Android, iOS). With this library it is
possible to export the drawing (the shapes) as a PNG aswell as JSON.

Technical Description
---------------------

In the backend we store the drawing in the form of two files:

* shapes file (JSON) and the
* rendered picture (PNG)

This provides both, a good way to edit aswell as preview the rendering, without having to actually render the picture on the server side.

When a picture is deleted, we need to make sure to delete all related files (the json file, the png files, etc...).

User Interface
--------------

Literally Canvas provides its own React based toolbar (user interface), however, for eRIC Workbench we had different
requirements, which lead to needing to rewrite the toolbar in AngularJS. This also enables a better integration (e.g.,
save button), without having to talk to a React component from within AngularJS.

