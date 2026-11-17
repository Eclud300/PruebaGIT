import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  constructor(private http: HttpClient) { 
    window.addEventListener('online', () => this.sincronizarPendientes());
  }

  guardarAccion(urlEndpoint: string, datos: any): void {
    if (navigator.onLine) {
      // Le quitamos el 'return' de aquí. Solo disparamos la petición.
      this.http.post(urlEndpoint, datos).subscribe();
    } else {
      let pendientes = JSON.parse(localStorage.getItem('peticionesPendientes') || '[]');
      pendientes.push({ url: urlEndpoint, body: datos });
      localStorage.setItem('peticionesPendientes', JSON.stringify(pendientes));
      console.warn("Sin conexión: Acción encolada en localStorage");
    }
  }

  sincronizarPendientes(): void {
    let pendientes = JSON.parse(localStorage.getItem('peticionesPendientes') || '[]');
    if (pendientes.length > 0) {
      pendientes.forEach((peticion: any) => {
        this.http.post(peticion.url, peticion.body).subscribe();
      });
      localStorage.removeItem('peticionesPendientes');
    }
  }
}