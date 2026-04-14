import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineLogsDialog } from './machine-logs-dialog';

describe('MachineLogsDialog', () => {
  let component: MachineLogsDialog;
  let fixture: ComponentFixture<MachineLogsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineLogsDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineLogsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
