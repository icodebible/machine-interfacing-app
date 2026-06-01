// import { CommonModule } from '@angular/common';
// import { Component, computed, inject, signal } from '@angular/core';
// import { FormsModule } from '@angular/forms';

// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatSelectModule } from '@angular/material/select';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatTooltipModule } from '@angular/material/tooltip';

// import { PlatformApiService } from '../../../core/platform/platform-api.service';

// type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

// type LisTargetOption = {
//   id: string;
//   name: string;
//   type: MappingTargetType;
//   base_url: string;
//   enabled: number;
// };

// type LisUserOption = {
//   uuid: string;
//   username?: string | null;
//   display: string;
//   personUuid?: string | null;
// };

// type LisAnswerOption = {
//   uuid: string;
//   display: string;
//   shortName?: string | null;
//   analyzerCodes?: string[];
//   sourceValues?: string[];
// };

// type LisAnswerDraft = {
//   sourceValue: string;
//   sourceAliases?: string[];
//   destinationUuid: string;
//   display?: string | null;
//   shortName?: string | null;
//   analyzerCodes?: string[];
// };

// type LisParameterDraft = {
//   selected: boolean;
//   analyzerCode: string;
//   analyzerAliases: string[];
//   display: string;
//   conceptUuid: string;
//   allocationUuid: string;
//   datatype: string;
//   answerOptions: LisAnswerOption[];
//   answers: LisAnswerDraft[];
// };

// type OpenMrsLisMetadata = {
//   target?: { id: string; name: string; type: string; baseUrl: string };
//   sample?: { uuid?: string | null; label?: string | null; found?: boolean };
//   parameters?: Array<any>;
//   instruments?: Array<{ uuid: string; display: string }>;
//   testOrders?: Array<{ uuid: string; display: string }>;
//   users?: LisUserOption[];
//   settings?: Record<string, string | null>;
//   warnings?: string[];
// };

// type DialogData = {
//   targets?: LisTargetOption[];
//   selectedTargetId?: string | null;
// };

// @Component({
//   selector: 'app-openmrs-lis-mapping-assistant-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatButtonModule,
//     MatDialogModule,
//     MatDividerModule,
//     MatFormFieldModule,
//     MatIconModule,
//     MatInputModule,
//     MatProgressBarModule,
//     MatSelectModule,
//     MatSnackBarModule,
//     MatTooltipModule,
//   ],
//   templateUrl: './openmrs-lis-mapping-assistant-dialog.html',
//   styleUrl: './openmrs-lis-mapping-assistant-dialog.scss',
// })
// export class OpenMrsLisMappingAssistantDialog {
//   private readonly api = inject(PlatformApiService);
//   private readonly snack = inject(MatSnackBar);
//   private readonly dialogRef = inject(MatDialogRef<OpenMrsLisMappingAssistantDialog>);
//   private readonly data = inject<DialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};

//   readonly targets = signal<LisTargetOption[]>(this.data.targets ?? []);
//   readonly selectedTargetId = signal<string>(
//     this.data.selectedTargetId ?? this.targets()[0]?.id ?? '',
//   );
//   readonly sampleId = signal('NPHL/22/0000001');
//   readonly metadata = signal<OpenMrsLisMetadata | null>(null);
//   readonly parameterDrafts = signal<LisParameterDraft[]>([]);
//   readonly metadataLoading = signal(false);
//   readonly seeding = signal(false);

//   readonly instrumentUuid = signal('');
//   readonly testedBy = signal('');
//   readonly statusCategory = signal('RESULT_REMARKS');
//   readonly statusStatus = signal('REMARKS');
//   readonly statusRemarks = signal('Imported from analyzer via machine interfacing');

//   readonly selectedTarget = computed(() => {
//     const id = this.selectedTargetId();
//     return this.targets().find((target) => target.id === id) ?? null;
//   });

//   readonly selectedParameters = computed(() =>
//     this.parameterDrafts().filter((draft) => draft.selected),
//   );
//   readonly readyParameterCount = computed(
//     () =>
//       this.selectedParameters().filter(
//         (draft) => draft.analyzerCode && draft.conceptUuid && draft.allocationUuid,
//       ).length,
//   );
//   readonly missingRequiredCount = computed(
//     () => this.selectedParameters().length - this.readyParameterCount(),
//   );
//   readonly userSearch = signal('');

