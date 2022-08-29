# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from __future__ import unicode_literals

from django.db import migrations
from django_changeset.models.mixins import RevisionModelMixin

from eric.core.models import disable_permission_checks


LIST_TEXT = """
<h2>Adding a DSS Container</h2>

<p><em>Click the &quot;New DSS Container&quot; button and fill out the form:</em></p>

<p><strong>Name:</strong><br />
This is only used as a reference for you, so it can be any text not longer than 255 characters.</p>

<p><strong>Path:</strong><br />
<em>Must consist of 3 Parts:</em></p>

<ol>
	<li>The DSS Filesystem.</li>
	<li>An identifier like a TUM User ID.</li>
	<li>The rest of the container mount path, which usually also includes the identifier of part 2.</li>
</ol>

<p>There must not be slashes at the beginning or the end of the path, so it should look something like this: <strong><em>dssfs03/tumdss/pr53ve/pr53ve-dss-0000</em></strong></p>

<p><strong>Read/Write Setting:</strong><br />
<em>Can be one of the following 4 options:</em></p>

<ol>
	<li>Read Only: Neither imported files can be updated, nor can new files be added to the container through the workbench.</li>
	<li>Read Write No New: Imported files can be updated, but no new files can be added to the container through the workbench.</li>
	<li>Read Write Only New: Imported files cannot be updated, but new files can be added through the workbench.</li>
	<li>Read Write All: Imported files can be updated and new files can be added through the workbench.</li>
</ol>

<p><em><strong>With all 4 settings: Metadata of DSS files can always be edited on the workbench.</strong></em></p>

<p><strong>Import Option:</strong><br />
<em>Can be one of the following 3 options:</em></p>

<ol>
	<li>Only new Globus imports: The workbench will be informed about new files added through Globus Online and the corresponding files will be imported</li>
	<li>Import list: A .json file with the following structure inside can be uploaded within the detail view of a container and the files will then be imported:
	<pre>
[
    {<span style="color:#e74c3c">&quot;path&quot;</span>:<span style="color:#16a085"> &quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-1/storage-1/example-1-1-1.txt&quot;</span>},
    {<span style="color:#e74c3c">&quot;path&quot;</span>: <span style="color:#16a085">&quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-1/storage-1/example-1-1-2.txt&quot;</span>},
    {<span style="color:#e74c3c">&quot;path&quot;</span>:<span style="color:#16a085"> &quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-1/storage-1/subdir-1/example-1-1.txt&quot;</span>},
    {<span style="color:#e74c3c">&quot;path&quot;</span>:<span style="color:#16a085"> &quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-2/storage-2/subdir-2/subdir-3/example-2-2.txt&quot;</span>},
    {<span style="color:#e74c3c">&quot;path&quot;</span>: <span style="color:#16a085">&quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-3/storage-3/example-3-1.txt&quot;</span>}
]
</pre>
	</li>
	<li>Import all: The workbench will periodically crawl the whole container mount path and will import all files that are found within envelopes that have a valid metadata.json.</li>
</ol>

<p><em><strong>Read more about metadata.json, envelopes, storages etc. in the detail view of a container.</strong></em></p>

<h2>Remove DSS Containers</h2>

<p>Please contact a workbench admin to remove DSS Containers (workbench@ub.tum.de). Meanwhile set the container to Read Only and Import List, so no files can be updated and no new files will be imported.</p>
"""

