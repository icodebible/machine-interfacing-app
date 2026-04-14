import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineSimulationDialog } from './machine-simulation-dialog';

describe('MachineSimulationDialog', () => {
  let component: MachineSimulationDialog;
  let fixture: ComponentFixture<MachineSimulationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineSimulationDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineSimulationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
