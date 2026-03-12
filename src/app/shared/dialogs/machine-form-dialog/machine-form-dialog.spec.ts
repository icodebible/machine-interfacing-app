import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineFormDialog } from './machine-form-dialog';

describe('MachineFormDialog', () => {
  let component: MachineFormDialog;
  let fixture: ComponentFixture<MachineFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineFormDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
