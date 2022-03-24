# Changelog


## Version 2.9.3 - March 2022
- [SITUMEWB-841,SITUMEWB-842] Changes to info text for projects in resources

## Version 2.9.2 - March 2022
- [SITUMEWB-829] Fix resource bookable hours validation
- [SITUMEWB-850] Fix save details with changed description
- [SITUMEWB-841] Change projects field info text in resource details
- [SITUMEWB-842] Change projects field info text in resource dialog
- [SITUMEWB-857,SITUMEWB-858] Changes to dynamic metadata appearance

## Version 2.9.1 - March 2022
- [SITUMEWB-857,SITUMEWB-858] Fixed visualization of dynamic metadata when not in edit mode
- [SITUMEWB-848] Fix filterbar settings
- [SITUMEWB-841] Fix tooltip color
- [SITUMEWB-829] Fix resource bookable time slots time picker
- [SITUMEWB-842] Add projects field info tooltip in resource dialogs
- [SITUMEWB-850] Fix enchanced description editor

## Version 2.9 - March 2022
- [SITUMEWB-605] wsgidav initial
- [SITUMEWB-833] Implemented slugs for FAQ
- [SITUMEWB-787] Implemented possibility to duplicate metadata
- [SITUMEWB-829] Refactor resource booking rule bookable hours
- [SITUMEWB-859] change contact email address
- [SITUMEWB-830] Fix scrollbar on storage chip
- [SITUMEWB-*] Fix ellipsis in header
- [SITUMEWB-817] Username in profile
- [SITUMEWB-820] Changed text for back button on Error 404 page
- [SITUMEWB-823] Fixed wording and behavior for new modals
- [SITUMEWB-682] Implemented unsaved changes notification for LabBook sections
- [SITUMEWB-850] Enhanced description editor
- [SITUMEWB-848] Add global settings for filterbar
- [SITUMEWB-841] Add info icon to projects in resource detail view

## Version 2.8.4 - February 2022
- [SITUMEWB-826] fix permissions in hierarchical projects

## Version 2.8.3 - February 2022
- [SITUMEWB-*] Fix matomo tracking

## Version 2.8.2 - January 2022
- [SITUMEWB-819] Fix storage permissions

## Version 2.8.1 - January 2022
- [SITUMEWB-763] Changes to LabBook handlers regarding changes to child elements
- [SITUMEWB-763] Automatic refresh of history for LabBooks when child elements change
- [SITUMEWB-779] Fixed UI issues with metadata in projects for users without edit privileges
- [SITUMEWB-816] Show tooltip on ellipsis elements

## Version 2.8 - December 2021
- [SITUMEWB-760] allow editing elements even with unknown projects
- [SITUMEWB-763] Implemented versioning of LabBook child elements
- [SITUMEWB-*] Fixed rgba regex for task board columns color
- [SITUMEWB-768] Implemented search options for projects
- [SITUMEWB-773] Changes to password reset email
- [SITUMEWB-775] Implemented duplicating DMPs
- [SITUMEWB-779] Added metadata to projects
- [SITUMEWB-784] Fixed assignees reminder blocking the creation or update of appointments
- [SITUMEWB-768] Projects filtermenu
- [SITUMEWB-805] Fix dmp and picture relations
- [SITUMEWB-807] Fix breadcrumbs navigation
- [SITUMEWB-806] Disable tracking with cookies on matomo
- [SITUMEWB-*] Fix linting
- [SITUMEWB-*] Fixed permission handling of LabBook sections
- [SITUMEWB-799] Booking rules placement
- [SITUMEWB-804] Fixed project search on task board details
- [SITUMEWB-773] Disallow email logins
- [SITUMEWB-763] Changes to LabBook permission checks

## Version 2.7.1 - November 2021
- [SITUMEWB-*] Exclude error 504 requests from Toastr messages

## Version 2.7 - November 2021
- [SITUMEWB-778] Overview Element
- [SITUMEWB-782] Fix storage display in file detail view
- [SITUMEWB-764] management command to trash/delete unneeded ms office tmp files which is then run in crontab
- [SITUMEWB-*] Fixed transparency handling of task board columns
- [SITUMEWB-*] Fixed text wrapping on search bar in LabBook draw board
- [SITUMEWB-*] Fixed user chips in modal when adding a plugin to the LabBook
- [SITUMEWB-*] Refined date pipes
- [SITUMEWB-*] Fixed form patching on modals with an initial state set
- [SITUMEWB-*] Changes to metadata validators
- [SITUMEWB-*] Added asterisk to user availability field

## Version 2.6.4 - November 2021
- [SITUMEWB-774,SITUMEWB-695] Fix project hierarchy display for deep project trees

## Version 2.6.3 - November 2021
- [SITUMEWB-745] Resolve infinite loading for project hierarchy in case of holey tree
- [SITUMEWB-772] Fixed displaying full day bookings in calendar views
- [SITUMEWB-750] Changes to task card opener button for description

## Version 2.6.2 - October 2021
- [SITUMEWB-765] Revert overview element

## Version 2.6.1 - October 2021
- [SITUMEWB-765] Fix button triggering twice
- [SITUMEWB-*,SITUMEWB-695,SITUMEWB-699] Fix translations for task boards

## Version 2.6 - October 2021
- [SITUMEWB-669] new datastructure for project hierarchies
- [SITUMEWB-698] backend for task reminder feature
- [SITUMEWB-655] Implemented receiver to prevent inconsistent privileges
- [SITUMEWB-656] Fixed legacy privileges via migration to prevent inconsistent privileges
- [SITUMEWB-761] Removed bubbles from dashboard and remove unneeded elements from dashboard API
- [SITUMEWB-699] Rework task modal & assignee reminders
- [SITUMEWB-436] Remove metadatasearch from search dropdown
- [SITUMEWB-755] Clear metadatasearch completely on select
- [SITUMEWB-695,SITUMEWB-696,SITUMEWB-697,SITUMEWB-699,SITUMEWB-727,SITUMEWB-728] Task / Taskboard settings
- [SITUMEWB-*] Fix maintenance message showing when disabled

## Version 2.5.4 - September 2021
- [SITUMEWB-713] Fix backlog priority filter
- [SITUMEWB-720] Allow created_by and assigned_users filters to be saved

