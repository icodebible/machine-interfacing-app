import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LisTestOrderProfiles } from './lis-test-order-profiles';

describe('LisTestOrderProfiles', () => {
  let component: LisTestOrderProfiles;
  let fixture: ComponentFixture<LisTestOrderProfiles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LisTestOrderProfiles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LisTestOrderProfiles);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
