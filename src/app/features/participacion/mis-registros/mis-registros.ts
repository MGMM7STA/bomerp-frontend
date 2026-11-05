import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RegistroService } from '../registro/registro-service';
import { EstadoRegistro, RegistroResponse } from '../registro/registro.model';
import { estiloEstado } from '../../../shared/utilidades/estados';
import { mensajeDeError } from '../../../shared/utilidades/errores';
import { FotoEvidencia } from '../../../shared/foto-evidencia/foto-evidencia';

interface Filtro {
  texto: string;
  estado: EstadoRegistro | null;
}

@Component({
  selector: 'app-mis-registros',
  imports: [RouterLink, DatePipe, DecimalPipe, FotoEvidencia],
  templateUrl: './mis-registros.html',
  styleUrl: './mis-registros.css',
})
export class MisRegistros implements OnInit {
  private readonly registroService = inject(RegistroService);

  protected readonly filtros: Filtro[] = [
    { texto: 'Todos', estado: null },
    { texto: 'Por validar', estado: 'ENVIADO' },
    { texto: 'Validados', estado: 'VALIDADO' },
    { texto: 'Rechazados', estado: 'RECHAZADO' },
  ];

  protected readonly registros = signal<RegistroResponse[]>([]);
  protected readonly filtro = signal<EstadoRegistro | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly estilo = estiloEstado;

  protected readonly visibles = computed(() => {
    const estado = this.filtro();
    return estado === null ? this.registros() : this.registros().filter((r) => r.estado === estado);
  });

  protected readonly cantidad = computed(() => {
    const cuenta: Partial<Record<EstadoRegistro, number>> = {};
    for (const registro of this.registros()) {
      cuenta[registro.estado] = (cuenta[registro.estado] ?? 0) + 1;
    }
    return cuenta;
  });

  protected readonly puntosValidados = computed(() =>
    this.registros().reduce((suma, r) => suma + Number(r.puntajeValidado ?? 0), 0),
  );

  ngOnInit(): void {
    this.registroService.buscar().subscribe({
      next: (data) => {
        this.registros.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar tus registros.'));
        this.cargando.set(false);
      },
    });
  }

  protected total(estado: EstadoRegistro | null): number {
    return estado === null ? this.registros().length : (this.cantidad()[estado] ?? 0);
  }
}