## Version 2.5.3 - September 2021
- [SITUMEWB-675] Increased title length for tasks and notes
- [SITUMEWB-675] Added ellipsis for task and note titles
- [SITUMEWB-558,SITUMEWB-688,SITUMEWB-713] Maintanence fix and extended filter functionality
- [SITUMEWB-475] Fix comment sorting
- [SITUMEWB-694] backend for taskboard user settings

## Version 2.5.2 - September 2021
- [SITUMEWB-*] Fixed payload for new comments
- [SITUMEWB-742] Fix labbook comments on child elements

## Version 2.5.1 - September 2021
- [SITUMEWB-660] Fixed a bug with file-storage assignment without permissions
- [SITUMEWB-531,SITUMEWB-593,SITUMEWB-594] Several fixes for Comments, Links, Filtermenu
- [SITUMEWB-747] Fix redirect for linking to notes
- [SITUMEWB-707] Fixed task cards according to feedback
- [SITUMEWB-711] Changes to task column color behavior on edit
- [SITUMEWB-733] Changed modal title of tasks backlog
- [SITUMEWB-714] Changes to user details
- [SITUMEWB-712] Implemented autofocus directive for task column title field in new modal
- [SITUMEWB-718] Implemented inverted avatars for project members hierarchy
- [SITUMEWB-720] Add filter menu for task boards
- [SITUMEWB-744] Implemented links for task cards
- [SITUMEWB-477,SITUMEWB-475] Comment filtering and sorting
- [SITUMEWB-749] Changes to task card description
- [SITUMEWB-752] Fixed mandatory fields for new DMP modal
- [SITUMEWB-742,SITUMEWB-746,SITUMEWB-688] Fix labels, comments; Allow created by task filter
- [SITUMEWB-713] Backlog filters
- [SITUMEWB-476] Implemented notification for comments on projects
- [SITUMEWB-687] extend filteroptions of task lists
- [SITUMEWB-*] add last_modified_at to cms json response
- [SITUMEWB-707,SITUMEWB-744] replace num_related_notes with num_related_comments for labbooks and taskboards, add num_relations for taskboards
- [SITUMEWB-742] private filter for relations
- [SITUMEWB-752] add viewable method to dmpformqueryset

## Version 2.5 - August 2021
- [SITUMEWB-593] Allow filters to be saved
- [SITUMEWB-691,SITUMEWB-726] Changes to duplicate modal of task boards
- [SITUMEWB-686] Added description field to task boards
- [SITUMEWB-742] Implement new comments and split notes
- [SITUMEWB-593,SITUMEWB-594,SITUMEWB-595,SITUMEWB-596,SITUMEWB-597,SITUMEWB-598,SITUMEWB-599,SITUMEWB-600] Filter menu
- [SITUMEWB-458] Changed Toastr message for contact form
- [SITUMEWB-723] Implemented task checkbox drag and drop ordering
- [SITUMEWB-*] Changed icons according to concept
- [SITUMEWB-*] Changes according to TUM feedback regarding icons and placeholder texts
- [SITUMEWB-580] Changes to highlighting in favorites dropdown
- [SITUMEWB-410] Changes to favorite buttons and behavior
- [SITUMEWB-407] Changes to metadata drag'n'drop
- [SITUMEWB-470] Changes to subproject modal, dropdown elements and other UI elements
- [SITUMEWB-660] Changes to storage assignment for files
- [SITUMEWB-419] Implemented dropdown template for the case of no match
- [SITUMEWB-419] Changed placeholder text for project dropdowns according to customer feedback
- [SITUMEWB-711,SITUMEWB-712] Changes to task boards columns modals according to concept
- [SITUMEWB-*] Fixed change detection on project dropdown when creating a new subproject
- [SITUMEWB-721] Changed position of save and reset buttons on checklist elements
- [SITUMEWB-740] Fixed dropdown element position
- [SITUMEWB-*] drastically improve build time in dev
- [SITUMEWB-436] Changes to metadata search
- [SITUMEWB-474,SITUMEWB-475,SITUMEWB-477] fix comment creation
- [SITUMEWB-*] Changed priority icon colors for tasks according to the concept
- [SITUMEWB-704,SITUMEWB-705,SITUMEWB-706,SITUMEWB-707,SITUMEWB-708,SITUMEWB-709] Changes to task cards
- [SITUMEWB-*] Fixed misspelling in translation file
- [SITUMEWB-718] Changes to user avatar implementation
- [SITUMEWB-474,SITUMEWB-475,SITUMEWB-477] Comments & Details rework
- [SITUMEWB-700,SITUMEWB-702,SITUMEWB-710,SITUMEWB-711] Revamped existing and implemented new modals for task board columns and streamlined the UX
- [SITUMEWB-712] Implemented new task board column modal
- [SITUMEWB-715] Changed assignees modal
- [SITUMEWB-701,SITUMEWB-714] Changes to task backlog modal
- [SITUMEWB-717] Changed the user widget to also display the avatar or initials
- [SITUMEWB-716] Changed wording of assignees and attendees
- [SITUMEWB-474] Comments
- [SITUMEWB-692] Added the possibility of duplicating columns and tasks too when duplicating task boards
- [SITUMEWB-586] Notify attending contacts about an appointment via email
- [SITUMEWB-742] new comment api
- [SITUMEWB-458] Contact form - also send a copy of the mail to the sender
- [SITUMEWB-684] Added description field to task boards
- [SITUMEWB-693] Implemented API endpoint for setting the transparency on all columns of a task board
- [SITUMEWB-722] Add task checklist ordering
- [SITUMEWB-719] taskboard filter settings backend
- [SITUMEWB-700] adjust default color for taskboard columns
- [SITUMEWB-718] add avatar_is_set property to userprofile api
- [SITUMEWB-471] api changes links comments

## Version 2.4 - July 2021
- [SITUMEWB-533] upgrade pillow, pin psycopg2-binary
- [SITUMEWB-533] temporarily pin celery (new version was yanked)
- [SITUMEWB-574,SITUMEWB-657] Prevent already selected user from being shown again in privileges dropdown and other adjustments
- [SITUMEWB-533] Upgrade to angular 12
- [SITUMEWB-677] Implemented autoresizing textareas for task checklist items
- [SITUMEWB-681] Fixed empty white elements in LabBook

