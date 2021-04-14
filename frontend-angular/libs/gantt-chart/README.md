# gantt-chart

The gantt chart selector can then be used in any template to implement this component after its module has been imported.

## Usage

```ts
import { GanttChartModule } from '@eworkbench/gantt-chart';
```

## Implementation

Possible values to configure via data binding:

```ts
@Input()
public config: GanttChartConfig = {};

@Input()
public rows: GanttChartRows = {};

@Input()
public items: GanttChartItems = {};

@Input()
public columns: GanttChartColumns = {};

@Input()
public columnsHeader = '';
```

```ts
@Component({
  template: `<eworkbench-gantt-chart></eworkbench-gantt-chart>`,
})
class GanttChartComponent {}
```

The `config` variable must follow a specific structure:

```ts
const config = {
  list: {
    rows,
    columns,
  },
  chart: {
    items,
  },
};
```

It's possible to set the complete `config` variable or each configuration option separately: `rows`, `columns`, `items`. The configuration will then automatically transformed to a compatible format. You can also only set the chart header by applying a name to `columnsHeader` instead of passing a configuration for `columns`.

`rows` and `items` must have an index value of type `string`:

```ts
const rows: GanttChartRows = {};
rows['my-id'] = {
  id: 'my-id',
  label: `Row label`,
  parentId: undefined,
  expanded: false,
};
```

## Running unit tests

Run `npx nx test gantt-chart` to execute the unit tests.
