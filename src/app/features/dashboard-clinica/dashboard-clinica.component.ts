import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SyncService } from '../../core/services/sync.service';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-dashboard-clinica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-clinica.component.html',
  styleUrls: ['./dashboard-clinica.component.scss']
})
export class DashboardClinicaComponent implements OnInit {
  
  configClinica = { id: 1, nombre: 'Clínica San José', logo: '🏥', direccion: 'Av. Miguel Alemán 153 Sur', telefono: '644 415 3044' };
  
  mostrarModalConfig: boolean = false;
  activeTab: string = 'resumen';
  doctorActual = { nombre: 'Dr. Roberto Sánchez', especialidad: 'Odontólogo Titular', cedula: 'CED. PROF: 5164506' };
  
  fechaHoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  fechaHoyISO = new Date().toISOString().substring(0, 10);

  vistaAgenda: 'lista' | 'calendario' = 'calendario';
  mesDesplegado = new Date(); 
  mesActualTitulo: string = '';
  diasCalendario: any[] = [];
  nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  fechaFiltroAgenda: string = this.fechaHoyISO;
  citasFiltradasAgenda: any[] = [];
  fechaFiltroHistorial: string = '';
  
  pacienteSeleccionado: any = null;
  mostrarModalCita: boolean = false;
  mostrarModalPaciente: boolean = false;
  mostrarModalInventario: boolean = false;
  mostrarModalDetalleConsulta: boolean = false;
  consultaSeleccionada: any = null;
  
  pacienteEnConsulta: any = null;
  pacienteEditando: any = { nombreCompleto: '', telefono: '', edad: null, sexo: '', alergias: '', fechaNacimiento: '' }; 

  // --- VARIABLES INVENTARIO ---
  productoEditando: any = { nombreProducto: '', cantidad: null };
  terminoBusquedaInventario: string = '';
  inventarioFiltrado: any[] = [];

  todasLasCitas: any[] = [];
  citasDeHoy: any[] = [];
  directorioPacientes: any[] = [];
  consultasRealizadas: any[] = [];
  consultasFiltradas: any[] = [];
  inventario: any[] = [];
  
  consultasDeHoy: number = 0;
  inventarioCritico: number = 0;

  apiCitas = 'http://localhost:5174/api/citas';
  apiPacientes = 'http://localhost:5174/api/pacientes';
  apiConsultas = 'http://localhost:5174/api/consultas';
  apiInventario = 'http://localhost:5174/api/inventario';
  apiClinicas = 'http://localhost:5174/api/clinicas';
  clinicaId = 1; 

  isOffline: boolean = !navigator.onLine;

  constructor(private http: HttpClient, private syncService: SyncService) { }

  ngOnInit() {
    window.addEventListener('offline', () => this.isOffline = true);
    window.addEventListener('online', () => { this.isOffline = false; this.cargarDatosReales(); });
    this.cargarDatosReales();
  }

  // --- CARGA DE DATOS ---
  cargarDatosReales() {
    this.http.get<any>(`${this.apiClinicas}/${this.clinicaId}`).subscribe(res => {
      if(res) {
        this.configClinica.nombre = res.nombre || 'Clínica San José';
        this.configClinica.logo = res.logo || '🏥';
        this.configClinica.direccion = res.direccion || 'Av. Miguel Alemán 153 Sur';
        this.configClinica.telefono = res.telefono || '644 415 3044';
      }
    });

    this.http.get<any[]>(`${this.apiPacientes}/clinica/${this.clinicaId}`).subscribe(res => {
      this.directorioPacientes = res.map(p => ({
        ...p, 
        id: p.id || p.Id,
        nombreCompleto: p.nombreCompleto || p.nombrecompleto || 'Sin Nombre',
        telefono: p.telefono || 'Sin registro', 
        alergias: p.alergias || 'Ninguna', 
        sexo: p.sexo || p.estadoCivil || p.estadocivil || 'No especificado',
        fechaNacimiento: p.fechaNacimiento || p.fechanacimiento ? String(p.fechaNacimiento || p.fechanacimiento).substring(0, 10) : ''
      }));
      this.cargarCitas();
      this.cargarHistorialConsultas();
    });

    this.http.get<any[]>(`${this.apiInventario}/clinica/${this.clinicaId}`).subscribe(res => {
      this.inventario = res.map(i => ({ 
        ...i, 
        id: i.id || i.Id,
        nombreProducto: i.nombreProducto || i.nombreproducto || 'Insumo',
        estado: i.cantidad < 10 ? 'Crítico' : 'Óptimo'
      }));
      this.inventarioCritico = this.inventario.filter(i => i.cantidad < 10).length;
      this.aplicarFiltrosInventario();
    });
  }