## Version 2.3 - June 2021
- [SITUMEWB-432,SITUMEWB-464,SITUMEWB-672] Implement Lazy-Loading, Popover: Notifications, Fix 404 for drives/storages
- [SITUMEWB-494] add existing users to projects on invites
- [SITUMEWB-666] Fixed detection for LabBook element changes regarding PendingChangesGuard
- [SITUMEWB-419] Implemented favorites for select elements
- [SITUMEWB-668] Fixed contact menu entry in footer
- [SITUMEWB-412] Added favorite icon hover effect
- [SITUMEWB-470] Revamped project page to respect the new concept
- [SITUMEWB-532] Changed project states according to new concept
- [SITUMEWB-436] Changes to metadata search
- [SITUMEWB-659] Implemented filter for storage in files list
- [SITUMEWB-494] fix username creation and urls in the docker setup
- [SITUMEWB-411] add is_favourite to resources attending_contacts at meeting endpoint
- [SITUMEWB-663] unpin django version

## Version 2.2.1 - May 2021
- [SITUMEWB-651] Added FAQ page to the frontend
- [SITUMEWB-664] Implemented context menu for tinymce
- [SITUMEWB-634] Fixed text overflow in project timeline

## Version 2.2 - May 2021
- [SITUMEWB-650] added faq in the backend
- [SITUMEWB-645] Use proper locale for browser consistency
- [SITUMEWB-589] Added trashed elements list
- [SITUMEWB-557] Added skeleton content loader
- [SITUMEWB-644] Add sidebar to all detail pages that can be visited from a project
- [SITUMEWB-649] Fix notifications redirect
- [SITUMEWB-652] Fix latex icon being flipped on safari
- [SITUMEWB-661] Implemented sketch functionality to LabBook

## Version 2.1.2 - May 2021
- [SITUMEWB-653] fix ical export where show_meetings_for is not set

## Version 2.1.1 - April 2021
- [SITUMEWB-647] Fixed resourcebooking validation: ignore trashed appointments
- [SITUMEWB-411] Added favorite marking in list and detail views
- [SITUMEWB-638] Changed resource ordering in appointments
- [SITUMEWB-645] Changed calendar slot labels to 24h format
- [SITUMEWB-543] Small frontend changes to DMP implementation

## Version 2.1 - April 2021
- [SITUMEWB-638] Added resource filter and column in the appointment list
- [SITUMEWB-639] Added adjustable granularity for the resource calendar
- [SITUMEWB-640] Added all bookings visible for editors of a resource
- [SITUMEWB-637] Adjusted visibility of data in the resource calendar
- [SITUMEWB-411] Added is_favourite flag for workbench elements

## Version 2.0.3 - April 2021
- [SITUMEWB-620] User search: increase results to 50
- [SITUMEWB-320] Add project gantt chart
- [SITUMEWB-629] Fixed missing service functions for privileges for storages
- [SITUMEWB-*] Fixed loading indicator
- [SITUMEWB-199, SITUMEWB-200] Implemented DMP pages
- [SITUMEWB-627] Fixed Safari bug for project members request
- [SITUMEWB-625] Fixed datepicker
- [SITUMEWB-*] Fixed parent project error handling
- [SITUMEWB-*] Changed error 404 handling for details pages
- [SITUMEWB-487] Implemented matomo tracking
- [SITUMEWB-622] Fix frontend memory performance
- [SITUMEWB-*] Fixed editor images
- [SITUMEWB-*] Implemented a hook for error 404 redirect
- [SITUMEWB-*] Fixed study room bookings

## Version 2.0.2 - April 2021
- [SITUMEWB-612] Update License
- [SITUMEWB-612] Update Github Release Script
- [SITUMEWB-612] Various Frontend Improvements

## Version 2.0.1 - April 2021
- [SITUMEWB-612] Backend: fix oss_licenses
- [SITUMEWB-612] Frontend: fix/ui-settings
- [SITUMEWB-612] Frontend: fix/project-external-user-right

## Version 2.0 - April 2021
- [SITUMEWB-612] Release of the new Angular Frontend

## Version 1.23.6 - March 2021
- [SITUMEWB-612] make cms texts public

## Version 1.23.5 - March 2021
- [SITUMEWB-272] footer cms pages migrations
- [SITUMEWB-533] upgrade pillow - security fix
- [SITUMEWB-612] cms public flag and remove hash from some urls

## Version 1.23.4 - March 2021
- [SITUMEWB-601] dss scanner timeout

## Version 1.23.3 - March 2021
- [SITUMEWB-601] various dss optimisations

## Version 1.23.2 - March 2021
- [SITUMEWB-601] various dss optimisations

## Version 1.23.1 - February 2021
- [SITUMEWB-447] DSS: handle url encoded paths in the globus message consumer
- [SITUMEWB-447] Study room booking exports for displays: adjusted organiser field to display first_name and last_name
- [SITUMEWB-541] full_day flags for meetings and bookable hours resource booking rule
- [SITUMEWB-541] full day validation for bookable hours resource booking rule
- [SITUMEWB-541] use regex pattern to match rgb and rgba colors

## Version 1.23 - January 2021
- [SITUMEWB-447] Study room booking exports for displays
- [SITUMEWB-481] No reminders for appointments that already lie in the past

## Version 1.22.3 - November 2020
- [SITUMEWB-534] DSS: add how to
- [SITUMEWB-534] DSS: set projects in metadata.json
- [SITUMEWB-533] calendar access fixes, dss privilege handler fixes
- [SITUMEWB-529] change matomo url

## Version 1.22.2 - November 2020
- [SITUMEWB-446] Added CSV export for calendar
- [SITUMEWB-498] Added printldapdata command
- [SITUMEWB-222] DSS: Added validation for DSSFilesToImport paths
- [SITUMEWB-473] Added content types to site_preferences API
- [SITUMEWB-490] Fix missing group_name in WebSockets consumer
- [SITUMEWB-490] Enhance DB logging (add hash + enhance admin)
- [SITUMEWB-535] DSS: Added globus message queue consumer celery task

## Version 1.22.1 - November 2020
- [SITUMEWB-221] DSS: Celery beat timing adjustments
- [SITUMEWB-221] DSS: Rename Globus import option

