import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth-service';
import { ConfirmacionService } from '../../shared/confirmacion/confirmacion';
import { mensajeDeError } from '../../shared/utilidades/errores';
import { CuentaService } from './cuenta-service';
import { Cuenta, RolCuenta } from './cuenta.model';

type Panel =
  | { tipo: 'crear' }
  | { tipo: 'rol'; cuenta: Cuenta }
  | { tipo: 'clave'; cuenta: Cuenta }
  | { tipo: 'entregar'; usuario: string; nombre: string; contrasenia: string; nueva: boolean };

interface OpcionRol {
  valor: RolCuenta;
  texto: string;
  ayuda: string;
  icono: string;
}

const CARACTERES = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

@Component({
  selector: 'app-cuentas',
  imports: [ReactiveFormsModule],
  templateUrl: './cuentas.html',
  styleUrl: './cuentas.css',
})
export class Cuentas implements OnInit {
  private readonly cuentaService = inject(CuentaService);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly roles: OpcionRol[] = [
    { valor: 'ESTUDIANTE', texto: 'Estudiante', ayuda: 'Registra sus hábitos y ve su avance', icono: 'school' },
    { valor: 'COORDINADOR', texto: 'Coordinación', ayuda: 'Valida evidencias y ve reportes', icono: 'fact_check' },
    { valor: 'ADMIN', texto: 'Administrador', ayuda: 'Configura campañas, hábitos y cuentas', icono: 'admin_panel_settings' },
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

  protected readonly miId = computed(() => this.auth.usuario()?.id ?? '');

  protected readonly form = this.fb.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    usuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60), Validators.pattern(/^[a-z0-9._-]+$/)]],
    contrasenia: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
  });

  protected readonly visibles = computed(() => {
    const texto = this.normalizar(this.busqueda());
    const rol = this.filtroRol();
    return this.cuentas().filter(
      (c) =>
        (rol === null || c.rol === rol) &&
        (!texto ||
          this.normalizar(`${c.nombres} ${c.apellidos} ${c.usuario} ${c.correo}`).includes(texto)),
    );
  });

  protected readonly conteo = computed(() => {
    const lista = this.cuentas();
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
    const datos = { ...this.form.getRawValue(), rol: this.rolElegido() };
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
    this.errorPanel.set(null);
    this.panel.set({ tipo: 'rol', cuenta });
  }

  protected guardarRol(cuenta: Cuenta): void {
    if (this.rolElegido() === cuenta.rol) {
      this.cerrar();
      return;
    }
    this.guardando.set(true);
    this.cuentaService.cambiarRol(cuenta.id, this.rolElegido()).subscribe({
      next: (actualizada) => {
        this.reemplazar(actualizada);
        this.cerrar();
        this.aviso.set(`${actualizada.nombres} ahora es ${this.opcion(actualizada.rol)?.texto.toLowerCase()}.`);
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
