How to add the custom metadata feature to a workbench element
=============================================================

Backend: EntityModel
--------------------
```
metadata = MetadataRelation()
```

```
track_related_many = (
    ('metadata', ('field', 'values',)),
)
```

```
def export_metadata_v1():
    "metadata": Metadata.export_all_from_entity(self),
```

```
def restore_metadata_v1():
    Metadata.restore_all_from_entity(self, metadata.get("metadata"))
```

Backend: EntitySerializer
-------------------------
add superclass: `EntityMetadataSerializerMixin`

```
metadata = EntityMetadataSerializer(
	read_only=False,
	many=True,
	required=False,
)
```

class Meta:
    fields += ('metadata',)

```
def create():
    metadata_list = self.pop_metadata(validated_data)
    instance = ... create() ...
    self.create_metadata(metadata_list, instance)
```

```
def update():
    metadata_list = self.pop_metadata(validated_data)
    with transaction.atomic():
        self.update_metadata(metadata_list, instance)
```

Backend: Entity Export Template
--------------------
```
{% load metadata_widget %}
<p>{% trans "Metadata" %}:
    {% all_metadata instance %}
</p>
```

Frontend: EntityView
--------------------
```
<!-- Metadata -->
<metadata-fields-widget
    base-model="vm.task"
    base-url-model="task"
    read-only="vm.isReadOnly()"
    on-save="vm.saveTaskPartial('metadata', vm.task.metadata)"
    on-save-multiple="vm.saveTask()"
    on-abort="vm.resetErrors()"
    metadata="vm.task.metadata">
</metadata-fields-widget>
```

Frontend: SmallEntityView
-------------------------
```
<!-- metadata -->
<div class="form-group">
    <label class="col-sm-3 control-label" for="task_metadata" translate>
        Metadata
    </label>
    <div class="col-sm-9">
        <metadata-fields-widget
            base-model="vm.task"
            base-url-model="task"
            read-only="vm.isReadOnly()"
            metadata="vm.task.metadata">
        </metadata-fields-widget>
    </div>
</div>
```

Frontend: services\workbenchElements\workbenchElements.js
---------------------------------------------------------
Add Label
```
"metadata": gettextCatalog.getString("Metadata")
```
