from eric.core.rest.serializers import BaseModelWithCreatedBySerializer
from eric.shared_elements.models import CalendarAccess


class CalendarAccessSerializer(BaseModelWithCreatedBySerializer):
    class Meta:
        model = CalendarAccess
        fields = ('pk', 'created_by', 'created_at', 'last_modified_by', 'last_modified_at')