  cargarCitas() {
    this.http.get<any[]>(`${this.apiCitas}/clinica/${this.clinicaId}`).subscribe(res => {
      this.todasLasCitas = res.map(cita => {
        const idBuscado = Number(cita.pacienteId || cita.pacienteid);
        const pac = this.directorioPacientes.find(p => Number(p.id) === idBuscado);
        return { 
          ...cita, 
          fechaHoraSegura: cita.fechaHora || cita.fechahora, 
          pacienteNombre: pac ? pac.nombreCompleto : 'Desconocido', 
          telefono: pac ? pac.telefono : 'N/A' 
        };
      });
      this.citasDeHoy = this.todasLasCitas.filter(c => String(c.fechaHoraSegura).substring(0,10) === this.fechaHoyISO);
      this.filtrarAgendaPorDia(this.fechaFiltroAgenda);
      this.generarCalendario();
    });
  }

  cargarHistorialConsultas() {
    this.http.get<any[]>(this.apiConsultas).subscribe(res => {
      const consultasClinica = res.filter(c => c.clinicaId === this.clinicaId || c.clinicaid === this.clinicaId);
      this.consultasRealizadas = consultasClinica.map(con => {
        const idBuscado = Number(con.pacienteId || con.pacienteid);
        const pac = this.directorioPacientes.find(p => Number(p.id) === idBuscado);
        return { ...con, pacienteNombre: pac ? pac.nombreCompleto : 'Desconocido', fechaConsultaSegura: con.fechaConsulta || con.fechaconsulta || new Date().toISOString() };
      });
      this.consultasRealizadas.sort((a, b) => new Date(b.fechaConsultaSegura).getTime() - new Date(a.fechaConsultaSegura).getTime());
      this.consultasDeHoy = this.consultasRealizadas.filter(c => String(c.fechaConsultaSegura).substring(0,10) === this.fechaHoyISO).length;
      this.filtrarHistorial(''); 
    });
  }

  cambiarPestana(pestana: string) {
    this.activeTab = pestana; 
    this.pacienteSeleccionado = null; 
    this.pacienteEnConsulta = null;
    this.cargarDatosReales();
  }

  guardarConfiguracionClinica(nombre: string, logo: string, dir: string, tel: string) {
    const data = { id: this.clinicaId, nombre: nombre, logo: logo, direccion: dir, telefono: tel };
    this.http.put(`${this.apiClinicas}/${this.clinicaId}`, data).subscribe(() => {
      this.mostrarModalConfig = false;
      Swal.fire({ title: 'Actualizado', text: 'Datos guardados', icon: 'success', timer: 1500, showConfirmButton: false });
      this.cargarDatosReales();
    });
  }

  filtrarAgendaPorDia(fecha: string) {
    this.fechaFiltroAgenda = fecha;
    this.citasFiltradasAgenda = this.todasLasCitas.filter(c => String(c.fechaHoraSegura).substring(0,10) === fecha);
  }

  filtrarHistorial(fechaBuscada: string) {
    this.fechaFiltroHistorial = fechaBuscada;
    this.consultasFiltradas = !fechaBuscada ? [...this.consultasRealizadas] : this.consultasRealizadas.filter(c => String(c.fechaConsultaSegura).substring(0, 10) === fechaBuscada);
  }
  
  abrirDetalleConsulta(consulta: any) {
    this.consultaSeleccionada = consulta;
    this.mostrarModalDetalleConsulta = true;
  }

  // --- CRUD PACIENTES (ARREGLADO PARA ENVIAR NOMBRES EXACTOS DE C#) ---
  abrirModalNuevoPaciente() { this.pacienteEditando = { nombreCompleto: '', telefono: '', edad: null, sexo: '', alergias: '', fechaNacimiento: '' }; this.mostrarModalPaciente = true; }
  abrirModalEditarPaciente(paciente: any) { this.pacienteEditando = { ...paciente }; this.mostrarModalPaciente = true; }

