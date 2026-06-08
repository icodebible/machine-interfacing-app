import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LisTestOrderProfileDialog } from './lis-test-order-profile-dialog';

describe('LisTestOrderProfileDialog', () => {
  let component: LisTestOrderProfileDialog;
  let fixture: ComponentFixture<LisTestOrderProfileDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LisTestOrderProfileDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LisTestOrderProfileDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
