# forms

## Usage

```ts
import { FormsModule } from '@eworkbench/forms';
```

## Implementation

### Text Input

Use the class `.ewb-input`:

```html
<input class="form-control ewb-input" [formControl]="formControl" />
```

### Checkbox

Use it like Bootstrap v4 checkboxes:

```html
<div class="custom-control custom-checkbox">
  <input class="custom-control-input" type="checkbox" id="checkbox-bootstrap" [formControl]="formControl" />
  <label class="custom-control-label font-weight-normal" for="checkbox-bootstrap">Checkbox</label>
</div>
```

### Radio

Use it like Bootstrap v4 radios:

```html
<div class="custom-control custom-radio">
  <input type="radio" class="custom-control-input" id="radio-bootstrap-1" name="radio-stacked" [formControl]="formControl" />
  <label class="custom-control-label" for="radio-bootstrap-1">Radio 1</label>
</div>
<div class="custom-control custom-radio">
  <input type="radio" class="custom-control-input" id="radio-bootstrap-2" name="radio-stacked" [formControl]="formControl" />
  <label class="custom-control-label" for="radio-bootstrap-2">Radio 2</label>
</div>
```

### Button

Use the classes:

```
.ewb-button-big
.ewb-button-regular
.ewb-button-small
.ewb-button-primary
.ewb-button-secondary
.ewb-button-additional
```

```html
<input class="ewb-input" [formControl]="formControl" />
```

## Running unit tests

Run `npx nx test forms` to execute the unit tests.