  guardarPacienteManual() {
    if (!this.pacienteEditando.nombreCompleto) { Swal.fire('Falta Nombre', 'El nombre es obligatorio', 'warning'); return; }
    
    const telRegex = /^\d{10}$/;
    if (!this.pacienteEditando.telefono || !telRegex.test(this.pacienteEditando.telefono)) {
      Swal.fire('Teléfono Inválido', 'El teléfono debe tener exactamente 10 dígitos numéricos.', 'warning'); return;
    }

    const fechaNac = this.pacienteEditando.fechaNacimiento ? new Date(this.pacienteEditando.fechaNacimiento).toISOString() : null;

    // AHORA SÍ MANDAMOS 'sexo' y 'fechaNacimiento' COMO C# ESPERA
    const payload = { 
      clinicaId: this.clinicaId, 
      nombreCompleto: this.pacienteEditando.nombreCompleto, 
      telefono: this.pacienteEditando.telefono, 
      edad: Number(this.pacienteEditando.edad) || 0, 
      sexo: this.pacienteEditando.sexo || 'No especificado', 
      alergias: this.pacienteEditando.alergias || 'Ninguna',
      fechaNacimiento: fechaNac
    };
    
    if (this.pacienteEditando.id) {
      this.http.put(`${this.apiPacientes}/${this.pacienteEditando.id}`, { ...payload, id: this.pacienteEditando.id }).subscribe(() => {
        this.mostrarModalPaciente = false; Swal.fire({ title: 'Actualizado', icon: 'success', timer: 1500, showConfirmButton: false });
        this.cargarDatosReales();
      });
    } else {
      this.http.post(this.apiPacientes, payload).subscribe(() => {
        this.mostrarModalPaciente = false; Swal.fire({ title: 'Agregado', icon: 'success', timer: 1500, showConfirmButton: false });
        this.cargarDatosReales();
      });
    }
  }

  // ELIMINACIÓN INSTANTÁNEA (OPTIMISTIC UI)
  borrarPaciente(id: number) {
    Swal.fire({ title: '¿Borrar paciente?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, borrar' }).then((r) => {
      if (r.isConfirmed) {
        // 1. Lo quitamos de la pantalla a la velocidad de la luz
        this.directorioPacientes = this.directorioPacientes.filter(p => p.id !== id);
        Swal.fire({ title: 'Borrado', icon: 'success', timer: 1000, showConfirmButton: false });
        
        // 2. Le avisamos a C# por debajo del agua
        this.http.delete(`${this.apiPacientes}/${id}`).subscribe(() => {
          this.cargarHistorialConsultas(); // Refrescamos historial en silencio
        });
      }
    });
  }

  // --- CRUD INVENTARIO FULL ---
  abrirModalNuevoProducto() { this.productoEditando = { nombreProducto: '', cantidad: null }; this.mostrarModalInventario = true; }
  abrirModalEditarProducto(item: any) { this.productoEditando = { ...item }; this.mostrarModalInventario = true; }

  guardarProductoManual() {
    if(!this.productoEditando.nombreProducto) { Swal.fire('Error', 'Ponle nombre al producto', 'error'); return; }
    
    const prod = { 
      clinicaId: this.clinicaId, 
      nombreProducto: this.productoEditando.nombreProducto, 
      cantidad: Number(this.productoEditando.cantidad) || 0, 
      unidad: 'Piezas', 
      estado: Number(this.productoEditando.cantidad) < 10 ? 'Crítico' : 'Óptimo' 
    };

    if (this.productoEditando.id) {
      // MODO EDICIÓN
      this.http.put(`${this.apiInventario}/${this.productoEditando.id}`, { ...prod, id: this.productoEditando.id }).subscribe({
        next: () => {
          this.mostrarModalInventario = false; 
          Swal.fire({ title: '¡Actualizado!', icon: 'success', timer: 1000, showConfirmButton: false });
          this.cargarDatosReales();
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error del Servidor', 'C# rechazó la actualización. Abre F12 para ver el detalle.', 'error');
        }
      });
    } else {
      // MODO NUEVO PRODUCTO
      this.http.post(this.apiInventario, prod).subscribe({
        next: () => {
          this.mostrarModalInventario = false; 
          Swal.fire({ title: '¡Guardado!', icon: 'success', timer: 1000, showConfirmButton: false });
          this.cargarDatosReales();
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error del Servidor', 'C# rechazó el producto nuevo. Verifica la base de datos.', 'error');
        }
      });
    }
  }

