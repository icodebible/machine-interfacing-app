import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineNormalizedDialog } from './machine-normalized-dialog';

describe('MachineNormalizedDialog', () => {
  let component: MachineNormalizedDialog;
  let fixture: ComponentFixture<MachineNormalizedDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineNormalizedDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineNormalizedDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
