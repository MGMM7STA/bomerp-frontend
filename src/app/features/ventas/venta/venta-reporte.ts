import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { VentaService } from './venta-service';
import { VentaResponse } from './venta.model';

@Component({
  selector: 'app-venta-reporte',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './venta-reporte.html',
})
export class VentaReporteComponent implements OnInit {
  private readonly ventaService = inject(VentaService);

  protected readonly ventas = signal<VentaResponse[]>([]);
  protected readonly estadoFiltro = signal('');
  protected readonly desdeFiltro = signal('');
  protected readonly hastaFiltro = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly totalVentas = computed(() => this.ventas().length);
  protected readonly montoTotal = computed(() =>
    this.ventas().reduce((suma, v) => suma + v.total, 0),
  );
  protected readonly ticketPromedio = computed(() =>
    this.totalVentas() === 0 ? 0 : this.montoTotal() / this.totalVentas(),
  );

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set(null);
    const desde = this.desdeFiltro() ? `${this.desdeFiltro()}T00:00:00` : undefined;
    const hasta = this.hastaFiltro() ? `${this.hastaFiltro()}T23:59:59` : undefined;
    this.ventaService.buscar(this.estadoFiltro() || undefined, desde, hasta).subscribe({
      next: (data) => this.ventas.set(data),
      error: () => this.error.set('No se pudo cargar el reporte de ventas.'),
      complete: () => this.loading.set(false),
    });
  }

  filtrarPorEstado(estado: string): void {
    this.estadoFiltro.set(estado);
    this.cargar();
  }

  filtrarPorFecha(desde: string, hasta: string): void {
    this.desdeFiltro.set(desde);
    this.hastaFiltro.set(hasta);
    this.cargar();
  }

  anular(id: number): void {
    if (!confirm('¿Anular esta venta? El stock de sus productos se restaurará.')) return;
    this.ventaService.anular(id).subscribe({
      next: () => this.cargar(),
      error: () => this.error.set('No se pudo anular la venta.'),
    });
  }
}