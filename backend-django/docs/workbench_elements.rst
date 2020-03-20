Workbench elements
==================

eRIC Workbench consists of multiple elements. The following elements are basic elements and should always be available:

* Note
* Contact
* File
* Meeting
* Task

In addition, depending on the installed applications, the following elements are available:

* KanbanBoard (requires Task)
* Picture
* LabBook (requires Note, File and Picture)
* DMP (Data Management Plan)

Note alias Comment
------------------

A Note consists of a title (subject) and a text (message). The text can be HTML formatted.

Contact
-------

A Contact consists of a firstname, lastname, email address, company name, etc...

File
----

A File consists of a title and an uploaded file. In addition, a File also stores a history of previous versions of the File.

Meeting
-------

A Meeting consists of a title, a description (can be HTML formatted), a start date and an end date.

Task
----

A Task consists of a title, a description (can be HTML formatted), an optional start date and an optional due date.
In addition, a Task can be assigned to one or multiple users.

KanbanBoard alias TaskBoard
---------------------------

A KanbanBoard consists of multiple Kanban Columns, and each column has tasks.

Picture
-------

A Picture consists of JSON Shapes (the vectors for the picture), a PNG background image, and a PNG rendered image.

LabBook
-------

A LabBook consists of multiple cells. Each cell can be a

* File
* Note
* Picture

Drive alias Storage
-------------------

A Drive contains multiple directories, which then contain Files.

DMP = Data Management Plan
--------------------------

Forms based on templates which are defined by Workbench administrators.
