import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizedResultDetailDialog } from './normalized-result-detail-dialog';

describe('NormalizedResultDetailDialog', () => {
  let component: NormalizedResultDetailDialog;
  let fixture: ComponentFixture<NormalizedResultDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NormalizedResultDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NormalizedResultDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
