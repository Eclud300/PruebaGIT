import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent {

  listaEspecialidades = [
    'Odontología', 'Pediatría', 'Ginecología', 'Oftalmología', 
    'Dermatología', 'Medicina General', 'Ortopedia', 'Cardiología'
  ];

  // Base de datos general de consultorios registrados
  consultorios = [
    { 
      nombre: 'Centro Médico Integral Sur', 
      direccion: 'Blvd. Rodolfo Elías Calles 542', 
      especialidades: ['Medicina General', 'Pediatría'], 
      especialistas: 5, 
      calificacion: 4.9, 
      resenas: 120, 
      estado: 'Abierto', 
      theme: 'blue-theme',
      icono: '🏥'
    },
    { 
      nombre: 'Sonrisas Sanas Obregón', 
      direccion: 'Calle California 312, Centro', 
      especialidades: ['Ortodoncia', 'Odontopediatría'], 
      especialistas: 3, 
      calificacion: 5.0, 
      resenas: 85, 
      estado: 'Abierto', 
      theme: 'teal-theme',
      icono: '🦷'
    },
    { 
      nombre: 'Clínica Visión Clara', 
      direccion: 'Plaza Tutuli, Local 12', 
      especialidades: ['Oftalmología', 'Óptica'], 
      especialistas: 2, 
      calificacion: 4.8, 
      resenas: 56, 
      estado: 'Cerrado', 
      theme: 'purple-theme',
      icono: '👁️'
    },
    { 
      nombre: 'CardioCare Sonora', 
      direccion: 'Av. Miguel Alemán 900 Norte', 
      especialidades: ['Cardiología', 'Medicina Interna'], 
      especialistas: 4, 
      calificacion: 4.9, 
      resenas: 210, 
      estado: 'Abierto', 
      theme: 'orange-theme',
      icono: '❤️'
    }
  ];

  beneficiosPacientes = [
    { titulo: 'Agenda 24/7', desc: 'Reserva tu cita en cualquier momento, sin esperar a que abran la clínica.', icono: '⏰' },
    { titulo: 'Historial Digital', desc: 'Tus recetas y diagnósticos guardados de forma segura en tu celular.', icono: '📱' },
    { titulo: 'Cero Filas', desc: 'Llega directo a tu consulta. El sistema avisa cuando es tu turno real.', icono: '🚶' },
    { titulo: 'Especialistas Certificados', desc: 'Verificamos las cédulas de todos los médicos en nuestra plataforma.', icono: '✅' }
  ];

  buscarClinica() {
    alert('Buscando en el directorio médico...');
  }
}