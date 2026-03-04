import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutesTargets } from './routes-targets';

describe('RoutesTargets', () => {
  let component: RoutesTargets;
  let fixture: ComponentFixture<RoutesTargets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutesTargets]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutesTargets);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
