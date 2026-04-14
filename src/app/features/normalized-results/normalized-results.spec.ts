import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NormalizedResults } from './normalized-results';

describe('NormalizedResults', () => {
  let component: NormalizedResults;
  let fixture: ComponentFixture<NormalizedResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NormalizedResults]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NormalizedResults);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