//   readonly selectedTestedByUser = computed(() => {
//     const uuid = this.testedBy();
//     return (this.metadata()?.users ?? []).find((user) => user.uuid === uuid) ?? null;
//   });

//   readonly filteredUsers = computed(() => {
//     const query = this.normalizeSearch(this.userSearch());
//     const users = this.metadata()?.users ?? [];
//     if (!query) return users;

//     return users.filter((user) =>
//       this.normalizeSearch(
//         `${user.display ?? ''} ${user.username ?? ''} ${user.uuid ?? ''} ${user.personUuid ?? ''}`,
//       ).includes(query),
//     );
//   });

//   constructor() {
//     if (this.targets().length === 0) this.refreshTargets();
//   }

//   async refreshTargets() {
//     try {
//       const rows = ((await this.api.targetsList()) ?? []) as LisTargetOption[];
//       const lisTargets = rows.filter((target) => ['LIS', 'OPENMRS'].includes(target.type));
//       this.targets.set(lisTargets);
//       if (!this.selectedTargetId() && lisTargets.length > 0)
//         this.selectedTargetId.set(lisTargets[0].id);
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to load LIS/OpenMRS targets', 'Close', {
//         duration: 3500,
//       });
//     }
//   }

//   onUserSearchInput(value: string) {
//     this.userSearch.set(value ?? '');
//   }

//   clearUserSearch(event?: MouseEvent) {
//     event?.stopPropagation();
//     this.userSearch.set('');
//   }

//   stopUserSearchPanelEvent(event: Event) {
//     event.stopPropagation();
//   }

//   async discover() {
//     const targetId = this.selectedTargetId();
//     if (!targetId) {
//       this.snack.open('Select a LIS/OpenMRS target first.', 'Close', { duration: 2600 });
//       return;
//     }

//     try {
//       this.metadataLoading.set(true);
//       const metadata = (await this.api.mappingsOpenMrsLisDiscover({
//         targetId,
//         sampleId: this.sampleId(),
//         includeConceptDetails: true,
//       })) as OpenMrsLisMetadata;

//       this.metadata.set(metadata);
//       this.parameterDrafts.set(this.toParameterDrafts(metadata));
//       this.userSearch.set('');

//       const firstInstrument = metadata?.instruments?.[0]?.uuid ?? '';
//       if (!this.instrumentUuid() && firstInstrument) this.instrumentUuid.set(firstInstrument);

//       const firstUser = metadata?.users?.[0]?.uuid ?? '';
//       if (!this.testedBy() && firstUser) this.testedBy.set(firstUser);

//       this.snack.open(
//         `Metadata fetched: ${metadata?.parameters?.length ?? 0} parameter(s), ${metadata?.users?.length ?? 0} user(s).`,
//         'Close',
//         { duration: 3200 },
//       );
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to fetch OpenMRS LIS metadata', 'Close', {
//         duration: 5000,
//       });
//     } finally {
//       this.metadataLoading.set(false);
//     }
//   }

//   updateParameter(index: number, patch: Partial<LisParameterDraft>) {
//     this.parameterDrafts.update((drafts) =>
//       drafts.map((draft, currentIndex) =>
//         currentIndex === index ? { ...draft, ...patch } : draft,
//       ),
//     );
//   }

//   updateAnswer(parameterIndex: number, answerIndex: number, patch: Partial<LisAnswerDraft>) {
//     this.parameterDrafts.update((drafts) =>
//       drafts.map((draft, currentIndex) => {
//         if (currentIndex !== parameterIndex) return draft;
//         return {
//           ...draft,
//           answers: draft.answers.map((answer, currentAnswerIndex) =>
//             currentAnswerIndex === answerIndex ? { ...answer, ...patch } : answer,
//           ),
//         };
//       }),
//     );
//   }