  // ELIMINACIÓN INSTANTÁNEA INVENTARIO
  borrarProducto(id: number) {
    Swal.fire({ title: '¿Borrar producto?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Borrar' }).then((r) => {
      if (r.isConfirmed) {
        this.inventario = this.inventario.filter(i => i.id !== id);
        this.aplicarFiltrosInventario();
        Swal.fire({ title: 'Borrado', icon: 'success', timer: 1000, showConfirmButton: false });
        
        this.http.delete(`${this.apiInventario}/${id}`).subscribe(); // Borrado en 2do plano
      }
    });
  }

  buscarInventario(event: any) {
    this.terminoBusquedaInventario = event.target.value.toLowerCase();
    this.aplicarFiltrosInventario();
  }

  ordenarInventario(event: any) {
    const criterio = event.target.value;
    if (criterio === 'mayor') this.inventarioFiltrado.sort((a, b) => b.cantidad - a.cantidad);
    else if (criterio === 'menor') this.inventarioFiltrado.sort((a, b) => a.cantidad - b.cantidad);
    else if (criterio === 'critico') this.inventarioFiltrado.sort((a, b) => (a.estado === 'Crítico' ? -1 : 1));
    else this.aplicarFiltrosInventario(); // Defecto
  }

  aplicarFiltrosInventario() {
    this.inventarioFiltrado = this.inventario.filter(i => 
      i.nombreProducto.toLowerCase().includes(this.terminoBusquedaInventario)
    );
  }

  // --- CONSULTA Y VALIDACIONES ESTRICTAS ---
  iniciarConsultaDesdeCita(cita: any) {
    const idBuscado = Number(cita.pacienteId || cita.pacienteid);
    const pacInfo = this.directorioPacientes.find(p => Number(p.id) === idBuscado);
    this.pacienteEnConsulta = pacInfo ? { ...pacInfo, esNuevo: false } : { nombreCompleto: cita.pacienteNombre, telefono: cita.telefono, esNuevo: true };
  }
  
  iniciarConsultaEnBlanco() { this.pacienteEnConsulta = { nombreCompleto: '', edad: null, telefono: '', sexo: '', alergias: 'Ninguna', fechaNacimiento: '', esNuevo: true }; }
  terminarConsulta() { this.pacienteEnConsulta = null; }

  guardarConsulta(diagnostico: string, receta: string, fechaProximaCita: string) {
    
    if (!this.pacienteEnConsulta.nombreCompleto) { Swal.fire('Falta Nombre', 'El nombre del paciente es obligatorio.', 'warning'); return; }
    if (!this.pacienteEnConsulta.edad) { Swal.fire('Falta Edad', 'La edad es obligatoria.', 'warning'); return; }
    if (!this.pacienteEnConsulta.sexo) { Swal.fire('Falta Sexo', 'El sexo es obligatorio.', 'warning'); return; }
    
    const telRegex = /^\d{10}$/;
    if (!this.pacienteEnConsulta.telefono || !telRegex.test(this.pacienteEnConsulta.telefono)) {
       Swal.fire('Teléfono Inválido', 'El teléfono debe ser de exactamente 10 dígitos.', 'warning'); return;
    }

    const fechaNac = this.pacienteEnConsulta.fechaNacimiento ? new Date(this.pacienteEnConsulta.fechaNacimiento).toISOString() : null;

    const datosPac = {
      clinicaId: this.clinicaId,
      nombreCompleto: this.pacienteEnConsulta.nombreCompleto, 
      telefono: this.pacienteEnConsulta.telefono,
      edad: Number(this.pacienteEnConsulta.edad), 
      sexo: this.pacienteEnConsulta.sexo, 
      alergias: this.pacienteEnConsulta.alergias || 'Ninguna',
      fechaNacimiento: fechaNac
    };

    if (!this.pacienteEnConsulta.id || this.pacienteEnConsulta.esNuevo) {
      this.http.post<any>(this.apiPacientes, datosPac).subscribe({
        next: (res) => {
          const idReal = res.id || res.Id;
          this.guardarCitaEHistorial(idReal, diagnostico, receta, fechaProximaCita);
        },
        error: () => Swal.fire('Error', 'El servidor no pudo crear al paciente.', 'error')
      });
    } else {
      this.guardarCitaEHistorial(this.pacienteEnConsulta.id, diagnostico, receta, fechaProximaCita);
    }
  }

