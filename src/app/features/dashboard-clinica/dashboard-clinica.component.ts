import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-clinica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-clinica.component.html',
  styleUrls: ['./dashboard-clinica.component.scss']
})
export class DashboardClinicaComponent implements OnInit {
  activeTab: string = 'consulta';

  doctorActual = { nombre: 'Dr. Roberto Sánchez', especialidad: 'Odontólogo Titular', cedula: 'CED. PROF: 5164506' };
  fechaHoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

  vistaAgenda: 'lista' | 'calendario' = 'calendario';
  mesDesplegado = new Date(2026, 10, 1);
  mesActualTitulo: string = '';
  nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  diasCalendario: any[] = [];

  pacienteSeleccionado: any = null;
  mostrarModalCita: boolean = false;
  mostrarModalPaciente: boolean = false;
  fechaParaNuevaCita: string = '';

  // Variable para el flujo de la receta médica
  pacienteEnConsulta: any = null;

  // --- BASES DE DATOS SIMULADAS ---
  todasLasCitas = [
    { fecha: '2026-11-12', hora: '09:00 AM', paciente: 'Juan Pérez', telefono: '644 123 4567', motivo: 'Limpieza dental', estado: 'Confirmada', color: '#2563eb', historial: ['12 Oct 2026: Limpieza general'] },
    { fecha: '2026-11-12', hora: '10:30 AM', paciente: 'María Gómez', telefono: '644 987 6543', motivo: 'Extracción', estado: 'En sala', color: '#059669', historial: ['Primer ingreso'] },
    { fecha: '2026-11-16', hora: '12:00 PM', paciente: 'Carlos Ruiz', telefono: '644 555 1234', motivo: 'Revisión', estado: 'Pendiente', color: '#d97706', historial: [] }
  ];

  directorioPacientes = [
    { nombre: 'Juan Pérez', telefono: '644 123 4567', edad: 34, sexo: 'MASCULINO', sangre: 'O+', alergias: 'Ninguna', ultimaVisita: '12 Oct 2026', notas: ['12 Oct 2026: Limpieza general.'], recetas: ['Ibuprofeno 400mg'] },
    { nombre: 'María Gómez', telefono: '644 987 6543', edad: 28, sexo: 'FEMENINO', sangre: 'A-', alergias: 'Penicilina', ultimaVisita: 'Primer ingreso', notas: [], recetas: [] },
    { nombre: 'Carlos Ruiz', telefono: '644 555 1234', edad: 45, sexo: 'MASCULINO', sangre: 'B+', alergias: 'Ibuprofeno', ultimaVisita: '10 Ene 2025', notas: ['Extracción de tercer molar.'], recetas: ['Ketorolaco 10mg'] }
  ];

  consultasRealizadas = [
    { fecha: '11 Nov 2026', hora: '04:30 PM', paciente: 'Luis Mendoza', diagnostico: 'Caries en molar 3', receta: 'Amoxicilina 500mg', doctor: 'Dr. Roberto Sánchez' },
    { fecha: '10 Nov 2026', hora: '10:00 AM', paciente: 'Carlos Ruiz', diagnostico: 'Revisión post-operatoria', receta: 'Continuar Ketorolaco', doctor: 'Dr. Roberto Sánchez' }
  ];

  inventario = [
    { nombre: 'Guantes de Látex', cantidad: 50, unidad: 'Cajas', estado: 'Óptimo' },
    { nombre: 'Anestesia Local', cantidad: 3, unidad: 'Cajas', estado: 'Crítico' },
    { nombre: 'Jeringas 5ml', cantidad: 120, unidad: 'Piezas', estado: 'Óptimo' },
    { nombre: 'Gasa Estéril', cantidad: 2, unidad: 'Paquetes', estado: 'Crítico' }
  ];

  empleados = [
    { nombre: 'Dr. Roberto Sánchez', rol: 'Odontólogo Titular' },
    { nombre: 'Ana López', rol: 'Recepcionista' },
    { nombre: 'Carlos Vega', rol: 'Asistente Médico' }
  ];

  ngOnInit() { this.generarCalendario(); }

  cambiarPestana(pestana: string) {
    this.activeTab = pestana;
    this.pacienteSeleccionado = null;
    this.pacienteEnConsulta = null;
  }

  // --- LÓGICA DE LA RECETA / CONSULTA DIRECTA ---
  iniciarConsulta(paciente: any) {
    this.pacienteEnConsulta = { ...paciente };
  }

  iniciarConsultaEnBlanco() {
    this.pacienteEnConsulta = {
      nombre: '', edad: '', sexo: '', telefono: '', alergias: '', historial: [], recetas: [], notas: [], esNuevo: true
    };
  }

  terminarConsulta() {
    this.pacienteEnConsulta = null;
  }

  guardarConsulta() {
    // Aquí iría la lógica para guardar en la BD
    alert('Consulta guardada exitosamente en el historial del paciente.');
    this.terminarConsulta(); // Regresa a la sala
  }

  imprimirReceta() {
    window.print();
  }

  // --- LÓGICA DEL CALENDARIO ---
  generarCalendario() {
    const year = this.mesDesplegado.getFullYear();
    const month = this.mesDesplegado.getMonth();
    this.mesActualTitulo = `${this.nombresMeses[month]} ${year}`;
    this.diasCalendario = [];
    const primerDia = new Date(year, month, 1).getDay();
    const diasEnMes = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < primerDia; i++) {
      this.diasCalendario.push({ numero: '', inactivo: true, citas: [], fechaCompleta: '' });
    }

    for (let i = 1; i <= diasEnMes; i++) {
      const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const citasDelDia = this.todasLasCitas.filter(c => c.fecha === fechaStr);
      this.diasCalendario.push({ numero: i, inactivo: false, citas: citasDelDia, fechaCompleta: fechaStr });
    }
  }

  mesAnterior() { this.mesDesplegado.setMonth(this.mesDesplegado.getMonth() - 1); this.generarCalendario(); }
  mesSiguiente() { this.mesDesplegado.setMonth(this.mesDesplegado.getMonth() + 1); this.generarCalendario(); }

  // --- LÓGICA DE INVENTARIO Y MODALES ---
  ordenarInventario(event: any) {
    const criterio = event.target.value;
    if (criterio === 'menor') this.inventario.sort((a, b) => a.cantidad - b.cantidad);
    else if (criterio === 'mayor') this.inventario.sort((a, b) => b.cantidad - a.cantidad);
    else if (criterio === 'critico') this.inventario.sort((a, b) => (a.estado === 'Crítico' ? -1 : 1));
  }

  abrirModalNuevaCita(dia: any) { if (!dia.inactivo) { this.fechaParaNuevaCita = dia.fechaCompleta; this.mostrarModalCita = true; } }
  cerrarModalCita() { this.mostrarModalCita = false; }

  abrirModalNuevoPaciente() { this.mostrarModalPaciente = true; }
  cerrarModalPaciente() { this.mostrarModalPaciente = false; }

  verExpediente(cita: any, event?: Event) { if (event) event.stopPropagation(); this.pacienteSeleccionado = cita; }
  cerrarExpediente() { this.pacienteSeleccionado = null; }
  verDetallePaciente(paciente: any) { this.pacienteSeleccionado = paciente; }
}