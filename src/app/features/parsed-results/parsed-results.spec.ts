import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParsedResults } from './parsed-results';

describe('ParsedResults', () => {
  let component: ParsedResults;
  let fixture: ComponentFixture<ParsedResults>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParsedResults]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParsedResults);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
