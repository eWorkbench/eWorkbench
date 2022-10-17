#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from eric.core.tests.test_utils import FakeRequest, FakeRequestUser
from eric.drives.models import Directory, Drive
from eric.dss.models.models import DSSContainer, DSSEnvelope
from eric.dss.tests.dss_test_utils import TemporaryDSSFile, mocked_safe_join
from eric.projects.models.exceptions import ContainerReadWriteException
from eric.shared_elements.models import File

User = get_user_model()


class ContainerPermissionsTest(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="user42", email="user1@workbench.test")
        self.superuser = User.objects.create_user(
            username="superuser", email="superuser@workbench.test", is_superuser=True
        )

    def test_creating_file_in_read_only_container_is_forbidden(self):
        container_path = "my/container/01234"
        filename = "myfile777.txt"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,  # start with RW to create directories
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)
            virtual_root_directory = drive.sub_directories.first()

            # set container to read-only
            container.read_write_setting = DSSContainer.READ_ONLY
            container.save()

            # try to create file in container
            try:
                with TemporaryDSSFile(f"{container_path}/envelope/storage/{filename}"):
                    File.objects.create(
                        name=filename,
                        path=f"/dss/{container_path}/envelope/storage/{filename}",
                        file_size=0,
                        original_filename=filename,
                        mime_type="text/plain",
                        directory=virtual_root_directory,
                    )
            except ContainerReadWriteException:
                pass  # should get here
            else:
                self.fail("Creating a file in a read-only container must be forbidden")

    def test_creating_file_in_read_write_no_new_container_is_forbidden(self):
        container_path = "my/container/0123"
        filename = "myfile77.txt"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,  # start with RW to create directories
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)
            virtual_root_directory = drive.sub_directories.first()

            # set container to read-write-no-new
            container.read_write_setting = DSSContainer.READ_WRITE_NO_NEW
            container.save()

            # try to create file in container
            try:
                with TemporaryDSSFile(f"{container_path}/envelope/storage/{filename}"):
                    File.objects.create(
                        name=filename,
                        path=f"/dss/{container_path}/envelope/storage/{filename}",
                        file_size=0,
                        original_filename=filename,
                        mime_type="text/plain",
                        directory=virtual_root_directory,
                    )
            except ContainerReadWriteException:
                pass  # should get here
            else:
                self.fail("Creating a file in a read-write-no-new container must be forbidden")

    def test_creating_directory_in_read_only_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/05",
                read_write_setting=DSSContainer.READ_WRITE_ALL,  # start with RW to create directories
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)
            virtual_root_directory = drive.sub_directories.first()

            # set container to read-only
            container.read_write_setting = DSSContainer.READ_ONLY
            container.save()

            # try to create directory in container
            try:
                Directory.objects.create(
                    name="Forbidden Directory",
                    directory=virtual_root_directory,
                    drive=drive,
                )
            except ValidationError as exc:
                self.assertIn("directory", exc.error_dict)
            else:
                self.fail("Creating a directory in a read-only container must be forbidden")

    def test_creating_directory_in_read_write_no_new_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/052",
                read_write_setting=DSSContainer.READ_WRITE_ALL,  # start with RW to create directories
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)
            virtual_root_directory = drive.sub_directories.first()

            # set container to read-write-no-new
            container.read_write_setting = DSSContainer.READ_WRITE_NO_NEW
            container.save()

            # try to create directory in container
            try:
                Directory.objects.create(
                    name="Forbidden Directory",
                    directory=virtual_root_directory,
                    drive=drive,
                )
            except ValidationError as exc:
                self.assertIn("directory", exc.error_dict)
            else:
                self.fail("Creating a directory in a read-write-no-new container must be forbidden")

    def test_creating_storage_in_read_only_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/05",
                read_write_setting=DSSContainer.READ_ONLY,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content="",
            )

            # try to create storage in container
            try:
                Drive.objects.create(title="storage", envelope=envelope)
            except ValidationError as exc:
                # check that the error is for the storage, not the automatically created root directory
                self.assertIn("drive", exc.error_dict)
                self.assertIn("storage", str(exc))
            else:
                self.fail("Creating a storage in a read-only container must be forbidden")

    def test_creating_storage_in_read_write_no_new_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/053",
                read_write_setting=DSSContainer.READ_WRITE_NO_NEW,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content="",
            )

            # try to create storage in container
            try:
                Drive.objects.create(title="storage", envelope=envelope)
            except ValidationError as exc:
                # check that the error is for the storage, not the automatically created root directory
                self.assertIn("drive", exc.error_dict)
                self.assertIn("storage", str(exc))
            else:
                self.fail("Creating a storage in a read-write-no-new container must be forbidden")

    def test_moving_file_into_read_only_container_is_forbidden(self):
        container_path = "lab/container/01"
        filename = "blob.bin"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,  # start with RW to create directories
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)
            virtual_root_directory = drive.sub_directories.first()

            # set container to read-only
            container.read_write_setting = DSSContainer.READ_ONLY
            container.save()

            with TemporaryDSSFile(f"{container_path}/envelope/storage/{filename}"), mocked_safe_join():
                # create standalone file
                file = File.objects.create(
                    name=filename,
                    path=f"/dss/{container_path}/envelope/storage/{filename}",
                    file_size=0,
                    original_filename=filename,
                    mime_type="text/plain",
                    directory=None,
                )

                # try to move file into container
                try:
                    file.directory = virtual_root_directory
                    file.save()
                except Exception as exc:
                    self.assertIn("not allowed", str(exc))
                else:
                    self.fail("Moving a file into a read-only container must be forbidden")

    def test_moving_file_into_read_write_no_new_container_is_forbidden(self):
        container_path = "lab/container/012"
        filename = "blob2.bin"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,  # start with RW to create directories
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)
            virtual_root_directory = drive.sub_directories.first()

            # set container to read-write-no-new
            container.read_write_setting = DSSContainer.READ_WRITE_NO_NEW
            container.save()

            with TemporaryDSSFile(f"{container_path}/envelope/storage/{filename}"), mocked_safe_join():
                # create standalone file
                file = File.objects.create(
                    name=filename,
                    path=f"/dss/{container_path}/envelope/storage/{filename}",
                    file_size=0,
                    original_filename=filename,
                    mime_type="text/plain",
                    directory=None,
                )

                # try to move file into container
                try:
                    file.directory = virtual_root_directory
                    file.save()
                except Exception as exc:
                    self.assertIn("not allowed", str(exc))
                else:
                    self.fail("Moving a file into a read-write-no-new container must be forbidden")

    def test_moving_directory_into_read_only_container_is_forbidden(self):
        container_path = "shared/container/01"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,  # start with RW to create directories
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            dss_drive = Drive.objects.create(title="storage", envelope=envelope)
            dss_root_dir = dss_drive.sub_directories.first()

            # set container to read-only
            container.read_write_setting = DSSContainer.READ_ONLY
            container.save()

            # create directory in normal storage
            normal_storage = Drive.objects.create(title="Normal Storage")
            normal_root_dir = normal_storage.sub_directories.filter(is_virtual_root=True).first()
            directory = Directory.objects.create(
                name="Test Directory 123",
                directory=normal_root_dir,
                drive=normal_storage,
            )

            # try to move directory into container
            try:
                directory.directory = dss_root_dir
                directory.drive = dss_drive
                directory.save()
            except Exception as exc:
                self.assertIn("read only", str(exc))
            else:
                self.fail("Moving a directory into a read-only container must be forbidden")

    def test_moving_directory_into_read_write_no_new_container_is_forbidden(self):
        container_path = "shared/container/013"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,  # start with RW to create directories
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            dss_drive = Drive.objects.create(title="storage", envelope=envelope)
            dss_root_dir = dss_drive.sub_directories.first()

            # set container to read-only
            container.read_write_setting = DSSContainer.READ_WRITE_NO_NEW
            container.save()

            # create directory in normal storage
            normal_storage = Drive.objects.create(title="Normal Storage")
            normal_root_dir = normal_storage.sub_directories.filter(is_virtual_root=True).first()
            directory = Directory.objects.create(
                name="Test Directory 1234",
                directory=normal_root_dir,
                drive=normal_storage,
            )

            # try to move directory into container
            try:
                directory.directory = dss_root_dir
                directory.drive = dss_drive
                directory.save()
            except Exception as exc:
                self.assertIn("allows no new directories", str(exc))
            else:
                self.fail("Moving a directory into a read-write-no-new container must be forbidden")

    def test_moving_storage_into_read_only_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/05",
                read_write_setting=DSSContainer.READ_ONLY,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content="",
            )

            # create standalone storage
            storage = Drive.objects.create(title="test_storage")

            # try to move storage into container
            try:
                storage.envelope = envelope
                storage.save()
            except ValidationError as exc:
                # check that the error is for the storage, not the automatically created root directory
                self.assertIn("envelope", exc.error_dict)
                self.assertIn("storage", str(exc))
            else:
                self.fail("Moving a storage into a read-only container must be forbidden")

    def test_moving_storage_into_read_write_no_new_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/055",
                read_write_setting=DSSContainer.READ_WRITE_NO_NEW,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content="",
            )

            # create standalone storage
            storage = Drive.objects.create(title="test_storage")

            # try to move storage into container
            try:
                storage.envelope = envelope
                storage.save()
            except ValidationError as exc:
                # check that the error is for the storage, not the automatically created root directory
                self.assertIn("envelope", exc.error_dict)
                self.assertIn("storage", str(exc))
            else:
                self.fail("Moving a storage into a read-only container must be forbidden")

    def test_creating_storage_directory_and_file_in_writable_container_works(self):
        container_path = "my/test_container/01"
        filename = "myfile.md"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )

            # create storage
            storage = Drive.objects.create(title="newstorage", envelope=envelope)
            virtual_root_directory = storage.sub_directories.first()

            # create directory
            directory = Directory.objects.create(name="newdir", directory=virtual_root_directory, drive=storage)

            # create file
            with TemporaryDSSFile(f"{container_path}/envelope/newstorage/newdir/{filename}"):
                file = File.objects.create(
                    name=filename,
                    path=f"/dss/{container_path}/envelope/newstorage/newdir/{filename}",
                    file_size=0,
                    original_filename=filename,
                    mime_type="text/plain",
                    directory=directory,
                )

            # check storage in database
            storage.refresh_from_db()
            self.assertEqual(envelope, storage.envelope)

            # check directory in database
            directory.refresh_from_db()
            self.assertEqual(virtual_root_directory, directory.directory)
            self.assertEqual(storage, directory.drive)

            # check file attributes in database
            file.refresh_from_db()
            self.assertEqual(directory, file.directory)

    def test_moving_file_into_writable_container_works(self):
        container_path = "my/test_container/02"
        filename = "my-other-file.txt"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)
            virtual_root_directory = drive.sub_directories.first()

            with TemporaryDSSFile(f"{container_path}/envelope/storage/{filename}"), mocked_safe_join():
                # create standalone file
                file = File.objects.create(
                    name=filename,
                    path=f"/dss/{container_path}/envelope/storage/{filename}",
                    file_size=0,
                    original_filename=filename,
                    mime_type="text/plain",
                    directory=None,
                )

                # move file into container
                file.directory = virtual_root_directory
                file.save()

            # check file attributes in database
            file.refresh_from_db()
            self.assertEqual(virtual_root_directory, file.directory)

    def test_moving_file_between_containers_is_forbidden(self):
        container_path1 = "my/container/001"
        filename = "somefile.txt"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create first container hierarchy
            container1 = DSSContainer.objects.create(
                name="Test Container",
                path=container_path1,
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope1 = DSSEnvelope.objects.create(
                path="envelope",
                container=container1,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive1 = Drive.objects.create(title="storage", envelope=envelope1)
            virtual_root_directory1 = drive1.sub_directories.first()

            # create file in first container
            with TemporaryDSSFile(f"{container_path1}/envelope/storage/{filename}"):
                file = File.objects.create(
                    name=filename,
                    path=f"/dss/{container_path1}/envelope/storage/{filename}",
                    file_size=0,
                    original_filename=filename,
                    mime_type="text/plain",
                    directory=virtual_root_directory1,
                )

                # create second container hierarchy
                container2 = DSSContainer.objects.create(
                    name="Second Writable Container",
                    path="my/container/rw",
                    read_write_setting=DSSContainer.READ_WRITE_ALL,
                    import_option=DSSContainer.IMPORT_ALL,
                )
                envelope2 = DSSEnvelope.objects.create(
                    path="envelope2",
                    container=container2,
                    metadata_file_content={
                        "tum_id": self.user1.username,
                        "metadata_fields": [],
                    },
                )
                drive2 = Drive.objects.create(title="storage2", envelope=envelope2)
                virtual_root_directory2 = drive2.sub_directories.first()

                # try to move file to other container
                try:
                    file.directory = virtual_root_directory2
                    file.save()
                except ValidationError as exc:
                    self.assertIn("container", str(exc))
                    self.assertIn("not allowed", str(exc))
                else:
                    self.fail("Moving files between DSS containers must be forbidden")

    def test_moving_directory_between_containers_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create first container hierarchy
            container1 = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/1",
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope1 = DSSEnvelope.objects.create(
                path="envelope",
                container=container1,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            dss_drive1 = Drive.objects.create(title="storage", envelope=envelope1)
            root_directory1 = dss_drive1.sub_directories.first()

            # create directory in container 1
            directory = Directory.objects.create(name="Test Directory", drive=dss_drive1, directory=root_directory1)

            # create second container hierarchy
            container2 = DSSContainer.objects.create(
                name="Test Container 2",
                path="my/container/2",
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope2 = DSSEnvelope.objects.create(
                path="envelope",
                container=container2,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            dss_drive2 = Drive.objects.create(title="storage", envelope=envelope2)
            root_directory2 = dss_drive2.sub_directories.first()

            # try to move the directory out of the container
            try:
                directory.directory = root_directory2
                directory.drive = dss_drive2
                directory.save()
            except ValidationError as exc:
                self.assertIn("not allowed", str(exc))
            else:
                self.fail("Moving directories between DSS containers must be forbidden")

    def test_moving_storage_between_containers_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create first container hierarchy
            container1 = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/1",
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope1 = DSSEnvelope.objects.create(
                path="envelope",
                container=container1,
                metadata_file_content={},
            )

            # create storage in container1
            storage = Drive.objects.create(title="storage", envelope=envelope1)

            # create second container hierarchy
            container2 = DSSContainer.objects.create(
                name="Test Container 2",
                path="my/container/2",
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope2 = DSSEnvelope.objects.create(path="envelope", container=container2, metadata_file_content={})

            # try to move the storage to the other container
            try:
                storage.envelope = envelope2
                storage.save()
            except ValidationError as exc:
                self.assertIn("not allowed", str(exc))
            else:
                self.fail("Moving storages between DSS containers must be forbidden")

    def test_moving_file_out_of_container_is_forbidden(self):
        container_path1 = "my/container/ro"
        filename = "myfile.txt"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container1 = DSSContainer.objects.create(
                name="Test Container",
                path=container_path1,
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope1 = DSSEnvelope.objects.create(
                path="envelope",
                container=container1,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive1 = Drive.objects.create(title="storage", envelope=envelope1)
            virtual_root_directory1 = drive1.sub_directories.first()

            # create file in container
            with TemporaryDSSFile(f"{container_path1}/envelope/storage/{filename}"):
                file = File.objects.create(
                    name=filename,
                    path=f"/dss/{container_path1}/envelope/storage/{filename}",
                    file_size=0,
                    original_filename=filename,
                    mime_type="text/plain",
                    directory=virtual_root_directory1,
                )

                # try to take file out of container
                try:
                    file.directory = None
                    file.save()
                except ValidationError as exc:
                    self.assertIn("not allowed", str(exc))
                else:
                    self.fail("Moving files out of DSS containers must be forbidden")

    def test_moving_directory_out_of_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/ro",
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            dss_drive = Drive.objects.create(title="storage", envelope=envelope)
            root_directory = dss_drive.sub_directories.first()

            # create directory in container
            directory = Directory.objects.create(name="Test Directory", drive=dss_drive, directory=root_directory)

            # try to move the directory out of the container
            normal_storage = Drive.objects.create(title="Normal Storage")
            normal_root_dir = normal_storage.sub_directories.filter(is_virtual_root=True).first()
            try:
                directory.directory = normal_root_dir
                directory.drive = normal_storage
                directory.save()
            except ValidationError as exc:
                self.assertIn("not allowed", str(exc))
            else:
                self.fail("Moving directories out of DSS containers must be forbidden")

    def test_moving_storage_out_of_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/ro",
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            # create storage in container
            storage = Drive.objects.create(title="storage", envelope=envelope)

            # try to move the storage out of the container
            try:
                storage.envelope = None
                storage.save()
            except ValidationError as exc:
                self.assertIn("not allowed", str(exc))
            else:
                self.fail("Moving storages out of DSS containers must be forbidden")

    def test_moving_file_in_read_only_container_is_forbidden(self):
        container_path1 = "my/container/00123"
        filename = "somefile42.txt"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create first container hierarchy
            container1 = DSSContainer.objects.create(
                name="Test Container",
                path=container_path1,
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope1 = DSSEnvelope.objects.create(
                path="envelope",
                container=container1,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive1 = Drive.objects.create(title="storage", envelope=envelope1)
            drive2 = Drive.objects.create(title="storage2", envelope=envelope1)
            virtual_root_directory1 = drive1.sub_directories.first()
            virtual_root_directory2 = drive2.sub_directories.first()

            # create file in first container
            with TemporaryDSSFile(f"{container_path1}/envelope/storage/{filename}"):
                file = File.objects.create(
                    name=filename,
                    path=f"/dss/{container_path1}/envelope/storage/{filename}",
                    file_size=0,
                    original_filename=filename,
                    mime_type="text/plain",
                    directory=virtual_root_directory1,
                )

                # set container to read-only
                container1.read_write_setting = DSSContainer.READ_ONLY
                container1.save()

                # try to move file to another storage in the same read only container
                try:
                    file.directory = virtual_root_directory2
                    file.save()
                except ValidationError as exc:
                    self.assertIn("container", str(exc))
                    self.assertIn("not allowed", str(exc))
                else:
                    self.fail("Moving files within read-only DSS containers must be forbidden")

    def test_trashing_file_in_read_only_container_is_forbidden(self):
        container_path = "my/container/00123"
        filename = "somefile42.txt"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create first container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)
            virtual_root_directory = drive.sub_directories.first()

            # create file in container
            with TemporaryDSSFile(f"{container_path}/envelope/storage/{filename}"):
                file = File.objects.create(
                    name=filename,
                    path=f"/dss/{container_path}/envelope/storage/{filename}",
                    file_size=0,
                    original_filename=filename,
                    mime_type="text/plain",
                    directory=virtual_root_directory,
                )

                # set container to read-only
                container.read_write_setting = DSSContainer.READ_ONLY
                container.save()

                # try to trash a file in the read only container
                try:
                    file.trash()
                except ValidationError as exc:
                    self.assertIn("container", str(exc))
                    self.assertIn("not allowed", str(exc))
                else:
                    self.fail("Moving files within read-only DSS containers must be forbidden")

    def test_trashing_storage_in_read_only_container_is_forbidden(self):
        container_path = "my/container/00123"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create first container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)

            # set container to read-only
            container.read_write_setting = DSSContainer.READ_ONLY
            container.save()

            # try to trash a file in the read only container
            try:
                drive.trash()
            except ValidationError as exc:
                self.assertIn("container", str(exc))
                self.assertIn("not allowed", str(exc))
            else:
                self.fail("Moving files within read-only DSS containers must be forbidden")

    def test_deleting_file_in_read_only_container_is_forbidden(self):
        container_path = "my/container/00123"
        filename = "somefile42.txt"

        with FakeRequest(), FakeRequestUser(self.superuser):
            # create first container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path=container_path,
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            drive = Drive.objects.create(title="storage", envelope=envelope)
            virtual_root_directory = drive.sub_directories.first()

            # create file in container
            with TemporaryDSSFile(f"{container_path}/envelope/storage/{filename}"):
                file = File.objects.create(
                    name=filename,
                    path=f"/dss/{container_path}/envelope/storage/{filename}",
                    file_size=0,
                    original_filename=filename,
                    mime_type="text/plain",
                    directory=virtual_root_directory,
                )

                file.trash()

                # set container to read-only
                container.read_write_setting = DSSContainer.READ_ONLY
                container.save()

                # try to trash a file in the read only container
                try:
                    file.delete()
                except ValidationError as exc:
                    self.assertIn("container", str(exc))
                    self.assertIn("not allowed", str(exc))
                else:
                    self.fail("Deleting files in read-only DSS containers must be forbidden")

    def test_deleting_storage_in_read_only_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/ro",
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            dss_drive = Drive.objects.create(title="storage", envelope=envelope)

            dss_drive.trash()

            # set container to read-only
            container.read_write_setting = DSSContainer.READ_ONLY
            container.save()

            try:
                dss_drive.delete()
            except ValidationError as exc:
                self.assertIn("not allowed", str(exc))
            else:
                self.fail("Deleting storages in read-only DSS containers must be forbidden")

    def test_deleting_directory_in_read_only_container_is_forbidden(self):
        with FakeRequest(), FakeRequestUser(self.superuser):
            # create container hierarchy
            container = DSSContainer.objects.create(
                name="Test Container",
                path="my/container/ro",
                read_write_setting=DSSContainer.READ_WRITE_ALL,
                import_option=DSSContainer.IMPORT_ALL,
            )
            envelope = DSSEnvelope.objects.create(
                path="envelope",
                container=container,
                metadata_file_content={
                    "tum_id": self.user1.username,
                    "metadata_fields": [],
                },
            )
            dss_drive = Drive.objects.create(title="storage", envelope=envelope)
            root_directory = dss_drive.sub_directories.first()

            # create directory in container
            directory = Directory.objects.create(name="Test Directory", drive=dss_drive, directory=root_directory)

            # set container to read-only
            container.read_write_setting = DSSContainer.READ_ONLY
            container.save()

            try:
                directory.delete()
            except ValidationError as exc:
                self.assertIn("not allowed", str(exc))
            else:
                self.fail("Deleting directories in read-only DSS containers must be forbidden")