## Version 1.22 - October 2020
- [SITUMEWB-193] DSS initial release
- [SITUMEWB-411] Add generic favourites
- [SITUMEWB-490] Add manager and queryset class for userprofiles; Fix admin URLs in log mails
- [SITUMEWB-492] set Only project members as default option for resource user availability

## Version 1.21.2 - October 2020
- [SITUMEWB-408] Fixed study room booking selection alignment
- [SITUMEWB-444] Enhanced appointment confirmation mails (user salutation, resource string) 

## Version 1.21.1 - September 2020
- [SITUMEWB-444] Minor fixes and enhancements for appointment confirmation mails

## Version 1.21 - September 2020
- [SITUMEWB-403] Added database logging with aggregated error mails
- [SITUMEWB-408] Fixed study room booking page
- [SITUMEWB-444] Added appointment confirmation mails
- [SITUMEWB-445] Limited resource booking (appointment) details for privacy
- [SITUMEWB-450] Added user settings info box (e.g. mailing list info)
- [SITUMEWB-452] Added plugin documentation to public repository

## Version 1.20.4 - August 2020
- Fixed contact sharing

## Version 1.20.3 - August 2020
- Fixed plugin download_placeholder_picture request url

## Version 1.20.2 - August 2020
- Added JWT Authentication for Labbook Plugins
- Performance improvements for project list view

## Version 1.20.1 - July 2020
- Hotfix for plugin admin

## Version 1.20 - July 2020
- Added (LabBook) plugins feature
- Added Swagger and Redoc API documentation
- Upgraded jQuery to version 3.5.1

## Version 1.19.1 - June 2020
- AngularJS 1.8 upgrade
- Deactivated LDAP logging
- Django command for Workbench statistics
- added api-changes.md and documented calendar access privilege api changes

## Version 1.19 - June 2020
- Added calendar rights management feature
- Sync empty LDAP fields
- Removed dropdown arrows from search input fields

## Version 1.18.2 - June 2020
- Fixed LabBook file upload into section by using the create-new-file dialog instead of automatically opening a file picker
- Upgraded Docker setup to Postgres 12 (requires backup and restore; data folder is incompatible)
- Disabled Postgres JIT in Docker setup to fix massive performance issues with queries for comments (JIT=on is new default since Postgres V12)

## Version 1.18.1 - May 2020
- Upgraded python packages (incl. Django Rest Framework) to the latest releases
- Added Django command to fix orphaned workbench elements
- Removed text template feature
- Fixed problems with meeting reminder UI and validation
- Fixed a bug that caused changes in resource booking rules to propagate to previously opened resources
- Made CalDAV handling, iCal export, and e-Mail handling more robust
- Fixed various bugs related to the Django 2 upgrade:
  - Admin area: CMS content, DMP form, User Manual
  - Resource creation and duplication
  - DMP trashing
  - LabBook section filtering

## Version 1.18 - May 2020
- Upgraded to Django 2.2 LTS and updated most Python packages 
- Merged Meetings and Resource Bookings into a single element (Appointments)
- Added feature to merge contacts
- Added a special booking page for study rooms
- Files: The current version is finalized automatically when a new file is uploaded
- Files: Fixed full text search index => Searching by file extension should work now
- LabBook: Fixed a bug where removing an element from a section and creating a new element in that section caused an error
- Disabled automatic conversion of text to lists (in description fields, etc.)
- Enhanced the project list-view to save personalized table settings
- Made some UX improvements for appointment reminders

## Version 1.17.1 - April 2020
- Performance Hotfix for Last Activities
- Changed LabBook add-menu placement default to "bottom"

## Version 1.17 - April 2020
- added meeting reminders
- recalculate labbook positions when element is removed
- fixed notifications for external users
- added Matomo tracking
- minor booking rule optimisations
- more beautiful file history
- fixed a bug with copy/pasted images in textfields
- fixed a bug where where table data was loaded two times
- updated api examples
- duplicate tasks when project is duplicated

## Version 1.16.1 - March 2020
- Mandatory input fields are marked with a star
- Registration and password reset links are valid for 72 hours (increased from 24 hours before)
- Files can be searched/filtered by file extension
- Tables are sorted via API (over all pagination pages)
- Hard-delete via API is prevented too
- The login page now has a link to the eWorkbench GitHub repository
- Fixed issue: Comments are now viewable, if they are related to a viewable comment
- Improved booking rules: Hours and minutes fields are filled automatically, if left empty
- Updated readme files

## Version 1.16 - February 2020
- Labbook performance enhancement - automatically extract images in text fields
- Added calendar in resource detail view
- Added feature to share contacts with other users
- Added Booking rules: Time between bookings
- Labbook Import now includes Sections and Section Child Elements
- Make comments viewable on viewable elements
- Added license in file headers
- Booking rules: various UI enhancements
- Remove hard delete
- Labbook: section filter sorting by position in labbook
- Labbook: close other sections if section is opened
- Fixed icon choices for taskboard columns
- Fixed list style in HTML fields (task description, comment content, ...)
- Increased limit for task checklist entries and allowed multiple lines
- Changed task checklist sorting to sort by date
 
## 1.15.2
- Split booking rules duration fields in extra fields for days, hours and minutes
- Fixed global search
- Fixed error message for unchecked resource owner agreement in new-resource-dialog
- Fixed booking rule validation
- 
## 1.15.1
- small changes in detail views of resources 
- remove resource inventory number 
- Fixed readonly selectize fields on resource details view
- Fixed bug where the last entry for users or user groups could not be deleted on resource availability
- Fixed kanbanboard PATCH error
- Booking rules:
- - Various Fixes
- - calendar day/ week/ month
- - Calendar weeks start on Mondays now
- - no reload after booking a resource
- - always show "Hide Past Bookings" Checkbox
- activated ms_office_handling
- device busy preliminary fix

## Version 1.15 - January 2020
- Made project caching optimizations
- Added LabBook sections
- Fixed superuser 403 error in django admin
- Corrected project task progress bar
- Added resource booking rules
- Added resource group availability field for resources

## Version 1.14.6 - December 2019
- Fixed a bug that prevented loading the task list inside a project and disabled all interaction
- Fixed a bug that caused the wrong page number to be highlighted in the task list pagination 

## Version 1.14.5 - December 2019
- Optimized project selection fields in detail views and modal dialogs (Create new element/Duplicate)

