import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PanelEmpleados } from './panel-empleados';

describe('PanelEmpleados', () => {
  let component: PanelEmpleados;
  let fixture: ComponentFixture<PanelEmpleados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelEmpleados],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelEmpleados);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
