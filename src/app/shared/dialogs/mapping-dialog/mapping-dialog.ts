// import { CommonModule } from '@angular/common';
// import { Component, Inject } from '@angular/core';
// import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
// import { startWith } from 'rxjs';

// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatSelectModule } from '@angular/material/select';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
// type TransformKind = 'direct' | 'constant' | 'lookup';

// type MappingDialogData = {
//   mode: 'create' | 'edit';
//   row?: any;
//   defaults?: Partial<{
//     target_type: TargetType;
//     source_field: string;
//     destination_field: string;
//     transform_kind: TransformKind;
//     constant_value: string | null;
//     enabled: number;
//   }>;
// };

// @Component({
//   selector: 'app-mapping-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatButtonModule,
//     MatDialogModule,
//     MatDividerModule,
//     MatFormFieldModule,
//     MatIconModule,
//     MatInputModule,
//     MatSelectModule,
//     MatSlideToggleModule,
//   ],
//   templateUrl: './mapping-dialog.html',
//   styleUrl: './mapping-dialog.scss',
// })
// export class MappingDialog {
//   readonly targetTypes: TargetType[] = ['DHIS2', 'OPENMRS', 'LIS', 'CUSTOM_HTTP'];
//   readonly transformKinds: TransformKind[] = ['direct', 'constant', 'lookup'];
//   readonly dialogTitle;
//   readonly dialogSubtitle =
//     'Define how a normalized source field should shape the outbound payload for the selected connector.';

//   form: FormGroup;

//   readonly helperByType: Record<
//     TargetType,
//     { destinationExamples: string[]; helperLines: string[] }
//   > = {
//     DHIS2: {
//       destinationExamples: ['event.program', 'event.programStage', 'event.dataValues.resultValue'],
//       helperLines: [
//         'Prefer event.* paths for event payload construction.',
//         'Use event.dataValues.* for actual result content.',
//       ],
//     },
//     OPENMRS: {
//       destinationExamples: ['patient.identifier', 'encounter.encounterDatetime', 'obs.value'],
//       helperLines: [
//         'Use encounter.* and obs.* destinations for clinical result sends.',
//         'Map only the patient identifiers needed by the receiving workflow.',
//       ],
//     },
//     LIS: {
//       destinationExamples: ['result.testCode', 'result.value', 'specimen.accessionNumber'],
//       helperLines: [
//         'Use LIS-style groupings so downstream systems receive stable payload shapes.',
//         'Keep order.*, specimen.*, and result.* destinations readable and intentional.',
//       ],
//     },
//     CUSTOM_HTTP: {
//       destinationExamples: [
//         'payload.patient.identifier',
//         'payload.result.code',
//         'payload.result.value',
//       ],
//       helperLines: [
//         'Custom HTTP allows free-form destination names.',
//         'Choose stable names that mirror the partner API contract.',
//       ],
//     },
//   };

//   constructor(
//     private fb: FormBuilder,
//     private dialogRef: MatDialogRef<MappingDialog>,
//     @Inject(MAT_DIALOG_DATA) public data: MappingDialogData,
//   ) {
//       this.dialogTitle = this.data.mode === 'create' ? 'New mapping rule' : 'Edit mapping rule';

//     this.form = this.fb.nonNullable.group({
//       target_type: ['DHIS2' as TargetType, [Validators.required]],
//       source_field: ['', [Validators.maxLength(240)]],
//       destination_field: ['', [Validators.required, Validators.maxLength(240)]],
//       transform_kind: ['direct' as TransformKind, [Validators.required]],
//       constant_value: ['', [Validators.maxLength(240)]],
//       enabled: [true],
//     });

//     if (data?.defaults) {
//       this.form.patchValue({
//         target_type: data.defaults.target_type ?? 'DHIS2',
//         source_field: data.defaults.source_field ?? '',
//         destination_field: data.defaults.destination_field ?? '',
//         transform_kind: data.defaults.transform_kind ?? 'direct',
//         constant_value: data.defaults.constant_value ?? '',
//         enabled: (data.defaults.enabled ?? 1) === 1,
//       });
//     }