## Version 1.14.4 - November 2019
- Fixed and optimized project filters in list views
- Fixed user filter in list views
- Enhanced admin interface to allow searching files by title
- Enhanced admin interface to allow searching role assignments by project name
- Added button to anonymize users in admin interface
- Restricted visibility between users: Users can choose members of common projects in user selection fields only. LDAP users can choose other LDAP users too. 

## Version 1.14.3 - November 2019
- Fixed a bug that prevented file uploads from storages and via WebDAV

## Version 1.14.2 - November 2019
- Disabled Microsoft office handling temporarily
- Fixed a bug that prevented searching for projects in the relations widget (new link dialog)
- Fixed a bug affecting the "Hide past bookings" checkbox
- Fixed a bug concerning the tooltips of resources in the calendar

## Version 1.14.1 - November 2019
- Added pagination for all overviews

## Version 1.14 - November 2019
- Added resource selection and booked resources to calendar
- Added special WebDav handling for Microsoft Office programs
- Added independent field for file names which stays in sync with WebDav
- Added "my resource bookings" view to resource overview and detail view
- Added list-view for links
- Enabled resource bookings
- Enhanced handling for race-conditions when releasing element locks (which caused internal server errors)
- Enhanced new-links dialog to allow selecting multiple elements and search for different element types
- Enhanced metadata selection fields to always show their full option texts (multi-select and single-select)
- Enhanced metadata selection fields to provide a selection button for custom inputs
- Made the links in the main navigation bar act consistently on all screen sizes 
- Removed links that are not accessible from the view
- Removed cube loading animation (bottom right) and highlighted loading progress bar (on the top)
- Fixed performance analysis script (parse_performance_logs.py) and fixed logs that were not parsable in some cases
- Fixed validation for terms of use document uploads on resources
- Fixed a problem that caused unsaved metadata to be lost when uploading a new picture or file
- Fixed a problem that enabled users with full access privileges to lock themselves out of elements
- Fixed inconsistent saving behaviour in LabBooks for changes on multiple elements
- Fixed layout of warning messages on elements (element trashed/locked/changed externally) that broke depending on screen size and text length
- Fixed minor UI/UX issues for pictures in LabBooks and in the picture editor
- Fixed positioning issues for new LabBook elements that caused elements to be positioned "randomly"
- Fixed a bug where format (TIFF) transformations for new pictures would cause internal server errors 

## Version 1.13.1 - October 2019
- Added maintenance mode and system maintenance message
- Resources: Updated the contact label in the new-resource dialog
- Files: Fixed a bug that prevented uploading a new file while unsaved changes are present
- Files/WebDav: Increased limit for file names and paths to 255 characters for names and 4096 characters for paths
- CalDav: Enabled syncing events without a title
- CalDav: Disabled event attendee sync from Outlook to Workbench
- CalDav: Fixed sync problems in conjunction with recurring events that caused error messages

## Version 1.13 (= 1.13rc3) - October 2019
- Updated version restore-dialog to not show the names of LabBook elements, if the user has no access to them
- Incorporated general feedback into the resource view (updated labels and texts)
- Enhanced the error message for images inside a text field
- Enhanced the dialog to copy elements from another LabBook (added icon and updated text) 
- Fixed a bug where the description of resources was not rendered correctly in the resource list view
- Fixed a bug where unsaved changes to a resource were lost if a new terms of use document was uploaded
- Fixed a bug where the top insert-element-menu in LabBooks was not rendered correctly
- Fixed a broken link to resource list on the dashboard
- Fixed minor rendering issues with the tooltip on the Gantt-chart in the project view

## Version 1.13rc2 - September 2019
- Fixed a bug where a LabBook was kept in read-only-mode after saving

## Version 1.13rc1 - September 2019
- Completely overhauled the resource detail view
- Added the possibility to add links to a project and link to projects from other workbench elements
- Changed the Imprint on the login page to now link to https://www.ub.tum.de/impressum
- Enabled empty files and unicode characters (umlauts, etc.) in WebDav
- Enabled CalDav and added handling to automatically add the synchronizing user as attending user (so they meetings show up in the calendar view)
- Improved performance: General optimizations, for projects, lab books, model privileges, user searches and the dashboard
- Improved performance/UX: Made pages load instantly with a "Loading ..." text to keep the navigation usable at all times
- Improved performance/UX: Replaced the graying-out of the whole page with selective input disabling while data is being saved
- Enhanced the error message in case a file can't be deleted at the moment by the OS
- Fixed the missing alert message for images in text fields
- Fixed the displayed file size for empty files
- Fixed a compatibility bug with TIFF images
- Fixed empty notification list page

## Version 1.12.1 - August 2019
- Restricted text fields in LabBooks to decline embedded pictures greater than 100 KB (to avoid bad performance)
- Enhanced the version restore dialog to show an error message in case of a permission problem
- Enhanced metadata text fields to dynamically adjust to the input size and allow line breaks
- Fixed a bug where an unsuccessful restoration of of a LabBook version could remove project assignments
- Fixed a bug where background images were not loaded correctly in the picture editor
- Fixed a bug where accessing a LabBook with elements that the user has no access to led to an internal server error
- Fixed a bug where locking an element could lead to an internal server error (in a very unlikely case of a race condition)
- Fixed a bug where deleting a TaskBoard or TaskBoard column could lead to internal server errors
- Fixed a bug where the label "Filter Links" was not shown initially in the dropdown to filter links by type
- Fixed a bug where the global change log was shown initially inside a projects last activities tab
- Fixed a bug where confirmation prompts were skipped when leaving a project via a menu item inside the three-dot-menu in the navigation bar
- Added a visible error message in case a version preview can not be loaded
- Removed button "Book" from resource card widgets (so the resource bookings feature is completely hidden for now)
- Improved performance for small changes to elements in a LabBook (position, element size)
- Improved performance by loading links, versions and the change history in the background without disabling the UI

## Version 1.12 - August 2019
### Version 1.12rc1
- Added personal data export to admin panel of users
- Added metadata to storages
- Added "link with"/"x links" to labbook child element footer
- Added first version of CalDav sync (not yet intended for general use but for testing purposes)
- Calendar:
  - Added list-view
  - Added possibility to create meetings by click or mouse-drag inside the calendar
  - Enhanced user-selection (select user, then disable/enable as filter)