//   addAnswer(parameterIndex: number) {
//     this.parameterDrafts.update((drafts) =>
//       drafts.map((draft, currentIndex) => {
//         if (currentIndex !== parameterIndex) return draft;
//         return {
//           ...draft,
//           answers: [
//             ...draft.answers,
//             {
//               sourceValue: '',
//               destinationUuid: draft.answerOptions[0]?.uuid ?? '',
//               display: draft.answerOptions[0]?.display ?? null,
//               shortName: draft.answerOptions[0]?.shortName ?? null,
//               analyzerCodes: draft.answerOptions[0]?.analyzerCodes ?? [],
//               sourceAliases: draft.answerOptions[0]?.sourceValues ?? draft.answerOptions[0]?.analyzerCodes ?? [],
//             },
//           ],
//         };
//       }),
//     );
//   }

//   removeAnswer(parameterIndex: number, answerIndex: number) {
//     this.parameterDrafts.update((drafts) =>
//       drafts.map((draft, currentIndex) => {
//         if (currentIndex !== parameterIndex) return draft;
//         return {
//           ...draft,
//           answers: draft.answers.filter(
//             (_answer, currentAnswerIndex) => currentAnswerIndex !== answerIndex,
//           ),
//         };
//       }),
//     );
//   }

//   async seedMappings() {
//     const selectedParameters = this.parameterDrafts().filter((draft) => draft.selected);
//     if (selectedParameters.length === 0) {
//       this.snack.open('Select at least one LIS parameter mapping to create or update.', 'Close', {
//         duration: 3200,
//       });
//       return;
//     }

//     try {
//       this.seeding.set(true);
//       const response = await this.api.mappingsOpenMrsLisSeed({
//         endpoint: '/openmrs/ws/rest/v1/lab/multipleresults',
//         instrumentUuid: this.instrumentUuid(),
//         testedBy: this.testedBy(),
//         statusCategory: this.statusCategory(),
//         statusStatus: this.statusStatus(),
//         statusRemarks: this.statusRemarks(),
//         parameters: selectedParameters.map((draft) => ({
//           analyzerCode: draft.analyzerCode,
//           analyzerAliases: draft.analyzerAliases,
//           conceptUuid: draft.conceptUuid,
//           allocationUuid: draft.allocationUuid,
//           datatype: draft.datatype,
//           codedAnswers: draft.answers
//             .filter((answer) => answer.sourceValue && answer.destinationUuid)
//             .map((answer) => ({
//               sourceValue: answer.sourceValue,
//               sourceAliases: answer.sourceAliases ?? answer.analyzerCodes ?? [],
//               destinationUuid: answer.destinationUuid,
//               note: this.answerNote(draft, answer),
//             })),
//         })),
//       });

//       this.snack.open(response?.message ?? 'LIS mappings created or updated.', 'Close', {
//         duration: 5000,
//       });
//       this.dialogRef.close(true);
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to create LIS mappings', 'Close', { duration: 5000 });
//     } finally {
//       this.seeding.set(false);
//     }
//   }

//   close() {
//     this.dialogRef.close(false);
//   }

//   answerOptionLabel(draft: LisParameterDraft, uuid: string): string {
//     const option = draft.answerOptions.find((item) => item.uuid === uuid);
//     if (!option) return uuid || 'Select coded answer';
//     const code = option.shortName ? ` · ${option.shortName}` : '';
//     const aliases = option.sourceValues?.length ? ` · aliases: ${option.sourceValues.slice(0, 4).join(', ')}` : '';
//     return `${option.display}${code}${aliases}`;
//   }

//   answerExplanation(draft: LisParameterDraft, answer: LisAnswerDraft): string {
//     const option = draft.answerOptions.find((item) => item.uuid === answer.destinationUuid);
//     const destination = option?.display ?? answer.display ?? 'selected OpenMRS coded answer';
//     const codes = option?.sourceValues?.length
//       ? ` Known value aliases: ${option.sourceValues.join(', ')}.`
//       : option?.analyzerCodes?.length
//         ? ` Known value aliases: ${option.analyzerCodes.join(', ')}.`
//         : '';
//     const analyzerAliases = draft.analyzerAliases.length
//       ? ` Analyzer aliases seeded: ${draft.analyzerAliases.join(', ')}.`
//       : '';
//     return `When ${draft.analyzerCode || 'this analyzer code'} returns ${answer.sourceValue || 'this value'}, the LIS payload will send ${destination}.${codes}${analyzerAliases}`;
//   }

