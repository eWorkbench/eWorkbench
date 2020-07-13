# API Changelog

## Version 1.19 - June 2020

###  Calendar Access Privileges

#### Model changes

- New model "CalendarAccess". We use its ```created_by``` field to identify the owner of the calendar.

#### New API access points

- ```api/calendar-access-privileges``` - Fields: ```'pk', 'created_by', 'created_at', 'last_modified_by', 'last_modified_at'```
- ```api/calendar-access-privileges/<pk>/privileges``` - Nested detail view for model privileges

#### API field changes

None

#### URL Parameter changes

- ```api/my/schedule``` - ```show_meetings``` has been removed in favour of ```show_meetings_for```:

The checkbox "My Appointments" should add a ```?show_meetings_for=<current-user-pk>``` when checked (= default) and not add 
this parameter when unchecked.

The new user access filter should add one or many parameters in the form similar to:

```
?show_meetings_for=<selected-user-pk>&show_meetings_for=<selected-user2-pk>&show_meetings_for=<selected-user3-pk>
```

#### Request data changes

- ```api/meetings```:

create can optionally have a new field ```create_for``` with a numeric value standing for a user pk

#### Data changed in migrations

- Every user that has ever logged in gets a new ```CalendarAccess``` and ```full_access``` to his Calendar. (Users that will log in 
from then on will get the same from a handler.)
