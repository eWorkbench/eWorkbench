from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.shared_elements.models import CalendarAccess
from eric.shared_elements.rest.filters import CalendarAccessFilter
from eric.shared_elements.rest.serializers import CalendarAccessSerializer


class CalendarAccessViewSet(BaseAuthenticatedModelViewSet):
    serializer_class = CalendarAccessSerializer
    filterset_class = CalendarAccessFilter
    search_fields = ()

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return CalendarAccess.objects.viewable().prefetch_common()