DETAIL_TEXT = """
<h2>Detail View</h2>

<p>All the options that can be set while adding a container can also be changed here.</p>

<p>On top there will be a <em>Mount Status</em> and a list of <em>Recent changes</em>&nbsp;displayed.</p>

<p>And in case that the <em>Import Option</em> is set to <em>Import list</em>, there will be a button called <em>Upload json path list</em>, which can be used to upload a .json file with the following strucure inside:</p>

<pre>
[
    {<span style="color:#e74c3c">&quot;path&quot;</span>: <span style="color:#16a085">&quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-1/storage-1/example-1-1-1.txt&quot;</span>},
    {<span style="color:#e74c3c">&quot;path&quot;</span>:<span style="color:#89ca78"> </span><span style="color:#16a085">&quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-1/storage-1/example-1-1-2.txt&quot;</span>},
    {<span style="color:#e74c3c">&quot;path&quot;</span>:<span style="color:#89ca78"> </span><span style="color:#16a085">&quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-1/storage-1/subdir-1/example-1-1.txt&quot;</span>},
    {<span style="color:#e74c3c">&quot;path&quot;</span>: <span style="color:#16a085">&quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-2/storage-2/subdir-2/subdir-3/example-2-2.txt&quot;</span>},
    {<span style="color:#e74c3c">&quot;path&quot;</span>:<span style="color:#89ca78"> </span><span style="color:#16a085">&quot;/dss/dssfs03/tumdss/pr53ve/pr53ve-dss-0000/envelope-3/storage-3/example-3-1.txt&quot;</span>}
]</pre>
"""