//   private normalizeSearch(value: string): string {
//     return String(value ?? '')
//       .trim()
//       .toLowerCase();
//   }

//   private toParameterDrafts(metadata: OpenMrsLisMetadata | null): LisParameterDraft[] {
//     return (metadata?.parameters ?? []).map((parameter: any) => {
//       const options = (parameter?.answers ?? []).map((answer: any) => ({
//         uuid: String(answer?.uuid ?? '').trim(),
//         display: String(answer?.display ?? answer?.shortName ?? answer?.uuid ?? '').trim(),
//         shortName: answer?.shortName ?? null,
//         analyzerCodes: Array.isArray(answer?.analyzerCodes) ? answer.analyzerCodes : [],
//         sourceValues: Array.isArray(answer?.sourceValues) ? answer.sourceValues : [],
//       })) as LisAnswerOption[];

//       return {
//         selected: true,
//         analyzerCode: String(parameter?.analyzerCode ?? parameter?.display ?? '').trim(),
//         analyzerAliases: this.mergeAliases(parameter?.analyzerAliases, parameter?.analyzerCode, parameter?.display),
//         display: String(parameter?.display ?? parameter?.analyzerCode ?? '').trim(),
//         conceptUuid: String(parameter?.conceptUuid ?? '').trim(),
//         allocationUuid: String(parameter?.allocationUuid ?? '').trim(),
//         datatype: String(parameter?.datatype ?? '').trim(),
//         answerOptions: options,
//         answers: options.map((answer) => ({
//           sourceValue: this.preferredAnalyzerValue(answer),
//           destinationUuid: answer.uuid,
//           display: answer.display,
//           shortName: answer.shortName ?? null,
//           analyzerCodes: answer.analyzerCodes ?? [],
//           sourceAliases: this.mergeAliases(answer.sourceValues, answer.analyzerCodes, answer.shortName, answer.display),
//         })),
//       };
//     });
//   }

//   private preferredAnalyzerValue(answer: LisAnswerOption): string {
//     const shortName = String(answer.shortName ?? '').trim();
//     if (shortName) return shortName.replace(/\.$/, '').toUpperCase();
//     const firstAlias = [...(answer.sourceValues ?? []), ...(answer.analyzerCodes ?? [])].find(
//       (value) => value && value !== 'LIS_CODED_ANSWERS',
//     );
//     if (firstAlias) return String(firstAlias).replace(/\.$/, '').toUpperCase();
//     return String(answer.display ?? '')
//       .replace(/\.$/, '')
//       .toUpperCase();
//   }

//   private mergeAliases(...groups: any[]): string[] {
//     const seen = new Set<string>();
//     const rows: string[] = [];
//     const push = (value: any) => {
//       if (Array.isArray(value)) {
//         value.forEach(push);
//         return;
//       }
//       const text = String(value ?? '').trim();
//       if (!text) return;
//       const key = text.toUpperCase();
//       if (seen.has(key)) return;
//       seen.add(key);
//       rows.push(text);
//     };
//     groups.forEach(push);
//     return rows;
//   }

//   private answerNote(draft: LisParameterDraft, answer: LisAnswerDraft) {
//     const option = draft.answerOptions.find((item) => item.uuid === answer.destinationUuid);
//     const destination = option?.display ?? answer.display ?? answer.destinationUuid;
//     return `Analyzer coded result ${draft.analyzerCode}=${answer.sourceValue} to OpenMRS answer ${destination}`;
//   }
// }


import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlatformApiService } from '../../../core/platform/platform-api.service';

type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

type LisTargetOption = {
  id: string;
  name: string;
  type: MappingTargetType;
  base_url: string;
  enabled: number;
};

type LisUserOption = {
  uuid: string;
  username?: string | null;
  display: string;
  personUuid?: string | null;
};

type LisAnswerOption = {
  uuid: string;
  display: string;
  shortName?: string | null;
  analyzerCodes?: string[];
};