//     if (data?.row) {
//       this.form.patchValue({
//         target_type: data.row.target_type ?? 'DHIS2',
//         source_field: data.row.source_field ?? '',
//         destination_field: data.row.destination_field ?? '',
//         transform_kind: data.row.transform_kind ?? 'direct',
//         constant_value: data.row.constant_value ?? '',
//         enabled: (data.row.enabled ?? 1) === 1,
//       });
//     }

//     this.form.controls['transform_kind'].valueChanges
//       .pipe(startWith(this.form.controls['transform_kind']?.value))
//       .subscribe((kind) => this.applyConditionalValidators(kind));
//   }

//   get selectedTargetType() {
//     return this.form.controls['target_type'].value;
//   }

//   get selectedTransformKind() {
//     return this.form.controls['transform_kind'].value;
//   }

//   get helper() {
//     return (this.helperByType as any)[this.selectedTargetType];
//   }

//   get isConstantTransform() {
//     return this.selectedTransformKind === 'constant';
//   }

//   get translationHint() {
//     return this.isConstantTransform
//       ? 'Constant mappings send the configured value every time.'
//       : 'If the destination expects different coded values, save the rule first and then configure value translation from the table.';
//   }

//   cancel() {
//     this.dialogRef.close();
//   }

//   save() {
//     if (this.form.invalid) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     const raw = this.form.getRawValue();

//     this.dialogRef.close({
//       target_type: raw.target_type,
//       source_field: raw.transform_kind === 'constant' ? '' : raw.source_field.trim(),
//       destination_field: raw.destination_field.trim(),
//       transform_kind: raw.transform_kind,
//       constant_value: raw.transform_kind === 'constant' ? raw.constant_value.trim() : null,
//       enabled: raw.enabled ? 1 : 0,
//     });
//   }

//   private applyConditionalValidators(kind: TransformKind) {
//     const sourceControl = this.form.controls['source_field'];
//     const constantControl = this.form.controls['constant_value'];

//     if (kind === 'constant') {
//       sourceControl.setValidators([Validators.maxLength(240)]);
//       constantControl.setValidators([Validators.required, Validators.maxLength(240)]);
//     } else {
//       sourceControl.setValidators([Validators.required, Validators.maxLength(240)]);
//       constantControl.setValidators([Validators.maxLength(240)]);
//     }

//     sourceControl.updateValueAndValidity({ emitEvent: false });
//     constantControl.updateValueAndValidity({ emitEvent: false });
//   }
// }


import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { startWith } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
type TransformKind = 'direct' | 'constant' | 'lookup';

type MappingDialogData = {
  mode: 'create' | 'edit';
  row?: any;
  defaults?: Partial<{
    target_type: TargetType;
    source_field: string;
    destination_field: string;
    transform_kind: TransformKind;
    constant_value: string | null;
    enabled: number;
  }>;
};

@Component({
  selector: 'app-mapping-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './mapping-dialog.html',
  styleUrl: './mapping-dialog.scss',
})
export class MappingDialog {
  readonly targetTypes: TargetType[] = ['DHIS2', 'OPENMRS', 'LIS', 'CUSTOM_HTTP'];
  readonly transformKinds: TransformKind[] = ['direct', 'constant', 'lookup'];
  readonly dialogTitle;
  readonly dialogSubtitle =
    'Define how a canonical source field should shape the outbound payload for the selected connector.';

  form: FormGroup;