GENERAL_TEXT = """
<hr />
<h2>General DSS concepts</h2>

<h3>Envelopes / metadata.json</h3>

<p>Every container path should have one or many envelope folders underneath containing a <strong>metadata.json</strong> file, which should look at a minimum something like this:</p>

<pre>
{
  <span style="color:#e74c3c">&quot;tum_id&quot;</span>: <span style="color:#16a085">&quot;pr53ve&quot;</span>,
  <span style="color:#e74c3c">&quot;projects&quot;</span>: [],
  <span style="color:#e74c3c">&quot;metadata_fields&quot;</span>: []
}
</pre>

<p>All keys are required, but projects and metadata_fields can be empty lists.</p>

<p>The <strong>tum_id</strong> should be a string containing the username of a workbench user. All files and storages that will be generated on the workbench that are within that envelope will be assigned to that user by setting the created_by attribute. The user now has access to all the files and storages within that envelope folder.</p>

<p>The <strong>projects</strong> list can contain strings containing PKs of projects. The tum_id user must have editing rights within the projects, which means his role must be at least &quot;Project Member&quot;. The &quot;Observer&quot; role is not enough.<br />
Failures in the project setting task while importing will not prevent imports. Projects that can be set, will be set. The curator will be sent failure notifications/emails on failures. PKs of projects can be found in their URLs.</p>

<p>A projects list can look something like this:</p>

<pre>
<span style="color:#e74c3c">&quot;projects&quot;</span>: [
  <span style="color:#16a085">&quot;6f1718f0-1d49-4eb3-b1ad-c48fe3ac0bae&quot;</span>,
  <span style="color:#16a085">&quot;f5650498-024d-4c9b-8e63-d9ddbf8520ca&quot;</span>,
  <span style="color:#16a085">&quot;96a9500e-bbe8-4a4f-a946-ce61f617d609&quot;</span><span style="color:#89ca78">
</span>],</pre>

<p>The <strong>metadata_fields</strong> list can contain json objects containing the id and values of existing Metadata Fields in the workbench. For the moment, please ask workbench@ub.tum.de for the id of relevant Metadata Fields.</p>

<p>A full example of a metadata.json file containing examples of all types of Metadada Fields can look something like this:</p>

<pre>
{
  <span style="color:#e74c3c">&quot;tum_id&quot;</span>: <span style="color:#16a085">&quot;pr53ve&quot;</span>,
  <span style="color:#e74c3c">&quot;projects&quot;</span>: [],
  <span style="color:#e74c3c">&quot;metadata_fields&quot;</span>: [
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;334091b1-e488-4c0f-9620-976feddd8b30&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;value&quot;</span>: <span style="color:#16a085">&quot;my_first_text&quot;</span>},
        {<span style="color:#e74c3c">&quot;value&quot;</span>: <span style="color:#16a085">&quot;my_second_text&quot;</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;7e8bec86-3221-4210-9a6a-650dec8590cf&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;value&quot;</span>: <span style="color:#16a085">&quot;22&quot;</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;3bba419d-d333-4188-bd96-3a3b44f9e581&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#e67e22">34.954</span>},
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#e67e22">74553.425</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;7cb53855-d363-4d0e-b1cb-86261ffc478c&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#e67e22">67.87</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;84cd9f94-7b23-4ec2-8f42-2f1249e3a649&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#16a085">&quot;2020-04-23T09:18:46.3631Z&quot;</span>},
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#16a085">&quot;2020-11-27&quot;</span>},
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#16a085">&quot;2020-02-02T13:16&quot;</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;3ced043f-4ae8-4345-949a-c08fd1e47688&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#e67e22">1392</span>},
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#e67e22">234</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;87e8616a-bb90-4647-99a1-f1b35fb5b6a7&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;numerator&quot;</span>: <span style="color:#e67e22">5</span>, <span style="color:#e74c3c">&quot;denominator&quot;</span>: <span style="color:#e67e22">8</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;1cc5a3d1-05d4-47af-b441-4eb6e5d2ae12&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#e67e22">true</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;a4cba4ef-7391-43d8-a54b-a77fe9bce001&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#e67e22">34.954</span>},
        {<span style="color:#e74c3c">&quot;value&quot;</span>:  <span style="color:#e67e22">73.425</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;af9f3399-1d30-47f6-a73a-8176b0e73f2a&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;x&quot;</span>: <span style="color:#16a085">&quot;46.6411&quot;</span>,<span style="color:#e74c3c">&quot;y&quot;</span>: <span style="color:#16a085">&quot;14.2891&quot;</span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;9035cac8-8516-4538-bad6-9a4cf47f50f2&quot;</span>,
      <span style="color:#e74c3c">&quot;description&quot;</span>: <span style="color:#16a085">&quot;user-defined metadatafield - finite multiple-choice selection, no custom field&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;answers&quot;</span>: [
          {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;First choice&quot;</span>, <span style="color:#e74c3c">&quot;selected&quot;</span>:  <span style="color:#e67e22">true</span>},
          {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;Second choice&quot;</span>},
          {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;Third choice&quot;</span>, <span style="color:#e74c3c">&quot;selected&quot;</span>:  <span style="color:#e67e22">true</span>}
        ]}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;23bd8972-ff2b-471e-b715-c9749edd32e9&quot;</span>,
      <span style="color:#e74c3c">&quot;description&quot;</span>: <span style="color:#16a085">&quot;user-defined metadatafield - multiple selection and custom field, which is selected too&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;answers&quot;</span>:
          [
            {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;First choice&quot;</span>},
            {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;Second choice&quot;</span>},
            {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;Third choice&quot;</span>, <span style="color:#e74c3c">&quot;selected&quot;</span>: <span style="color:#e67e22">true</span>}
          ],
          <span style="color:#e74c3c">&quot;custom_input&quot;</span>: <span style="color:#16a085">&quot;Fourth Choice (Custom)&quot;</span>,
          <span style="color:#e74c3c">&quot;custom_input_selected&quot;</span>: <span style="color:#e67e22">true</span><span style="color:#d19a66">
</span><span style="color:#d19a66">        </span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;b1e1fa3c-c2ad-41b4-91c1-ab5293a44d70&quot;</span>,
      <span style="color:#e74c3c">&quot;description&quot;</span>: <span style="color:#16a085">&quot;user-defined metadatafield - single selection and custom field, which is not selected&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;answers&quot;</span>:
          [
            {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;First choice&quot;</span>},
            {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;Second choice&quot;</span>},
            {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;Third choice&quot;</span>}
          ],
          <span style="color:#e74c3c">&quot;custom_input&quot;</span>: <span style="color:#16a085">&quot;Fourth choice (Custom)&quot;</span>,
          <span style="color:#e74c3c">&quot;single_selected&quot;</span>: <span style="color:#16a085">&quot;First choice&quot;</span><span style="color:#89ca78">
</span><span style="color:#89ca78">        </span>}
      ]
    },
    {
      <span style="color:#e74c3c">&quot;id&quot;</span>: <span style="color:#16a085">&quot;b1e1fa3c-c2ad-41b4-91c1-ab5293a44d70&quot;</span>,
      <span style="color:#e74c3c">&quot;description&quot;</span>: <span style="color:#16a085">&quot;user-defined metadatafield - single selection and custom field, which is selected&quot;</span>,
      <span style="color:#e74c3c">&quot;values&quot;</span>: [
        {<span style="color:#e74c3c">&quot;answers&quot;</span>:
          [
            {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;First choice&quot;</span>},
            {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;Second choice&quot;</span>},
            {<span style="color:#e74c3c">&quot;answer&quot;</span>: <span style="color:#16a085">&quot;Third choice&quot;</span>}
          ],
          <span style="color:#e74c3c">&quot;custom_input&quot;</span>: <span style="color:#16a085">&quot;Fourth choice (Custom)&quot;</span>,
          <span style="color:#e74c3c">&quot;single_selected&quot;</span>: <span style="color:#16a085">&quot;vm.metadata.values[&#39;custom_input&#39;]&quot;</span><span style="color:#89ca78">
</span><span style="color:#89ca78">        </span>}
      ]
    }
  ]
}
</pre>

<h3>Storages / Files</h3>

<p>Workbench storages and files that are within a DSS container will have extra metadata fields. Both have a read-only <em>DSS Location</em> field, that looks something like this: <em>DSS: dssfs03/tumdss/pr53ve/pr53ve-dss-0000</em></p>

<p><strong>Storages</strong> have a <em>DSS Envelope</em> field where the envelope directory can be set if the corresponding container settings allows it.</p>

<p><strong>Files</strong> can be added to a DSS container by setting the <em>Storage</em> field to a storage within a DSS container (envelope).</p>

<h3>Permissions</h3>

<p>The <strong>tum_id</strong> user has access to all storages and files imported for him. If the container allows, then the user can also add new, or update files from the workbench.</p>

<p>The <strong>container curator</strong> has access to all storages and files imported and added within his/her containers.</p>

<p>All other access should be handled through workbench <strong>projects</strong> and their <strong>roles</strong>. Projects can be set from metadata.json files or directly on the workbench.<br />
<strong>Hint</strong>: If a project is set on a storage, all workbench files within that storages have automatic access set from the project roles. So <em>Observers</em> can view the storage and files, <em>Project Members</em> can view and edit etc.</p>

<p><em><strong>Files will never be deleted from the DSS filesystem, even when updating (replacing) files from the workbench, the old file will be kept.</strong></em></p>
"""


