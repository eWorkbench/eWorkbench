#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from eric.core.tests.test_utils import FakeRequest, FakeRequestUser, NoRequest
from eric.drives.models import Directory, Drive
from eric.dss.models.models import DSSContainer, DSSEnvelope, DSSFilesToImport
from eric.dss.tasks import import_dss_file
from eric.dss.tests.dss_test_utils import TemporaryDSSFile
from eric.metadata.models.models import MetadataField
from eric.projects.models import Group, MyUser, Project, ProjectRoleUserAssignment, Role
from eric.shared_elements.models import File

User = get_user_model()


class ImportTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", email="user1@workbench.test")
        self.bot_user = User.objects.create_user(username="bot1", email="bot1@workbench.test")

    def test_import_assigns_correct_user_and_file_size(self):
        container_path = "my/tumdss/container/09"  # must have 4 parts
        envelope_path = "envelope32"
        hierarchy_path = f"{envelope_path}/storage23"
        file_name = "file1324.test"
        file_content = "test123test123"
        metadata_file_content = {
            "tum_id": self.user1.username,
            "projects": [],
            "metadata_fields": [],
        }

        # create container hierarchy
        with FakeRequest(), FakeRequestUser(self.user1):
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_ONLY,
                import_option=DSSContainer.IMPORT_LIST,
            )
            DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content=metadata_file_content,
            )

        # simulate automated API call from external service
        with FakeRequest(), FakeRequestUser(self.bot_user):
            file_to_import = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/{file_name}")

        # simulate import via celery task
        time_before_import = timezone.now()
        with NoRequest(), TemporaryDSSFile(
            filename=f"{container_path}/{hierarchy_path}/{file_name}", content=file_content
        ), TemporaryDSSFile(
            filename=f"{container_path}/{envelope_path}/metadata.json", content=json.dumps(metadata_file_content)
        ):
            import_dss_file(file_to_import.path)

        # check that  the imported file has the correct user set
        self.assertEqual(1, File.objects.all().count())
        file = File.objects.all().first()
        self.assertEqual(self.user1, file.created_by)
        self.assertEqual(self.user1, file.last_modified_by)
        self.assertEqual(len(file_content), file.file_size)
        self.assertEqual(file_name, file.title)
        self.assertEqual(file_name, file.original_filename)

        # check that the imported file is marked as imported
        file_to_import.refresh_from_db()
        self.assertTrue(file_to_import.imported)
        self.assertTrue(time_before_import <= file_to_import.imported_at <= timezone.now())
        self.assertFalse(file_to_import.last_import_attempt_failed)
        self.assertIsNone(file_to_import.last_import_attempt_failed_at)
        self.assertIsNone(file_to_import.last_import_fail_reason)

    def test_import_creates_storage_hierarchy_and_stores_metadata_file_with_readonly_container(self):
        container_path = "my/tumdss/container/02"  # must have 4 parts
        envelope_path = "envelope2"
        hierarchy_path = f"{envelope_path}/storage2/dir2/subdir2/subsubdir2"
        file_name = "file2.test"
        file_content = "test TEST 0123456789876543210 TEST test"
        metadata_file_content = json.dumps({"tum_id": self.user1.username, "projects": [], "metadata_fields": []})

        # create container
        with FakeRequest(), FakeRequestUser(self.user1):
            container = DSSContainer.objects.create(
                name="Test Container 2",
                path=container_path,
                read_write_setting=DSSContainer.READ_ONLY,
                import_option=DSSContainer.IMPORT_LIST,
            )

        # simulate automated API call from external service
        with FakeRequest(), FakeRequestUser(self.bot_user):
            file_to_import = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/{file_name}")

        # simulate import via celery task
        with NoRequest(), TemporaryDSSFile(
            filename=f"{container_path}/{envelope_path}/metadata.json", content=metadata_file_content
        ), TemporaryDSSFile(filename=f"{container_path}/{hierarchy_path}/{file_name}", content=file_content):
            import_dss_file(file_to_import.path)

        # check envelope
        envelope_qs = DSSEnvelope.objects.all()
        self.assertEqual(1, envelope_qs.count())
        envelope = envelope_qs.first()
        self.assertEqual("envelope2", envelope.path)
        self.assertEqual(container, envelope.container)
        self.assertEqual(metadata_file_content, json.dumps(envelope.metadata_file_content))

        # check storage
        storage_qs = Drive.objects.all()
        self.assertEqual(1, storage_qs.count())
        storage = storage_qs.first()
        self.assertEqual("storage2", storage.title)
        self.assertEqual(envelope, storage.envelope)

        # check directories
        directory_qs = Directory.objects.all()
        self.assertEqual(4, directory_qs.count())  # 1 virtual root + 3 actual directories
        directories = list(directory_qs)

        # check virtual root directory
        root_dir = directories[0]
        self.assertTrue(root_dir.is_virtual_root)
        self.assertEqual("/", root_dir.name)
        self.assertIsNone(root_dir.directory)
        self.assertEqual(storage, root_dir.drive)

        # check first directory
        first_dir = directories[1]
        self.assertEqual("dir2", first_dir.name)
        self.assertEqual(root_dir, first_dir.directory)

        # check sub directory
        sub_dir = directories[2]
        self.assertEqual("subdir2", sub_dir.name)
        self.assertEqual(first_dir, sub_dir.directory)

        # check sub-sub directory
        sub_sub_dir = directories[3]
        self.assertEqual("subsubdir2", sub_sub_dir.name)
        self.assertEqual(sub_dir, sub_sub_dir.directory)

        # check file
        self.assertEqual(1, File.objects.all().count())
        file = File.objects.all().first()
        self.assertEqual(len(file_content), file.file_size)
        self.assertEqual(file_name, file.title)
        self.assertEqual(sub_sub_dir, file.directory)
        self.assertEqual(f"{container_path}/{hierarchy_path}/{file_name}", str(file.path))

    def test_import_adds_metadata_to_storage_and_files(self):
        container_path = "my/tumdss/container/03"  # must have 4 parts
        hierarchy_path = "envelope/storage"

        # create metadata fields
        metadata_field_checkbox = MetadataField.objects.create(
            name="checkbox",
            description="desc1",
            base_type=MetadataField.BASE_TYPE_CHECKBOX,
        )
        metadata_field_fraction = MetadataField.objects.create(
            name="fraction",
            description="desc2",
            base_type=MetadataField.BASE_TYPE_FRACTION,
        )

        # create container hierarchy
        with FakeRequest(), FakeRequestUser(self.user1):
            container = DSSContainer.objects.create(
                name="Test Container 3",
                path=container_path,
                read_write_setting=DSSContainer.READ_ONLY,
                import_option=DSSContainer.IMPORT_LIST,
            )
            DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "projects": [],
                    "metadata_fields": [
                        {
                            "id": str(metadata_field_checkbox.pk),
                            "values": [
                                {"value": True},
                                {"value": False},
                            ],
                        },
                        {
                            "id": str(metadata_field_fraction.pk),
                            "values": [
                                {"nominator": 5, "denominator": 3},
                            ],
                        },
                    ],
                },
            )

        # simulate automated API call from external service
        with FakeRequest(), FakeRequestUser(self.bot_user):
            file_to_import1 = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/file1")
            file_to_import2 = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/file2")

        # simulate import via celery task
        time_before_import = timezone.now()
        with NoRequest(), TemporaryDSSFile(f"{container_path}/{hierarchy_path}/file1"), TemporaryDSSFile(
            f"{container_path}/{hierarchy_path}/file2"
        ):
            import_dss_file(file_to_import1.path)
            import_dss_file(file_to_import2.path)

        # check import stats
        file_to_import1.refresh_from_db()
        file_to_import2.refresh_from_db()
        self.assertTrue(file_to_import1.imported)
        self.assertTrue(file_to_import2.imported)
        self.assertTrue(time_before_import <= file_to_import1.imported_at <= timezone.now())
        self.assertTrue(time_before_import <= file_to_import2.imported_at <= timezone.now())

        # define helper function to check metadata values
        def __assert_correct_metadata_values(metadata_qs):
            md_checkbox_qs = metadata_qs.filter(field=metadata_field_checkbox)
            md_fraction_qs = metadata_qs.filter(field=metadata_field_fraction)
            self.assertEqual(2, md_checkbox_qs.count())
            self.assertEqual(1, md_fraction_qs.count())
            md_fraction = metadata_qs.filter(field=metadata_field_fraction).first()
            self.assertEqual(5, md_fraction.values.get("nominator"))
            self.assertEqual(3, md_fraction.values.get("denominator"))

        # check created storage
        storage_qs = Drive.objects.all()
        self.assertEqual(1, storage_qs.count())

        # check metadata on storage
        storage = storage_qs.first()
        __assert_correct_metadata_values(storage.metadata)

        # check imported files
        file_qs = File.objects.all()
        self.assertEqual(2, file_qs.count())
        files = list(file_qs)
        __assert_correct_metadata_values(files[0].metadata)
        __assert_correct_metadata_values(files[1].metadata)

    def test_failed_import_marks_filetoimport_as_failed(self):
        container_path = "my/tumdss/container/04"  # must have 4 parts
        hierarchy_path = "envelope/storage/dir1/dir1-1"
        file_name = "file4.test"
        file_content = "test 1234"

        # create container hierarchy
        with FakeRequest(), FakeRequestUser(self.user1):
            container = DSSContainer.objects.create(
                name="Test Container 3",
                path=container_path,
                read_write_setting=DSSContainer.READ_ONLY,
                import_option=DSSContainer.IMPORT_LIST,
            )
            DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "projects": [],
                    "metadata_fields": [],
                },
            )

        # simulate automated API call from external service
        with FakeRequest(), FakeRequestUser(self.bot_user):
            file_to_import = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/{file_name}")

        # simulate import via celery task
        time_before_import = timezone.now()
        with NoRequest(), TemporaryDSSFile(
            filename=f"{container_path}/{hierarchy_path}/{file_name}", content=file_content
        ), patch("eric.dss.helper_classes.DSSFileImport.create_data", side_effect=OSError("Fake Exception")):
            try:
                import_dss_file(file_to_import.path)
            except Exception as exc:
                self.assertIn("Fake Exception", str(exc))

        # check that the file was not imported and no hierarchy was created
        self.assertEqual(0, File.objects.all().count())
        self.assertEqual(0, Directory.objects.all().count())
        self.assertEqual(0, Drive.objects.all().count())

        # check DSSFileToImport error stats
        file_to_import.refresh_from_db()
        self.assertFalse(file_to_import.imported)
        self.assertIsNone(file_to_import.imported_at)
        self.assertTrue(file_to_import.last_import_attempt_failed)
        self.assertTrue(time_before_import <= file_to_import.last_import_attempt_failed_at <= timezone.now())
        self.assertIsNotNone(file_to_import.last_import_fail_reason)
        self.assertIn("Fake Exception", file_to_import.last_import_fail_reason)
        self.assertEqual(1, file_to_import.import_attempts)

        # retry: simulate import via celery task
        time_before_import = timezone.now()
        with NoRequest(), TemporaryDSSFile(
            filename=f"{container_path}/{hierarchy_path}/{file_name}", content=file_content
        ), patch("eric.dss.helper_classes.DSSFileImport.create_data", side_effect=Exception("Another Fake Exception")):
            try:
                import_dss_file(file_to_import.path)
            except Exception as exc:
                self.assertIn("Another Fake Exception", str(exc))

        # check that the file was not imported and no hierarchy was created
        self.assertEqual(0, File.objects.all().count())
        self.assertEqual(0, Directory.objects.all().count())
        self.assertEqual(0, Drive.objects.all().count())

        # check DSSFileToImport error stats
        file_to_import.refresh_from_db()
        self.assertFalse(file_to_import.imported)
        self.assertIsNone(file_to_import.imported_at)
        self.assertTrue(file_to_import.last_import_attempt_failed)
        self.assertTrue(time_before_import <= file_to_import.last_import_attempt_failed_at <= timezone.now())
        self.assertIsNotNone(file_to_import.last_import_fail_reason)
        self.assertIn("Another Fake Exception", file_to_import.last_import_fail_reason)
        self.assertEqual(2, file_to_import.import_attempts)

    def test_import_fails_for_missing_metadata_file(self):
        container_path = "my/tumdss/container/01"  # must have 4 parts
        hierarchy_path = "envelope_with_missing_metadata/storage"
        file_name = "file1.test"
        file_content = "test123test123"

        # create container hierarchy
        with FakeRequest(), FakeRequestUser(self.user1):
            DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_ONLY,
                import_option=DSSContainer.IMPORT_LIST,
            )

        # simulate automated API call from external service
        with FakeRequest(), FakeRequestUser(self.bot_user):
            file_to_import = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/{file_name}")

        # simulate import via celery task
        time_before_import = timezone.now()
        with NoRequest(), TemporaryDSSFile(
            filename=f"{container_path}/{hierarchy_path}/{file_name}", content=file_content
        ):
            try:
                import_dss_file(file_to_import.path)
            except Exception as exc:
                self.assertIn("metadata", str(exc))

        # check that no container have been created and the file was not imported
        self.assertEqual(0, File.objects.all().count())
        self.assertEqual(0, Directory.objects.all().count())
        self.assertEqual(0, Drive.objects.all().count())
        self.assertEqual(0, DSSEnvelope.objects.all().count())

        # check DSSFileToImport error stats
        file_to_import.refresh_from_db()
        self.assertTrue(file_to_import.last_import_attempt_failed)
        self.assertIsNotNone(file_to_import.last_import_fail_reason)
        self.assertEqual(1, file_to_import.import_attempts)
        self.assertIsNone(file_to_import.imported_at)
        self.assertFalse(file_to_import.imported)
        self.assertTrue(time_before_import < file_to_import.last_import_attempt_failed_at < timezone.now())

    def test_import_fails_for_missing_container(self):
        container_path = "my/tumdss/container/01"  # must have 4 parts
        hierarchy_path = "envelope/storage"
        file_name = "file1.test"
        file_content = "test123test123"

        # simulate automated API call from external service
        with FakeRequest(), FakeRequestUser(self.bot_user):
            file_to_import = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/{file_name}")

        # simulate import via celery task
        time_before_import = timezone.now()
        with NoRequest(), TemporaryDSSFile(
            filename=f"{container_path}/{hierarchy_path}/{file_name}", content=file_content
        ):
            try:
                import_dss_file(file_to_import.path)
            except Exception as exc:
                self.assertIn("container", str(exc))

        # check that no container have been created and the file was not imported
        self.assertEqual(0, DSSContainer.objects.all().count())
        self.assertEqual(0, File.objects.all().count())
        self.assertEqual(0, Directory.objects.all().count())
        self.assertEqual(0, Drive.objects.all().count())
        self.assertEqual(0, DSSEnvelope.objects.all().count())

        # check DSSFileToImport error stats
        file_to_import.refresh_from_db()
        self.assertTrue(file_to_import.last_import_attempt_failed)
        self.assertIsNotNone(file_to_import.last_import_fail_reason)
        self.assertEqual(1, file_to_import.import_attempts)
        self.assertIsNone(file_to_import.imported_at)
        self.assertFalse(file_to_import.imported)
        self.assertTrue(time_before_import < file_to_import.last_import_attempt_failed_at < timezone.now())

    def test_import_does_not_add_metadata_redundantly_for_multiple_files_in_storage(self):
        container_path = "my/tumdss/container/05"  # must have 4 parts
        hierarchy_path = "envelope/storage_multi_files"

        # create metadata fields
        metadata_field_checkbox = MetadataField.objects.create(
            name="checkbox",
            description="A checkbox field",
            base_type=MetadataField.BASE_TYPE_CHECKBOX,
        )

        # create container hierarchy
        with FakeRequest(), FakeRequestUser(self.user1):
            container = DSSContainer.objects.create(
                name="Test Container 3",
                path=container_path,
                read_write_setting=DSSContainer.READ_ONLY,
                import_option=DSSContainer.IMPORT_LIST,
            )
            DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "projects": [],
                    "metadata_fields": [
                        {
                            "id": str(metadata_field_checkbox.pk),
                            "values": [
                                {"value": True},
                            ],
                        },
                    ],
                },
            )

        # simulate automated API call from external service
        with FakeRequest(), FakeRequestUser(self.bot_user):
            file_to_import1 = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/file1")
            file_to_import2 = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/file2")
            file_to_import3 = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/file3")

        # simulate imports via celery task
        with NoRequest(), TemporaryDSSFile(f"{container_path}/{hierarchy_path}/file1"), TemporaryDSSFile(
            f"{container_path}/{hierarchy_path}/file2"
        ), TemporaryDSSFile(f"{container_path}/{hierarchy_path}/file3"):
            import_dss_file(file_to_import1.path)
            import_dss_file(file_to_import2.path)
            import_dss_file(file_to_import3.path)

        # check created storage
        drive_qs = Drive.objects.all()
        self.assertEqual(1, drive_qs.count())

        # check that the metadata was not added multiple times to the storage
        drive = drive_qs.first()
        self.assertEqual(1, drive.metadata.all().count())

    def test_import_adds_projects_to_storage_and_files(self):
        container_path = "my/tumdss/container/03"  # must have 4 parts
        hierarchy_path = "envelope/storage"

        self.memberRole = Role.objects.filter(name="Project Member").first()
        self.observerRole = Role.objects.filter(name="Observer").first()

        self.my_user1 = MyUser.objects.filter(pk=self.user1.pk).first()
        self.user_group = Group.objects.get(name="User")
        self.my_user1.groups.add(self.user_group)

        self.my_bot_user = MyUser.objects.filter(pk=self.bot_user.pk).first()
        self.my_bot_user.groups.add(self.user_group)

        # simulate automated API call from external service
        with FakeRequest(), FakeRequestUser(self.bot_user):
            self.project2 = Project.objects.create(name="Project 2")

            self.project3 = Project.objects.create(name="Project 3")

            # set user1 as observer in project2
            ProjectRoleUserAssignment.objects.create(
                user=self.my_user1,
                project=self.project2,
                role=self.observerRole,
            )

            file_to_import1 = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/file1")
            file_to_import2 = DSSFilesToImport.objects.create(path=f"/dss/{container_path}/{hierarchy_path}/file2")

        # create container hierarchy
        with FakeRequest(), FakeRequestUser(self.my_user1):
            self.project1 = Project.objects.create(name="Project 1")

            container = DSSContainer.objects.create(
                name="Test Container 3",
                path=container_path,
                read_write_setting=DSSContainer.READ_ONLY,
                import_option=DSSContainer.IMPORT_LIST,
            )
            DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "projects": [str(self.project1.pk), str(self.project2.pk), str(self.project3.pk)],
                    "metadata_fields": [],
                },
            )

        # simulate import via celery task
        time_before_import = timezone.now()
        with NoRequest(), TemporaryDSSFile(f"{container_path}/{hierarchy_path}/file1"), TemporaryDSSFile(
            f"{container_path}/{hierarchy_path}/file2"
        ):
            import_dss_file(file_to_import1.path)
            import_dss_file(file_to_import2.path)

        # check import stats
        file_to_import1.refresh_from_db()
        file_to_import2.refresh_from_db()
        self.assertTrue(file_to_import1.imported)
        self.assertTrue(file_to_import2.imported)
        self.assertTrue(time_before_import <= file_to_import1.imported_at <= timezone.now())
        self.assertTrue(time_before_import <= file_to_import2.imported_at <= timezone.now())

        # define helper function to check projects values
        def __assert_correct_projects_values(projects_qs):
            self.assertEqual(1, projects_qs.count())
            self.assertEqual([self.project1], list(projects_qs.all()))

        # check created storage
        storage_qs = Drive.objects.all()
        self.assertEqual(1, storage_qs.count())

        # check metadata on storage
        storage = storage_qs.first()
        __assert_correct_projects_values(storage.projects)

        # check imported files
        file_qs = File.objects.all()
        self.assertEqual(2, file_qs.count())
        files = list(file_qs)
        __assert_correct_projects_values(files[0].projects)
        __assert_correct_projects_values(files[1].projects)
