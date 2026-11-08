import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth-service';
import { ConfirmacionService } from '../../shared/confirmacion/confirmacion';
import { mensajeDeError } from '../../shared/utilidades/errores';
import { CuentaService } from './cuenta-service';
import { Cuenta, RolCuenta } from './cuenta.model';
import { SolicitudService } from './solicitud-service';
import { EstadoSolicitud, SolicitudCuenta } from './solicitud.model';
import { ImagenSegura } from '../../shared/imagen-segura/imagen-segura';
import { SEDES, SedeService, nombreSede } from '../../core/sede/sede-service';
import { environment } from '../../../environments/environment';

type Panel =
  | { tipo: 'crear' }
  | { tipo: 'rol'; cuenta: Cuenta }
  | { tipo: 'clave'; cuenta: Cuenta }
  | { tipo: 'entregar'; usuario: string; nombre: string; contrasenia: string; nueva: boolean; sinCorreo?: boolean }
  | { tipo: 'aprobar'; solicitud: SolicitudCuenta }
  | { tipo: 'rechazar'; solicitud: SolicitudCuenta }
  | { tipo: 'correo'; nombre: string; correo: string; usuario: string };

interface OpcionRol {
  valor: RolCuenta;
  texto: string;
  ayuda: string;
  icono: string;
}

const CARACTERES = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

