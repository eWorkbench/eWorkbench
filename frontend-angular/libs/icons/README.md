# icons

## Usage

```ts
import { IconsModule } from '@eworkbench/icons';
```

## Implementation

Possible values for icons:

```ts
@Input()
public className = '';
```

Icon component:

```ts
@Component({
  template: `<eworkbench-icon [className]="name"></eworkbench-icon>`,
})
class IconComponent {
  public className = 'my-icon-name';
}
```

## Running unit tests

Run `npx nx test icons` to execute the unit tests.