type LisAnswerDraft = {
  sourceValue: string;
  destinationUuid: string;
  display?: string | null;
  shortName?: string | null;
  analyzerCodes?: string[];
};

type LisParameterDraft = {
  selected: boolean;
  analyzerCode: string;
  display: string;
  conceptUuid: string;
  allocationUuid: string;
  datatype: string;
  aliases: string[];
  isCalculated?: boolean;
  answerOptions: LisAnswerOption[];
  answers: LisAnswerDraft[];
};

type OpenMrsLisMetadata = {
  target?: { id: string; name: string; type: string; baseUrl: string };
  sample?: { uuid?: string | null; label?: string | null; found?: boolean };
  parameters?: Array<any>;
  instruments?: Array<{ uuid: string; display: string }>;
  testOrders?: Array<{ uuid: string; display: string }>;
  users?: LisUserOption[];
  settings?: Record<string, string | null>;
  warnings?: string[];
};

type DialogData = {
  targets?: LisTargetOption[];
  selectedTargetId?: string | null;
};

@Component({
  selector: 'app-openmrs-lis-mapping-assistant-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './openmrs-lis-mapping-assistant-dialog.html',
  styleUrl: './openmrs-lis-mapping-assistant-dialog.scss',
})
export class OpenMrsLisMappingAssistantDialog {
  private readonly api = inject(PlatformApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<OpenMrsLisMappingAssistantDialog>);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  readonly targets = signal<LisTargetOption[]>(this.data.targets ?? []);
  readonly selectedTargetId = signal<string>(
    this.data.selectedTargetId ?? this.targets()[0]?.id ?? '',
  );
  readonly sampleId = signal('NPHL/22/0000001');
  readonly metadata = signal<OpenMrsLisMetadata | null>(null);
  readonly parameterDrafts = signal<LisParameterDraft[]>([]);
  readonly metadataLoading = signal(false);
  readonly seeding = signal(false);

  readonly instrumentUuid = signal('');
  readonly testedBy = signal('');
  readonly statusCategory = signal('RESULT_REMARKS');
  readonly statusStatus = signal('REMARKS');
  readonly statusRemarks = signal('Imported from analyzer via machine interfacing');

  readonly selectedTarget = computed(() => {
    const id = this.selectedTargetId();
    return this.targets().find((target) => target.id === id) ?? null;
  });

  readonly selectedParameters = computed(() =>
    this.parameterDrafts().filter((draft) => draft.selected),
  );
  readonly readyParameterCount = computed(
    () =>
      this.selectedParameters().filter(
        (draft) => draft.analyzerCode && draft.conceptUuid && draft.allocationUuid,
      ).length,
  );
  readonly missingRequiredCount = computed(
    () => this.selectedParameters().length - this.readyParameterCount(),
  );
  readonly userSearch = signal('');

  readonly selectedTestedByUser = computed(() => {
    const uuid = this.testedBy();
    return (this.metadata()?.users ?? []).find((user) => user.uuid === uuid) ?? null;
  });

  readonly filteredUsers = computed(() => {
    const query = this.normalizeSearch(this.userSearch());
    const users = this.metadata()?.users ?? [];
    if (!query) return users;

    return users.filter((user) =>
      this.normalizeSearch(
        `${user.display ?? ''} ${user.username ?? ''} ${user.uuid ?? ''} ${user.personUuid ?? ''}`,
      ).includes(query),
    );
  });

  constructor() {
    if (this.targets().length === 0) this.refreshTargets();
  }

