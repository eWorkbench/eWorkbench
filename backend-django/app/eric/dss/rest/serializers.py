#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail, ValidationError
from rest_framework.settings import api_settings
from rest_framework.utils import html

from eric.core.rest.serializers import BaseModelWithCreatedByAndSoftDeleteSerializer
from eric.dss.models.models import DSSContainer, DSSEnvelope, DSSFilesToImport
from eric.metadata.rest.serializers import EntityMetadataSerializerMixin
from eric.projects.rest.serializers.project import ProjectPrimaryKeyRelatedField

logger = logging.getLogger(__name__)


class DSSEnvelopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DSSEnvelope
        fields = (
            "pk",
            "path",
            "metadata_file_content",
            "container",
            "imported",
        )
        read_only_fields = (
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
        )


class DSSContainerSerializer(BaseModelWithCreatedByAndSoftDeleteSerializer, EntityMetadataSerializerMixin):
    """REST API Serializer for DSS Containers"""

    projects = ProjectPrimaryKeyRelatedField(many=True, required=False)

    envelopes = DSSEnvelopeSerializer(
        many=True,
        required=False,
        read_only=True,
        source="dss_envelopes",
    )

    class Meta:
        model = DSSContainer
        fields = (
            "pk",
            "name",
            "path",
            "read_write_setting",
            "import_option",
            "is_mounted",
            "projects",
            "envelopes",
            "created_by",
            "created_at",
            "last_modified_by",
            "last_modified_at",
            "url",
            "deleted",
        )
        read_only_fields = ()


class DSSFilesToImportListSerializer(serializers.ListSerializer):
    """
    This ListSerializer will bulk create items if the request data is a list of paths like the following json:
    [
        {"path":"/dss/dssfs03/tumdss/ab12cd/ab12cd-dss-0000/env0123/stor-abc/export/data/raw/part1.tar.gz"},
        {"path":"/dss/dssfs03/tumdss/ab12cd/ab12cd-dss-0000/env0123/stor-abc/export/data/raw/part2.tar.gz"},
        {"path":"/dss/dssfs03/tumdss/ab12cd/ab12cd-dss-0000/env0123/stor-abc/export/data/raw/part3.tar.gz"}
    ]
    """

    def to_internal_value(self, data):
        """
        This implements the same relevant logic as ListSerializer except that if one or more items fail validation,
        processing for other items that did not fail will continue.
        """
        if html.is_html_input(data):
            data = html.parse_html_list(data, default=[])

        if not isinstance(data, list):
            message = self.error_messages["not_a_list"].format(input_type=type(data).__name__)
            raise ValidationError({api_settings.NON_FIELD_ERRORS_KEY: [message]}, code="not_a_list")

        if not self.allow_empty and len(data) == 0:
            message = self.error_messages["empty"]
            raise ValidationError({api_settings.NON_FIELD_ERRORS_KEY: [message]}, code="empty")

        ret = []
        errors = []

        for item in data:
            try:
                validated = self.child.run_validation(item)
            except ValidationError as exc:
                # this adds the type ErrorDetail to the validated data if it's a unique error
                # it will be removed in the create function so we can count the unique errors and log them
                if "path" in exc.detail.keys() and exc.detail["path"][0].code == "unique":
                    ret.append(exc.detail)
                # other ValidationErrors will be processes as they would be normally
                else:
                    errors.append(exc.detail)
            else:
                ret.append(validated)
                errors.append({})

        if any(errors):
            raise ValidationError(errors)

        return ret

    def create(self, validated_data):
        not_unique_validated_data = []
        actually_validated_data = []
        error_count = 0
        for data in validated_data:
            if (
                isinstance(data["path"], list)
                and isinstance(data["path"][0], ErrorDetail)
                and data["path"][0].code == "unique"
            ):
                error_count += 1
            else:
                not_unique_validated_data.append(data)

        for data in not_unique_validated_data:
            try:
                DSSFilesToImport.validate_path_is_within_dss_storage(data["path"])
            except DjangoValidationError:
                error_count += 1
            else:
                actually_validated_data.append(data)

        logger.info(f"The number of invalid paths and thereby not imported items in this request was: {error_count}")

        files_to_import = [DSSFilesToImport(**item) for item in actually_validated_data]
        return DSSFilesToImport.objects.bulk_create(files_to_import, ignore_conflicts=True)


class DSSFilesToImportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DSSFilesToImport
        fields = (
            "pk",
            "path",
            "imported",
            "imported_at",
            "last_import_attempt_failed",
            "last_import_attempt_failed_at",
            "last_import_fail_reason",
            "created_at",
            "last_modified_at",
        )
        read_only_fields = ()
        # we will use a special list Serializer, so we can bulk_create items. Creation of single items is also possible.
        list_serializer_class = DSSFilesToImportListSerializer