- Resources:
  - Added search and filter functionality to overview
  - Added pagination to overview
  - Added card-view
  - Updated possible resource types from Room/Device to Room/Lab Equipment/Office Equipment/IT-Resource
- Replaced simple list views with a dynamic table view (except for the list view of projects)
  - Table columns can now be resized, moved and hidden
  - Table layout can be reset to initial settings
  - The table customization is saved per user and per table until the user logs out
- Changed metadata fractions from vertical to horizontal layout and removed input limit
- Upgraded AngularJS from version 1.5 to 1.7
- Fixed a bug that prevented the description of meetings from being deleted
### Version 1.12rc2
- Enhanced list-view: Column customizations are automatically saved to the database now for each user and table
- Enhanced the user-selection in the calendar to keep the placeholder text even if there are selected users
- Enhanced default sort order of list-views
- Enhanced list-views to only show (horizontal) scrollbars when necessary
- Fixed an incompatibility with Internet Explorer affecting numeric metadata
- Fixed layout of metadata fractions in various browsers
- Fixed a bug in the angularjs-toaster integration (bug was not visible to users)
- Fixed a bug causing some columns in list-views to ignore the sort order
### Version 1.12rc3
- Added resource bookings
- Admin Panel: Unified various UI settings in the UserProfile model and integrated a JSON editor
- Integrated JSONEditor for JSON fields on all models (Metadata, MetadataField, Version)
- Enhanced the integration of the UI-Grid library (dynamic tables): Scrolling the page with the cursor over the UI-Grid works now
- Fixed a bug causing hyperlinks in dynamic tables to link to a wrong element if a list-view sort order has been changed
### Version 1.12rc4
- Fixed bugs causing some UI-Grid columns (dynamic tables) to not be sorted correctly
### Version 1.12rc5
- Fixed a bug causing the names of users in the user-selection of the the calendar screen not to render
- Fixed a bug causing Save/Cancel buttons to not appear when using text templates (e.g. on a task description)
- Fixed a bug causing internal server errors for invalid search inputs
- Fix for Internet Explorer and Edge: The summary field in the automatic version prompt has a useful size now
- Fixed the handling of old static URLs (e.g. from password reset mails), which became incompatible with the AngularJS upgrade
- Temporarily disabled resource bookings and CalDav sync for production release
### Version 1.12rc6
- Fixed a bug in the ICAL export that led to an HTTP 500 server error
- Added and improved search functionality in all admin panels

## Version 1.11 - May 2019
- Added metadata selection field
- Added validation to settings of new metadata fields
- Added search and filter functionality to the UserStorageLimit admin panel
- Added docs/Workbench-Permissions.xlsx to repository
- Updated task boards to hide trashed tasks
- Enhanced font color of task labels to adapt to the background color of the label
- Enhanced error messages for password resets
- Enhanced data handling of user profiles for better security
- Enhanced user-selection field UI to show username in case name and email are missing
- Fixed several bugs concerning the metadata search
- Fixed several bugs concerning the global "Last activities" view
- Fixed inconsistent save/cancel buttons in user profile
- Fixed multiplied items in main navigation for superusers
- Fixed position of toolbar for texts in a labbook
- Fixed UI for elements in a labbook the user has no access to
- Fixed cancel button for newly created metadata
- Fixed display of decimal number metadata when the value is negative
- Fixed a problem where users couldn't submit the contact form (if they searched for users before)

## Version 1.10.3 - March 2019
- Fixed a bug concerning file uploads
- Fixed memory leaks (upgraded faulty library)
- Fixed a bug where the list of pictures could not be loaded
- Fixed a bug preventing LDAP users from changing confirm-dialog settings
- Fixed the notification configuration link 

## Version 1.10.2 - March 2019
- Added Metadata Checkbox Field
- Added "Do now show this message again" settings and functionality
- Renamed Metadata "Whole number" to "Integer"
- Enhanced UI for deleting generic metadata
- Extended CORS Headers to improve compatibility
- Removed "Want to unlock?" dialog when leaving a locked element
- Versioning: The current version of an element is now automatically finished before another is restored

## Version 1.10.1 - February 2019
- WebDav/Storages: Several bugfixes related to Storages with titles that contained non-alphanumeric characters (e.g., /, -, _)
- LabBook Frontend: Improved error handling when adding new elements
- LabBook Frontend: Hide the buttons to add new elements in the LabBook if the user is not allowed to do so

## Version 1.10 - January 2019
- Added description field for LabBooks
- Added background color for Task Boards
- DMPs now have HTML fields
- Task Board: Tasks are no longer edited in Modal Dialog; instead they are opened in a new tab
- Versioning of Meta Data of Models
- Storages can be opened within Windows Explorer (WebDav)
- Notifications are triggered immediately in the WebBrowser (WebSockets)
- Lock Elements while editing them (WebSockets)
- Automatically refresh LabBook Cells while when they are saved (WebSockets)
- Added Metadata fields (only visible if view_metadata permission is set for the user/group)
- Default fill color of picture editor set to transparent

## Version 1.9.10
- Fixed an issue with notification title being limited to 128 characters, which causes a bug with workbench elements with long titles

## Version 1.9.2 - 1.9.9 - May 2018
- Several Bugfixes
- Added OSS License View
- Removed the plus icon from "New {Element}" buttons/links
- Added a 'Not Found' view for elements that can no longer be viewed (e.g., because a user was removed from a project/task/meeting)

## Version 1.9.1 - May 2018
- Several UI/UX updates to Task Boards
  - Background Images for Task Boards
  - Columns are no longer bound to a Task State, but have an optional icon
- Picture Editor: PDF and TIFF files can now be used when creating a new picture
- Added Labels to Tasks and Task Boards

## Version 1.9 - April 2018
- Upgraded Django Rest Framework from 3.7 to 3.8
- New Calendar/Schedule Frontend
- Export Calendar/Schedule per Project
- Short URL Service, as the exported calendar URLs are too long for Google Mail and other services
- Made privileges view more intuitive
- New Frontend for showing and editing Members in Project Meta Data
- The overflow menu now behaves more dynamic based on the screen width
- Updated and upgraded several frontend libraries
- Pictures now have their history stored properly
- Users now have a file upload limit (quota)
- Users can see their current quota and usage in the Dashboard and in their profile
- A Contact Form was added
- A new workbench element was introduced: Storage (conceptual name was Drive) - provides a hierarchy for files
  - Several drag and drop features have been included for Storage and Folders
  - Folders can be downloaded as a zip file