  async refreshTargets() {
    try {
      const rows = ((await this.api.targetsList()) ?? []) as LisTargetOption[];
      const lisTargets = rows.filter((target) => ['LIS', 'OPENMRS'].includes(target.type));
      this.targets.set(lisTargets);
      if (!this.selectedTargetId() && lisTargets.length > 0)
        this.selectedTargetId.set(lisTargets[0].id);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load LIS/OpenMRS targets', 'Close', {
        duration: 3500,
      });
    }
  }

  onUserSearchInput(value: string) {
    this.userSearch.set(value ?? '');
  }

  clearUserSearch(event?: MouseEvent) {
    event?.stopPropagation();
    this.userSearch.set('');
  }

  stopUserSearchPanelEvent(event: Event) {
    event.stopPropagation();
  }

  async discover() {
    const targetId = this.selectedTargetId();
    if (!targetId) {
      this.snack.open('Select a LIS/OpenMRS target first.', 'Close', { duration: 2600 });
      return;
    }

    try {
      this.metadataLoading.set(true);
      const metadata = (await this.api.mappingsOpenMrsLisDiscover({
        targetId,
        sampleId: this.sampleId(),
        includeConceptDetails: true,
      })) as OpenMrsLisMetadata;

      this.metadata.set(metadata);
      this.parameterDrafts.set(this.toParameterDrafts(metadata));
      this.userSearch.set('');

      const firstInstrument = metadata?.instruments?.[0]?.uuid ?? '';
      if (!this.instrumentUuid() && firstInstrument) this.instrumentUuid.set(firstInstrument);

      const firstUser = metadata?.users?.[0]?.uuid ?? '';
      if (!this.testedBy() && firstUser) this.testedBy.set(firstUser);

      this.snack.open(
        `Metadata fetched: ${metadata?.parameters?.length ?? 0} parameter(s), ${metadata?.users?.length ?? 0} user(s).`,
        'Close',
        { duration: 3200 },
      );
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to fetch OpenMRS LIS metadata', 'Close', {
        duration: 5000,
      });
    } finally {
      this.metadataLoading.set(false);
    }
  }

  updateParameter(index: number, patch: Partial<LisParameterDraft>) {
    this.parameterDrafts.update((drafts) =>
      drafts.map((draft, currentIndex) =>
        currentIndex === index ? { ...draft, ...patch } : draft,
      ),
    );
  }

  updateAnswer(parameterIndex: number, answerIndex: number, patch: Partial<LisAnswerDraft>) {
    this.parameterDrafts.update((drafts) =>
      drafts.map((draft, currentIndex) => {
        if (currentIndex !== parameterIndex) return draft;
        return {
          ...draft,
          answers: draft.answers.map((answer, currentAnswerIndex) =>
            currentAnswerIndex === answerIndex ? { ...answer, ...patch } : answer,
          ),
        };
      }),
    );
  }

  addAnswer(parameterIndex: number) {
    this.parameterDrafts.update((drafts) =>
      drafts.map((draft, currentIndex) => {
        if (currentIndex !== parameterIndex) return draft;
        return {
          ...draft,
          answers: [
            ...draft.answers,
            {
              sourceValue: '',
              destinationUuid: draft.answerOptions[0]?.uuid ?? '',
              display: draft.answerOptions[0]?.display ?? null,
              shortName: draft.answerOptions[0]?.shortName ?? null,
              analyzerCodes: draft.answerOptions[0]?.analyzerCodes ?? [],
            },
          ],
        };
      }),
    );
  }

  removeAnswer(parameterIndex: number, answerIndex: number) {
    this.parameterDrafts.update((drafts) =>
      drafts.map((draft, currentIndex) => {
        if (currentIndex !== parameterIndex) return draft;
        return {
          ...draft,
          answers: draft.answers.filter(
            (_answer, currentAnswerIndex) => currentAnswerIndex !== answerIndex,
          ),
        };
      }),
    );
  }

  async seedMappings() {
    const selectedParameters = this.parameterDrafts().filter((draft) => draft.selected);
    if (selectedParameters.length === 0) {
      this.snack.open('Select at least one LIS parameter mapping to create or update.', 'Close', {
        duration: 3200,
      });
      return;
    }

    try {
      this.seeding.set(true);
      const response = await this.api.mappingsOpenMrsLisSeed({
        endpoint: '/openmrs/ws/rest/v1/lab/multipleresults',
        instrumentUuid: this.instrumentUuid(),
        testedBy: this.testedBy(),
        statusCategory: this.statusCategory(),
        statusStatus: this.statusStatus(),
        statusRemarks: this.statusRemarks(),
        parameters: selectedParameters.map((draft) => ({
          analyzerCode: draft.analyzerCode,
          conceptUuid: draft.conceptUuid,
          allocationUuid: draft.allocationUuid,
          datatype: draft.datatype,
          codedAnswers: draft.answers
            .filter((answer) => answer.sourceValue && answer.destinationUuid)
            .map((answer) => ({
              sourceValue: answer.sourceValue,
              destinationUuid: answer.destinationUuid,
              note: this.answerNote(draft, answer),
            })),
        })),
      });

      this.snack.open(response?.message ?? 'LIS mappings created or updated.', 'Close', {
        duration: 5000,
      });
      this.dialogRef.close(true);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to create LIS mappings', 'Close', { duration: 5000 });
    } finally {
      this.seeding.set(false);
    }
  }

  close() {
    this.dialogRef.close(false);
  }

  answerOptionLabel(draft: LisParameterDraft, uuid: string): string {
    const option = draft.answerOptions.find((item) => item.uuid === uuid);
    if (!option) return uuid || 'Select coded answer';
    const code = option.shortName ? ` · ${option.shortName}` : '';
    return `${option.display}${code}`;
  }

  answerExplanation(draft: LisParameterDraft, answer: LisAnswerDraft): string {
    const option = draft.answerOptions.find((item) => item.uuid === answer.destinationUuid);
    const destination = option?.display ?? answer.display ?? 'selected OpenMRS coded answer';
    const codes = option?.analyzerCodes?.length
      ? ` Known aliases: ${option.analyzerCodes.join(', ')}.`
      : '';
    return `When ${draft.analyzerCode || 'this analyzer code'} returns ${answer.sourceValue || 'this value'}, the LIS payload will send ${destination}.${codes}`;
  }

  private normalizeSearch(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  private toParameterDrafts(metadata: OpenMrsLisMetadata | null): LisParameterDraft[] {
    return (metadata?.parameters ?? []).map((parameter: any) => {
      const options = (parameter?.answers ?? []).map((answer: any) => ({
        uuid: String(answer?.uuid ?? '').trim(),
        display: String(answer?.display ?? answer?.shortName ?? answer?.uuid ?? '').trim(),
        shortName: answer?.shortName ?? null,
        analyzerCodes: Array.isArray(answer?.analyzerCodes) ? answer.analyzerCodes : [],
        aliases: Array.isArray(answer?.aliases) ? answer.aliases : [],
      })) as LisAnswerOption[];

      return {
        selected: true,
        analyzerCode: String(parameter?.analyzerCode ?? parameter?.display ?? '').trim(),
        display: String(parameter?.display ?? parameter?.analyzerCode ?? '').trim(),
        conceptUuid: String(parameter?.conceptUuid ?? '').trim(),
        allocationUuid: String(parameter?.allocationUuid ?? '').trim(),
        datatype: String(parameter?.datatype ?? '').trim(),
        aliases: Array.isArray(parameter?.aliases) ? parameter.aliases : [],
        isCalculated: !!parameter?.isCalculated,
        answerOptions: options,
        answers: options.map((answer) => ({
          sourceValue: this.preferredAnalyzerValue(answer),
          destinationUuid: answer.uuid,
          display: answer.display,
          shortName: answer.shortName ?? null,
          analyzerCodes: answer.analyzerCodes ?? [],
        })),
      };
    });
  }

  private preferredAnalyzerValue(answer: LisAnswerOption): string {
    const shortName = String(answer.shortName ?? '').trim();
    if (shortName) return shortName.replace(/\.$/, '').toUpperCase();
    const firstAlias = (answer.analyzerCodes ?? []).find(
      (value) => value && value !== 'LIS_CODED_ANSWERS',
    );
    if (firstAlias) return String(firstAlias).replace(/\.$/, '').toUpperCase();
    return String(answer.display ?? '')
      .replace(/\.$/, '')
      .toUpperCase();
  }

  private answerNote(draft: LisParameterDraft, answer: LisAnswerDraft) {
    const option = draft.answerOptions.find((item) => item.uuid === answer.destinationUuid);
    const destination = option?.display ?? answer.display ?? answer.destinationUuid;
    return `Analyzer coded result ${draft.analyzerCode}=${answer.sourceValue} to OpenMRS answer ${destination}`;
  }
}