@Component({
  selector: 'app-cuentas',
  imports: [ReactiveFormsModule, DatePipe, ImagenSegura],
  templateUrl: './cuentas.html',
  styleUrl: './cuentas.css',
})
export class Cuentas implements OnInit {
  private readonly cuentaService = inject(CuentaService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly sedeService = inject(SedeService);

  protected readonly sedes = SEDES;
  protected readonly odoo = environment.odoo;
  protected readonly nombreSede = nombreSede;

  protected readonly roles: OpcionRol[] = [
    { valor: 'ESTUDIANTE', texto: 'Estudiante', ayuda: 'Registra sus hábitos y ve su avance', icono: 'school' },
    { valor: 'COORDINADOR', texto: 'Coordinación', ayuda: 'Valida evidencias y ve reportes de su sede', icono: 'fact_check' },
    { valor: 'ADMIN', texto: 'Administrador', ayuda: 'Ve y configura las tres sedes', icono: 'admin_panel_settings' },
  ];

  protected readonly cuentas = signal<Cuenta[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly filtroRol = signal<RolCuenta | null>(null);
  protected readonly panel = signal<Panel | null>(null);
  protected readonly errorPanel = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly rolElegido = signal<RolCuenta>('ESTUDIANTE');
  protected readonly claveNueva = signal('');
  protected readonly copiado = signal(false);
  protected readonly intentado = signal(false);
  protected readonly pestania = signal<'cuentas' | 'solicitudes'>('cuentas');
  protected readonly solicitudes = signal<SolicitudCuenta[]>([]);
  protected readonly filtroSolicitud = signal<EstadoSolicitud>('PENDIENTE');
  protected readonly cargandoSolicitudes = signal(false);
  protected readonly usuarioAprobar = signal('');
  protected readonly enviarCorreo = signal(true);
  protected readonly motivo = signal('');
  protected readonly exportando = signal<string | null>(null);
  protected readonly filtroSede = signal<string>(this.sedeService.actual() ?? 'TODAS');
  protected readonly sedeElegida = signal<string>(this.sedeService.actual() ?? 'JULIACA');

  protected readonly miId = computed(() => this.auth.usuario()?.id ?? '');

  protected readonly form = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    usuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60), Validators.pattern(/^[a-z0-9._-]+$/)]],
    contrasenia: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
  });

  private readonly enSede = computed(() => {
    const sede = this.filtroSede();
    return this.cuentas().filter((c) => sede === 'TODAS' || c.rol === 'ADMIN' || c.sede === sede);
  });

  protected readonly solicitudesVisibles = computed(() => {
    const sede = this.filtroSede();
    return this.solicitudes().filter((s) => sede === 'TODAS' || s.sede === sede);
  });

  protected readonly pendientes = signal<SolicitudCuenta[]>([]);

  protected readonly pendientesSede = computed(() => {
    const sede = this.filtroSede();
    return this.pendientes().filter((s) => sede === 'TODAS' || s.sede === sede).length;
  });

  protected readonly visibles = computed(() => {
    const texto = this.normalizar(this.busqueda());
    const rol = this.filtroRol();
    return this.enSede().filter(
      (c) =>
        (rol === null || c.rol === rol) &&
        (!texto ||
          this.normalizar(`${c.nombres} ${c.apellidos} ${c.usuario} ${c.correo}`).includes(texto)),
    );
  });

  protected readonly conteo = computed(() => {
    const lista = this.enSede();
    return {
      total: lista.length,
      ESTUDIANTE: lista.filter((c) => c.rol === 'ESTUDIANTE').length,
      COORDINADOR: lista.filter((c) => c.rol === 'COORDINADOR').length,
      ADMIN: lista.filter((c) => c.rol === 'ADMIN').length,
      inactivas: lista.filter((c) => !c.activa).length,
    };
  });

  ngOnInit(): void {
    this.cargar();
    if (this.odoo) this.cargarSolicitudes();
  }

  protected cambiarPestania(pestania: 'cuentas' | 'solicitudes'): void {
    this.pestania.set(pestania);
    this.aviso.set(null);
    this.error.set(null);
    if (pestania === 'solicitudes') this.cargarSolicitudes();
  }

  protected filtrarSolicitudes(estado: EstadoSolicitud): void {
    this.filtroSolicitud.set(estado);
    this.cargarSolicitudes();
  }

  protected cargarSolicitudes(): void {
    this.cargandoSolicitudes.set(true);
    this.solicitudService.listar(this.filtroSolicitud()).subscribe({
      next: (data) => {
        this.solicitudes.set(data);
        if (this.filtroSolicitud() === 'PENDIENTE') this.pendientes.set(data);
        this.cargandoSolicitudes.set(false);
      },
      error: (err) => {
        this.solicitudes.set([]);
        if (this.pestania() === 'solicitudes') {
          this.error.set(mensajeDeError(err, 'No se pudieron leer las solicitudes desde Odoo.'));
        }
        this.cargandoSolicitudes.set(false);
      },
    });
  }

  protected abrirAprobar(solicitud: SolicitudCuenta): void {
    this.usuarioAprobar.set(solicitud.correo.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, ''));
    this.enviarCorreo.set(true);
    this.errorPanel.set(null);
    this.panel.set({ tipo: 'aprobar', solicitud });
  }

  protected escribirUsuario(evento: Event): void {
    this.usuarioAprobar.set((evento.target as HTMLInputElement).value.trim().toLowerCase());
  }

  protected alternarCorreo(evento: Event): void {
    this.enviarCorreo.set((evento.target as HTMLInputElement).checked);
  }

  protected aprobar(solicitud: SolicitudCuenta): void {
    const usuario = this.usuarioAprobar();
    if (!/^[a-z0-9._-]{3,60}$/.test(usuario)) {
      this.errorPanel.set('El usuario debe tener al menos 3 caracteres: minúsculas, números, punto o guion.');
      return;
    }
    this.guardando.set(true);
    this.errorPanel.set(null);
    this.solicitudService.aprobar(solicitud.id, usuario, this.enviarCorreo()).subscribe({
      next: (resultado) => {
        this.guardando.set(false);
        this.quitarSolicitud(solicitud.id);
        this.cuentas.update((lista) => [...lista, resultado.cuenta]);
        const nombre = `${solicitud.nombres} ${solicitud.apellidos}`;
        if (resultado.correoEnviado) {
          this.panel.set({ tipo: 'correo', nombre, correo: solicitud.correo, usuario: resultado.cuenta.usuario });
        } else {
          this.copiado.set(false);
          this.panel.set({
            tipo: 'entregar',
            usuario: resultado.cuenta.usuario,
            nombre,
            contrasenia: resultado.contraseniaTemporal ?? '',
            nueva: true,
            sinCorreo: this.enviarCorreo(),
          });
        }
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPanel.set(mensajeDeError(err, 'No se pudo aprobar la solicitud.'));
      },
    });
  }

  protected abrirRechazar(solicitud: SolicitudCuenta): void {
    this.motivo.set('');
    this.errorPanel.set(null);
    this.panel.set({ tipo: 'rechazar', solicitud });
  }

  protected escribirMotivo(evento: Event): void {
    this.motivo.set((evento.target as HTMLTextAreaElement).value);
  }

  protected rechazar(solicitud: SolicitudCuenta): void {
    const motivo = this.motivo().trim();
    if (motivo.length < 5) {
      this.errorPanel.set('Escribe el motivo (mínimo 5 caracteres).');
      return;
    }
    this.guardando.set(true);
    this.solicitudService.rechazar(solicitud.id, motivo).subscribe({
      next: () => {
        this.quitarSolicitud(solicitud.id);
        this.cerrar();
        this.aviso.set(`Rechazaste la solicitud de ${solicitud.nombres} ${solicitud.apellidos}.`);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPanel.set(mensajeDeError(err, 'No se pudo rechazar la solicitud.'));
      },
    });
  }

  protected exportar(tipo: 'contactos' | 'puntos'): void {
    this.exportando.set(tipo);
    this.error.set(null);
    this.solicitudService.exportarOdoo(tipo).subscribe({
      next: (blob) => {
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = tipo === 'contactos' ? 'estudiantes_odoo.csv' : 'puntos_odoo.csv';
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
        this.exportando.set(null);
      },
      error: (err) => {
        this.exportando.set(null);
        this.error.set(mensajeDeError(err, 'No se pudo generar el archivo para Odoo.'));
      },
    });
  }

  private quitarSolicitud(id: number): void {
    this.solicitudes.update((lista) => lista.filter((s) => s.id !== id));
    this.pendientes.update((lista) => lista.filter((s) => s.id !== id));
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.cuentaService.listar().subscribe({
      next: (data) => {
        this.cuentas.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err, 'No se pudieron cargar las cuentas.'));
        this.cargando.set(false);
      },
    });
  }

  protected buscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected opcion(rol: RolCuenta | null): OpcionRol | undefined {
    return this.roles.find((r) => r.valor === rol);
  }

  protected iniciales(cuenta: Cuenta): string {
    return `${cuenta.nombres.charAt(0)}${cuenta.apellidos.charAt(0)}`.toUpperCase() || '?';
  }

  protected abrirCrear(): void {
    this.form.reset({ nombres: '', apellidos: '', correo: '', usuario: '', contrasenia: this.generarClave() });
    this.rolElegido.set('ESTUDIANTE');
    this.sedeElegida.set(this.filtroSede() === 'TODAS' ? this.sedeService.actual() ?? 'JULIACA' : this.filtroSede());
    this.intentado.set(false);
    this.errorPanel.set(null);
    this.panel.set({ tipo: 'crear' });
  }

  protected sugerirUsuario(): void {
    const control = this.form.controls.usuario;
    if (control.dirty) return;
    const correo = this.form.controls.correo.value.trim().toLowerCase();
    const antes = correo.split('@')[0] ?? '';
    control.setValue(antes.replace(/[^a-z0-9._-]/g, ''));
  }

  protected nuevaClaveFormulario(): void {
    this.form.controls.contrasenia.setValue(this.generarClave());
  }

  protected invalido(campo: 'nombres' | 'apellidos' | 'correo' | 'usuario' | 'contrasenia'): boolean {
    const control = this.form.controls[campo];
    return control.invalid && (control.touched || this.intentado());
  }

  protected crear(): void {
    this.intentado.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errorPanel.set(null);
    const rol = this.rolElegido();
    const datos = { ...this.form.getRawValue(), rol, sede: rol === 'ADMIN' ? null : this.sedeElegida() };
    this.cuentaService.crear(datos).subscribe({
      next: (cuenta) => {
        this.guardando.set(false);
        this.cuentas.update((lista) => [...lista, cuenta]);
        this.mostrarEntrega(cuenta, datos.contrasenia, true);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPanel.set(mensajeDeError(err, 'No se pudo crear la cuenta.'));
      },
    });
  }

  protected abrirRol(cuenta: Cuenta): void {
    this.rolElegido.set(cuenta.rol ?? 'ESTUDIANTE');
    this.sedeElegida.set(cuenta.sede ?? this.sedeService.actual() ?? 'JULIACA');
    this.errorPanel.set(null);
    this.panel.set({ tipo: 'rol', cuenta });
  }

  protected guardarRol(cuenta: Cuenta): void {
    const rol = this.rolElegido();
    const sede = rol === 'ADMIN' ? null : this.sedeElegida();
    if (rol === cuenta.rol && sede === (cuenta.sede ?? null)) {
      this.cerrar();
      return;
    }
    this.guardando.set(true);
    this.cuentaService.cambiarRol(cuenta.id, rol, sede).subscribe({
      next: (actualizada) => {
        this.reemplazar(actualizada);
        this.cerrar();
        const donde = actualizada.rol === 'ADMIN' ? 'en todas las sedes' : `en ${nombreSede(actualizada.sede)}`;
        this.aviso.set(`${actualizada.nombres} ahora es ${this.opcion(actualizada.rol)?.texto.toLowerCase()} ${donde}.`);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPanel.set(mensajeDeError(err, 'No se pudo cambiar el rol.'));
      },
    });
  }

  protected abrirClave(cuenta: Cuenta): void {
    this.claveNueva.set(this.generarClave());
    this.errorPanel.set(null);
    this.panel.set({ tipo: 'clave', cuenta });
  }

  protected escribirClave(evento: Event): void {
    this.claveNueva.set((evento.target as HTMLInputElement).value);
  }

  protected regenerarClave(): void {
    this.claveNueva.set(this.generarClave());
  }

  protected guardarClave(cuenta: Cuenta): void {
    const clave = this.claveNueva().trim();
    if (clave.length < 8) {
      this.errorPanel.set('La contraseña temporal debe tener al menos 8 caracteres.');
      return;
    }
    this.guardando.set(true);
    this.cuentaService.restablecerContrasenia(cuenta.id, clave).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarEntrega(cuenta, clave, false);
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorPanel.set(mensajeDeError(err, 'No se pudo restablecer la contraseña.'));
      },
    });
  }

  protected alternarEstado(cuenta: Cuenta): void {
    const activar = !cuenta.activa;
    this.confirmacion
      .preguntar({
        titulo: activar ? 'Activar cuenta' : 'Desactivar cuenta',
        mensaje: activar
          ? `${cuenta.nombres} ${cuenta.apellidos} podrá volver a ingresar.`
          : `${cuenta.nombres} ${cuenta.apellidos} ya no podrá ingresar. Sus registros se conservan y puedes reactivarla cuando quieras.`,
        aceptar: activar ? 'Activar' : 'Desactivar',
        icono: activar ? 'lock_open' : 'block',
        peligro: !activar,
      })
      .subscribe((si) => {
        if (!si) return;
        this.error.set(null);
        this.cuentaService.cambiarEstado(cuenta.id, activar).subscribe({
          next: (actualizada) => {
            this.reemplazar(actualizada);
            this.aviso.set(`Cuenta de ${actualizada.nombres} ${activar ? 'activada' : 'desactivada'}.`);
          },
          error: (err) => this.error.set(mensajeDeError(err, 'No se pudo cambiar el estado de la cuenta.')),
        });
      });
  }

  protected async copiar(panel: Extract<Panel, { tipo: 'entregar' }>): Promise<void> {
    const texto = `Usuario: ${panel.usuario}\nContraseña temporal: ${panel.contrasenia}\nAl ingresar te pedirá cambiarla.`;
    try {
      await navigator.clipboard.writeText(texto);
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    } catch {
      this.copiado.set(false);
    }
  }

  protected cerrar(): void {
    this.panel.set(null);
    this.guardando.set(false);
    this.errorPanel.set(null);
  }

  private mostrarEntrega(cuenta: Cuenta, contrasenia: string, nueva: boolean): void {
    this.copiado.set(false);
    this.panel.set({
      tipo: 'entregar',
      usuario: cuenta.usuario,
      nombre: `${cuenta.nombres} ${cuenta.apellidos}`,
      contrasenia,
      nueva,
    });
  }

  private reemplazar(cuenta: Cuenta): void {
    this.cuentas.update((lista) => lista.map((c) => (c.id === cuenta.id ? cuenta : c)));
    this.guardando.set(false);
  }

  private generarClave(): string {
    const valores = crypto.getRandomValues(new Uint32Array(10));
    return Array.from(valores, (v) => CARACTERES[v % CARACTERES.length]).join('');
  }

  private normalizar(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }
}
