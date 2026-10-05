import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { VentaService } from './venta-service';
import { VentaReporte } from './venta.model';

@Component({
  selector: 'app-venta-reporte',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './venta-reporte.html',
})
export class VentaReporteComponent implements OnInit {
  private readonly ventaService = inject(VentaService);

  protected readonly reporte = signal<VentaReporte | null>(null);
  protected readonly estadoFiltro = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ventaService.reporte(this.estadoFiltro() || undefined).subscribe({
      next: (data) => this.reporte.set(data),
      error: () => this.error.set('No se pudo cargar el reporte de ventas.'),
      complete: () => this.loading.set(false),
    });
  }

  filtrarPorEstado(estado: string): void {
    this.estadoFiltro.set(estado);
    this.cargar();
  }
}