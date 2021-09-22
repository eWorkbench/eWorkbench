# wysiwyg-editor

The wysiwyg-editor selector can then be used in any template to implement this component after its module has been imported.

## Usage

```ts
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
```

## Implementation

Possible values to configure via data binding:

```ts
@Input()
public id?: string;

@Input()
public control!: FormControl;

@Input()
public init?: Record<string, any>;

@Input()
public initialValue?: string;

@Input()
public inline?: boolean = false;

@Input()
public tagName?: string = 'div';

@Input()
public plugins?: string;

@Input()
public toolbar?: string | string[];
```

```ts
@Component({
  template: `<eworkbench-wysiwyg-editor [id]="'description'" [control]="this.f.description"></eworkbench-wysiwyg-editor>`,
})
class WYSIWYGEditorComponent {}
```

## Running unit tests

Run `npx nx test wysiwyg-editor` to execute the unit tests.