def update_dss_how_to_texts(apps, schema_editor):
    RevisionModelMixin.set_enabled(False)
    db_alias = schema_editor.connection.alias
    Content = apps.get_model("cms", "Content")

    with disable_permission_checks(Content):
        dss_container_list_how_to = Content.objects.using(db_alias).filter(
            slug="dss_container_list_how_to"
        ).first()
        dss_container_list_how_to.text = LIST_TEXT + GENERAL_TEXT
        dss_container_list_how_to.save()

        dss_container_detail_how_to = Content.objects.using(db_alias).filter(
            slug="dss_container_detail_how_to"
        ).first()
        dss_container_detail_how_to.text = DETAIL_TEXT + GENERAL_TEXT
        dss_container_detail_how_to.save()

    RevisionModelMixin.set_enabled(True)


def remove_dss_how_to_texts(apps, schema_editor):
    db_alias = schema_editor.connection.alias
    Content = apps.get_model("cms", "Content")

    with disable_permission_checks(Content):
        # first check if an entry exists
        dss_container_list_how_to = Content.objects.using(db_alias).filter(
            slug="dss_container_list_how_to"
        ).first()
        # if an entry exists, we delete it
        if dss_container_list_how_to:
            dss_container_list_how_to.delete()

        # first check if an entry exists
        dss_container_detail_how_to = Content.objects.using(db_alias).filter(
            slug="dss_container_detail_how_to"
        ).first()
        # if an entry exists, we delete it
        if dss_container_detail_how_to:
            dss_container_detail_how_to.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('dss', '0007_migrate_dss_filesystem'),
    ]

    operations = [
        migrations.RunPython(update_dss_how_to_texts, remove_dss_how_to_texts),
    ]