- Cleaned up and updated some javascript libraries
- Kanban Board was renamed to Task Board
- Tasks in Task Board are now more compact
- Added User Manual
- New LabBook elements will have the same size
- LabBook child elements are automatically kept within the same projects as the labbook
- Renamed LabBook Templates
- Removed project state "Deleted", as projects can be trashed (soft deleted) and fully deleted
- Notifications for Task, Meeting and Project were added
- Ability to disable E-mail notifications was added
- Notifications sent via E-mail have a shortlink to the website URL
- Show the proper "loading" message when a new tab is opened (previously the message "Login in progress" was shown)
- Removed the pencil on the right side when hovering over an editable input field
- Added a short description/information in the modal dialog when exporting a calendar
- Bubbles in Dashboard
- When viewing the details of an element, a "New" element can be created (similar to duplicate) 
- Contacts now have an academic title; also, the e-mail address of a contact is no longer mandatory
- When editing a file, uploading a new file works with drag&drop
- LDAP Sync improvement
- Improved menu look and feel when a project is active/selected (Project Breadcrumbs)
- Improved performance of picture editor
- Removed red borders and exclamation mark when a LabBook item shows scrollbars because it does not fit into its borders
- Bugfix: Editing Meeting Dates kept showing the "Save" and "Cancel" buttons, although the dates were saved properly
- Bugfix: Could not open Pictures with a lot of vector drawings (lines, points, texts, ...)
- Bugfix: New Tasks in Kanban Board/Task Board did not allow creating checklists
- Several smaller bugfixes and usability improvements
- Added several unit tests

## Version 1.8.5 - January 2018
- Bugfix: Uploading and Downloading Files with Unicode did not work properly
- Bugfix: DMP Text Export did not work on Windows Notepad (\n vs. \r\n problem)
- Bugfix: DMP HTML and PDF Export did not account for newlines within texts
- Meeting PDF Export now contains more information
- Store file names and paths with relative paths (relative to Djangos MEDIA_ROOT)
- Performance improvement for /api/projects endpoint
- Added a statistics command for monitoring


## Version 1.8.4 - not released

## Version 1.8.3 - January 2018
- Unit Tests for Privileges
- LDAP Sync is enabled again, with performance improvements and better logging
- Dashboard: Entries are now ordered by the last modification date (descending)
- New API Endpoint: List ACLs for the current project and its parent project
- Bugfix: Unable to create user profile in certain situations
- Bugfix: Privileges were not applied properly when an element was related to multiple projects

## Version 1.8.2 - January 2018

- Added unit tests for KanbanBoards, LabBooks
- Added unit tests for recently modified elements
- Added a unit test for duplicating a file
- Updated several python dependencies
- Cleaned up and properly documented code for permission handling (viewable, editable, deletable)
- Refactoring of privileges and inherited privileges (e.g., Task Assignees, LabBook Cells, etc...)
- Added a "Deny Access" button to the privileges page
- Deleting of the last "Full Access" Privilege is no longer possible
- Several updates to the technical documentation and source code documentation
- Fixed a performance problem with the Django Admin Panel
- Fixed an issue with deleting objects that have relations that can not be deleted
- Fixed an issue with LabBook cells that contain deleted elements

## Version 1.8.1 - December 2017

- Performance Improvement for all API Calls
- Added duplicate project functionality
- Trash (containing soft deleted elements) is now displayed in a Modal Dialog
- Fixed some issues with Firefox and Dropdowns/Select Fields
- Display recently modified elements when creating a new link
- Fixed missing display of completed/done tasks in project list
- Fixed some issues with Internet Explorer
- Code cleanups

## Version 1.8 - November 2017

- Added Kanban Board with customizeable Columns
- Some refactoring on the REST API permission checks, to make the system a bit more generic
- Task States have been changed; The only available states are now "New", "In Progress" and "Done" (other states can be mapped via customizable Kanban Board Columns)
- Task List are now ordered by the descending task id by default
- Task List can now be filtered by task id (e.g, by entering #123 for the task with id 123)
- LabBook Improvements
  - Added File Cell
  - Added possibility to Drag&Drop Files onto the "New Picture" and "New File" buttons

## Version 1.7.1 - Bugfixes November 2017

- Fixed several small usability issues and bugs
- Added edit functionality for pictures in LabBook

## Version 1.7 - November 2017

- Added Checklists for Tasks
- Fixed an issue with Assigned Users, Attending Contacts/Users showing as changed although they were only re-ordered by the REST API
- The user avatar can now be cropped in the frontend
- Added a command for updating the horizontal menu
- New Workbench Element: Picture
  - It is now possible to upload and modify pictures (e.g., sketches)
- New workbench Element: LabBook
  - A LabBook can contain multiple other elements (so called Cells): Picture, Texts (more cells will be added in the future)
  - Each cell can be positioned and resized arbitrarily
- Editing (Drag&Drop) of the Horizontal Navigation Overflow Menu has been restyled
- Duplicating of Tasks, Notes, Meetings, Contacts and Files has been implemented

## Version 1.6.1 - October 2017

- Fixed an issue with DMP permissions
- Updated several dependencies
- Removed the monkey patch for ``get_filter_name`` method to be a class method now
- Soft deleted elements are no longer shown in the dashboard

## Version 1.6 - October 2017

- Updated several python dependencies
- Added TinyMCE Editor to the frontend
- Notes, Tasks and Meetings now have a HtmlField for their texts
- PDF Export has been re-styled with a better looking font
- Renamed every occurrence of the word "Dmp" to "DMP"
- Fixed a broken link on the Dashboard to projects

## Version 1.5.1 - October 2017

- Updated several python dependencies
- Added caching to /api/version endpoint for better performance
- Optimized /api/menuentries/ endpoint for better performance

## Version 1.5 - September 2017

- Trash Functionality (Soft-delete)
  - All objects can now be trashed (soft-deleted / moved to a recycle bin)
  - Trashed (soft-deleted) objects can be completely deleted or restored
  - New permissions for trashing ()soft-deleting) aswell as restoring objects have been introduced
  - History has been adapted to show that en element was trashed (soft-deleted) or restored
  - Trashed (soft-deleted) objects can not be edited
