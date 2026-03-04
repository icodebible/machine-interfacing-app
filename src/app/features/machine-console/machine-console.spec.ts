import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineConsole } from './machine-console';

describe('MachineConsole', () => {
  let component: MachineConsole;
  let fixture: ComponentFixture<MachineConsole>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineConsole]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineConsole);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
