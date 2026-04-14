import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineParsedDialog } from './machine-parsed-dialog';

describe('MachineParsedDialog', () => {
  let component: MachineParsedDialog;
  let fixture: ComponentFixture<MachineParsedDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MachineParsedDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineParsedDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