- Intuitive editing
  - If a user does not have privileges to edit an element, the input field (text field) is set to read-only
- History now renders differences between texts with Diff-Match-Patch library
- History now matches field names with the actual displayed names of the field
  - e.g., ``assigned_users`` is now rendered as *Assigned Users*
- Tasks due and start date are now optional
- All workbench entities can now be exported as a PDF (print functionality)
  - We introduced a middleware which checks for the query parameter ``jwt=<token>`` and grants authorization for the 
    current API call
  - The same functionality is now also available for ICAL export of calendar, meaning that the exported ICAL file can
    be regularly synced by Outlook and other calendars (Note: ICAL export is not yet available in frontend)
- Brand new Dashboard
  - Gives a quick overview of what happened, upcoming schedule items, projects, ...
  - Bubble chart with total number of elements
- Fixed an issue with updating the userprofile with an invalid URL
- Added Unit Tests for LDAP login
- Show the realname (first_name + last_name) in navigation bar (instead of the username)

## Version 1.4 (navigation) - September 2017

- Navigation Changes:
  - Added a responsive overflow menu in the top navigation bar
  - The order of menu entries in said overflow menu is customizable via drag & drop
  - Added a project-specific navigation bar on the left side
  - If said navigation bar is active, the selected project is pre-selected as a filter for lists (e.g., 
    task list) aswell as when creating new elements (e.g., new task)

Other Changes:
- Project Meta Data and History are no longer in a tab view
- Project List can now be toggled between a tree and a card view
- Project History now has more detailed information about the changes
- Meetings List now has a Card View instead of a calendar
- Added a kebab menu for detail views (as a replacement for the privileges button)
- Increased font-size of file icons in file list 
 
## Version 1.3 (multiple projects) - September 2017

General: It is now possible to select multiple projects for each element. Also, there is a new Privilege System which allows granting and denying access to certain elements.

Details:
- Added ability for the main elements (Tasks, Files, Notes, Contacts, Meetings, DMPs) to be linked to more than one project
- UI Overhaul of Privilege View (should look much nicer and clearer now)
- Enhanced privilege system so access can either be granted or denied
- Complete overhaul of Privileges in REST API as a separate Django App (reusability)
- Optimized performance of Django Admin Panel
- Upgraded libxml, django-ckeditor and defused-xml to their latest compatible versions
- More Unit Tests
- Moved DMP Download Buttons to the bottom of DMP View; Download/Export buttons are grayed-out when there are unsaved
  changes on the DMP Form
- Removed Dropdown Arrows from UserSelectizeWidget in Project Member Assignment and Privilege User Assignment

## Version 1.2 (Multiple Assignees per Task) - August 2017

General: For each task, multiple users can be assigned!

Details:
* Tasks can now have multiple assigned users
* All assigned users of Tasks can now view the Task
* History of Tasks and Meetings now show the actual assigned users / attending users / attending contacts
* Bugfix: It was not possible to close the "Note Create" Modal Dialog
* Tasks and Meetings now have a better implementation for saving many to many relations (users, contacts) via REST API


## Version 1.1 (Flat Architecture) - August 2017

General: Flat Architecture arrived!

### Visible Changes:

- The elements Task, Files, Note, Contact and Meeting have been decoupled from Projects (Flat Architecture)
- Introducing "Card View" for listing Tasks, Files, Notes, Contacts and Meetings
- Introducing "Card View" for listing relations
- Comments can be created for all elements. Those comments are always visible to everyone that has access to view the commented element.
- "Recent changes" of an element only shows the five most recent changes by default - remaining changes can be looked at by clicking on "Show more changes". 
- Task Kanban View has been removed. It will be re-introduced later with a different purpose.

- Dashboard
  - "My Schedule" in the Dashboard now shows My Tasks and My Meetings
  - "Last Activities" no longer show the project an element is related to. Instead, the remaining space is used to display the title of the element that has been changed
  - Please note: The Dashboard will be completely overhauled soon, so what you are seeing here is not final!

- Permissions and Privileges
  - Added new permissions for creating elements without having to relate them to a project, e.g.: add_task_without_project, add_note_without_project, add_file_without_project, ...
  - Users that are assigned to a task will automatically be able to view the task
  - Users that are attending a meeting will automatically be able to view the meeting and all attending contacts
  - Added a simple Privilege-based access control for each element with the following possible privileges: view, edit, delete, restore (delete and restore are not implemented yet)
  - Please note: Privileges are just an early preview of what this feature can do. It will be completely overhauled soon, with even more options and a much better User Interface.

- User Experience
  - Tabs have been removed for almost all elements (DMPs and History are still pending and will be removed in the future)
  - "Intuitive Editing" (click to activate editing) is active for Projects, Tasks, Files, Notes, Contacts, and Meetings, aswell as the User Profile; there is no longer an "edit" button
  - Detail pages of all elements (except for DMP and resources) have been completely overhauled and are now much cleaner
  - Create Project/Task/File/Note/Contact/Meeting is now handled with Modal Dialogs instead of separate pages
  - Except for the Dashboard and for Project Meta Information page, the Workbench can now be used on Mobile Devices (Responsive Design)
  - A loading animation with the eRIC Workbench logo has been added

### Less visible (Invisible) Changes

- Code Quality, Documentation, Testing
  - Automated tests for JavaScript and Python that evaluate Code Quality and check for errors have been added
  - Documentation for the new permissions/privilege system has been added
  - Unit Tests for the "Flat Architecture" Changes have been added (not completely finished yet)
  - Unit Tests for the new Privileges have been added (not completely finished yet)

- Refactoring
  - A huge part of the frontend had to be refactored due to the removing Tabs and several changes based on "Flat Architecture".
  - Almost all unit tests had to be refactored due to changes based on "Flat Architecture".
  - "Generic Relations", a particular strong feature of Django, is now used in the background, improving developers experience with generic links between all elements
  - Django QuerySets which take into account the new privilege system were created, improving code readability and clearity for dealing with privileges and permissions at the same time



## Version 1.0 (Initial Release) - April 2017

Initial Release of eRIC Workbench

## Version 0.9 (Beta Test version) - February 2017

Initial Beta Version of eRIC Workbench
