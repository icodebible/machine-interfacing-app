import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MappingValueTranslationsDialog } from './mapping-value-translations-dialog';

describe('MappingValueTranslationsDialog', () => {
  let component: MappingValueTranslationsDialog;
  let fixture: ComponentFixture<MappingValueTranslationsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MappingValueTranslationsDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MappingValueTranslationsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
