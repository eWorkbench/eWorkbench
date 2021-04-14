# modals

## Usage

```ts
import { ModalsModule } from '@eworkbench/modals';
```

```ts
import { Component, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'eworkbench-example-page',
  templateUrl: './example-page.component.html',
  styleUrls: ['./example-page.component.scss'],
})
export class ExamplePageComponent {
  public modalRef?: BsModalRef;
  public constructor(private readonly modalService: BsModalService) {}

  public openModal(template: TemplateRef<any>): void {
    this.modalRef = this.modalService.show(template);
  }
}
```

```html
<eworkbench-button (click)="openModal(template)">Create template modal</eworkbench-button>

<ng-template #template>
  <eworkbench-modal>
    <div slot="header">Modal</div>
    <div slot="body">This is a modal.</div>
    <div slot="footer">This is a modal.</div>
  </eworkbench-modal>
</ng-template>
```

## Implementation

Possible values for modals:

```ts
@Input()
public className = 'modal-wrap';

@Input()
public modalFooter = true;
```

## Running unit tests

Run `npx nx test modals` to execute the unit tests.