  readonly helperByType: Record<
    TargetType,
    { destinationExamples: string[]; helperLines: string[] }
  > = {
    DHIS2: {
      destinationExamples: [
        'events[0].program',
        'events[0].dataValues[0].value',
        'trackedEntities[0].attributes[0].value',
      ],
      helperLines: [
        'Use indexed array paths for DHIS2 event and tracker payloads.',
        'Source paths come from the canonical source document, for example patient.id or result.value.',
      ],
    },
    OPENMRS: {
      destinationExamples: ['patient.identifier', 'encounter.encounterDatetime', 'obs.value'],
      helperLines: [
        'Use encounter.* and obs.* destinations for clinical result sends.',
        'Map only the patient identifiers needed by the receiving workflow.',
      ],
    },
    LIS: {
      destinationExamples: ['result.testCode', 'result.value', 'specimen.accessionNumber'],
      helperLines: [
        'Use LIS-style groupings so downstream systems receive stable payload shapes.',
        'Keep order.*, specimen.*, and result.* destinations readable and intentional.',
      ],
    },
    CUSTOM_HTTP: {
      destinationExamples: [
        'payload.patient.identifier',
        'payload.result.code',
        'payload.result.value',
      ],
      helperLines: [
        'Custom HTTP allows free-form destination names.',
        'Choose stable names that mirror the partner API contract.',
      ],
    },
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MappingDialog>,
    @Inject(MAT_DIALOG_DATA) public data: MappingDialogData,
  ) {
      this.dialogTitle = this.data.mode === 'create' ? 'New mapping rule' : 'Edit mapping rule';

    this.form = this.fb.nonNullable.group({
      target_type: ['DHIS2' as TargetType, [Validators.required]],
      source_field: ['', [Validators.maxLength(240)]],
      destination_field: ['', [Validators.required, Validators.maxLength(240)]],
      transform_kind: ['direct' as TransformKind, [Validators.required]],
      constant_value: ['', [Validators.maxLength(240)]],
      enabled: [true],
    });

    if (data?.defaults) {
      this.form.patchValue({
        target_type: data.defaults.target_type ?? 'DHIS2',
        source_field: data.defaults.source_field ?? '',
        destination_field: data.defaults.destination_field ?? '',
        transform_kind: data.defaults.transform_kind ?? 'direct',
        constant_value: data.defaults.constant_value ?? '',
        enabled: (data.defaults.enabled ?? 1) === 1,
      });
    }

    if (data?.row) {
      this.form.patchValue({
        target_type: data.row.target_type ?? 'DHIS2',
        source_field: data.row.source_field ?? '',
        destination_field: data.row.destination_field ?? '',
        transform_kind: data.row.transform_kind ?? 'direct',
        constant_value: data.row.constant_value ?? '',
        enabled: (data.row.enabled ?? 1) === 1,
      });
    }

    this.form.controls['transform_kind'].valueChanges
      .pipe(startWith(this.form.controls['transform_kind']?.value))
      .subscribe((kind) => this.applyConditionalValidators(kind));
  }

  get selectedTargetType() {
    return this.form.controls['target_type'].value;
  }

  get selectedTransformKind() {
    return this.form.controls['transform_kind'].value;
  }

  get helper() {
    return (this.helperByType as any)[this.selectedTargetType];
  }

  get isConstantTransform() {
    return this.selectedTransformKind === 'constant';
  }

  get translationHint() {
    return this.isConstantTransform
      ? 'Constant mappings send the configured value every time.'
      : 'If the destination expects different coded values, save the rule first and then configure value translation from the table. Use bracket notation like events[0].dataValues[0].value for nested arrays.';
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.dialogRef.close({
      target_type: raw.target_type,
      source_field: raw.transform_kind === 'constant' ? '' : raw.source_field.trim(),
      destination_field: raw.destination_field.trim(),
      transform_kind: raw.transform_kind,
      constant_value: raw.transform_kind === 'constant' ? raw.constant_value.trim() : null,
      enabled: raw.enabled ? 1 : 0,
    });
  }

  private applyConditionalValidators(kind: TransformKind) {
    const sourceControl = this.form.controls['source_field'];
    const constantControl = this.form.controls['constant_value'];

    if (kind === 'constant') {
      sourceControl.setValidators([Validators.maxLength(240)]);
      constantControl.setValidators([Validators.required, Validators.maxLength(240)]);
    } else {
      sourceControl.setValidators([Validators.required, Validators.maxLength(240)]);
      constantControl.setValidators([Validators.maxLength(240)]);
    }

    sourceControl.updateValueAndValidity({ emitEvent: false });
    constantControl.updateValueAndValidity({ emitEvent: false });
  }
}