  guardarCitaEHistorial(idRealPaciente: number, diagnostico: string, receta: string, fechaProximaCita: string) {
    const nuevaConsulta = { clinicaId: this.clinicaId, pacienteId: idRealPaciente, diagnostico: diagnostico, recetaMedica: receta, doctorId: 1, fechaConsulta: new Date().toISOString() };
    
    this.http.post(this.apiConsultas, nuevaConsulta).subscribe({
      next: () => {
        if (fechaProximaCita) {
          const nuevaCita = { clinicaId: this.clinicaId, pacienteId: idRealPaciente, folio: 'CIT-' + Math.floor(Math.random() * 10000), fechaHora: fechaProximaCita + 'T09:00:00Z', estado: 'Pendiente', motivo: 'Cita de seguimiento' };
          this.http.post(this.apiCitas, nuevaCita).subscribe(() => {
            Swal.fire({ title: '¡Completado!', text: 'Consulta y Cita guardadas.', icon: 'success', timer: 2000, showConfirmButton: false });
            this.finalizarYRecargarTodo();
          });
        } else {
          Swal.fire({ title: '¡Excelente!', text: 'Consulta guardada.', icon: 'success', timer: 2000, showConfirmButton: false });
          this.finalizarYRecargarTodo();
        }
      }
    });
  }

  finalizarYRecargarTodo() {
    this.terminarConsulta();
    setTimeout(() => this.cargarDatosReales(), 500);
  }

  // --- AGENDA NORMAL ---
  guardarNuevaCita(nombrePaciente: string, motivoCita: string, fechaCita: string) {
    if (!nombrePaciente || !fechaCita) { Swal.fire('Error', 'Escribe el nombre y selecciona fecha', 'warning'); return; }
    
    let pacRegistrado = this.directorioPacientes.find(p => p.nombreCompleto.toLowerCase() === nombrePaciente.toLowerCase());
    
    if(!pacRegistrado) {
      const nuevoPac = { clinicaId: this.clinicaId, nombreCompleto: nombrePaciente, telefono: '0000000000', edad: 0, sexo: 'No especificado', alergias: 'Ninguna' };
      this.http.post<any>(this.apiPacientes, nuevoPac).subscribe(pCreado => {
        const idReal = pCreado.id || pCreado.Id;
        this.procesarCitaFinal(idReal, motivoCita, fechaCita);
      });
    } else {
      this.procesarCitaFinal(pacRegistrado.id, motivoCita, fechaCita);
    }
  }

  procesarCitaFinal(idPaciente: number, motivoCita: string, fechaCita: string) {
    const nuevaCita = { clinicaId: this.clinicaId, pacienteId: idPaciente, folio: 'CIT-' + Math.floor(Math.random() * 10000), fechaHora: fechaCita + 'T09:00:00Z', estado: 'Pendiente', motivo: motivoCita || 'Revisión' };
    this.http.post(this.apiCitas, nuevaCita).subscribe(() => {
      this.mostrarModalCita = false;
      Swal.fire({ title: 'Agendada', icon: 'success', timer: 1500, showConfirmButton: false });
      this.cargarDatosReales();
    });
  }

  // --- CALENDARIO VISUAL ---
  imprimirReceta() { window.print(); }
  generarCalendario() {
    const year = this.mesDesplegado.getFullYear(); const month = this.mesDesplegado.getMonth();
    this.mesActualTitulo = `${this.nombresMeses[month]} ${year}`; this.diasCalendario = [];
    const primerDia = new Date(year, month, 1).getDay(); const diasEnMes = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < primerDia; i++) this.diasCalendario.push({ numero: '', inactivo: true, citas: [], fechaCompleta: '' });
    for (let i = 1; i <= diasEnMes; i++) {
      const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const citasDelDia = this.todasLasCitas.filter(c => c.fechaHoraSegura && String(c.fechaHoraSegura).substring(0, 10) === fechaStr);
      this.diasCalendario.push({ numero: i, inactivo: false, citas: citasDelDia, fechaCompleta: fechaStr });
    }
  }

  mesAnterior() { this.mesDesplegado.setMonth(this.mesDesplegado.getMonth() - 1); this.generarCalendario(); }
  mesSiguiente() { this.mesDesplegado.setMonth(this.mesDesplegado.getMonth() + 1); this.generarCalendario(); }
  cerrarModalCita() { this.mostrarModalCita = false; }
  cerrarModalInventario() { this.mostrarModalInventario = false; }
}