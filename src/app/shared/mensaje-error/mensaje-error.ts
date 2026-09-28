import { Component, input } from '@angular/core';

@Component({
  selector: 'app-mensaje-error',
  templateUrl: './mensaje-error.html',
})
export class MensajeError {
  readonly texto = input<string | null>(null);
}
