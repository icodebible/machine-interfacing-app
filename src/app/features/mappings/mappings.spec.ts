import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mappings } from './mappings';

describe('Mappings', () => {
  let component: Mappings;
  let fixture: ComponentFixture<Mappings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mappings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mappings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
