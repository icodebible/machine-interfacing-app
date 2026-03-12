import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabFormDialog } from './lab-form-dialog';

describe('LabFormDialog', () => {
  let component: LabFormDialog;
  let fixture: ComponentFixture<LabFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
