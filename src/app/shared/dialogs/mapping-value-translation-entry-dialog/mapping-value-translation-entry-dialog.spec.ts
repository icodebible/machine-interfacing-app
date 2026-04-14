import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MappingValueTranslationEntryDialog } from './mapping-value-translation-entry-dialog';

describe('MappingValueTranslationEntryDialog', () => {
  let component: MappingValueTranslationEntryDialog;
  let fixture: ComponentFixture<MappingValueTranslationEntryDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MappingValueTranslationEntryDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MappingValueTranslationEntryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
