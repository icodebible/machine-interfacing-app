import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvironmentWatermark } from './environment-watermark';

describe('EnvironmentWatermark', () => {
  let component: EnvironmentWatermark;
  let fixture: ComponentFixture<EnvironmentWatermark>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnvironmentWatermark]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnvironmentWatermark);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
