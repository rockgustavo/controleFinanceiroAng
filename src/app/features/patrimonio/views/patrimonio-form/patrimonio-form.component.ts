import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { PatrimonioService } from '../../services/patrimonio.service';
import { apiErrorMessage } from '../../../../core/http/api-error';
import { Asset, AssetType, CreateAssetRequest, UpdateAssetRequest } from '../../../../core/models/asset.model';

const TICKER_TYPES: AssetType[] = ['RENDA_VARIAVEL', 'FII', 'ETF'];

@Component({
  selector: 'app-patrimonio-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './patrimonio-form.component.html'
})
export class PatrimonioFormComponent implements OnInit {
  @Input() asset: Asset | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private svc = inject(PatrimonioService);

  saving = signal(false);
  serverError = signal('');

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    tipo: ['RENDA_FIXA' as AssetType, Validators.required],
    ticker: [''],
    observacoes: ['']
  });

  get tickerRequired(): boolean {
    return TICKER_TYPES.includes(this.form.get('tipo')?.value as AssetType);
  }

  ngOnInit(): void {
    if (this.asset) {
      this.form.patchValue(this.asset);
    }
    this.form.get('tipo')!.valueChanges.subscribe(() => this.updateTickerValidation());
    this.updateTickerValidation();
  }

  private updateTickerValidation(): void {
    const tickerCtrl = this.form.get('ticker')!;
    if (this.tickerRequired) {
      tickerCtrl.setValidators([Validators.required, Validators.maxLength(10)]);
    } else {
      tickerCtrl.clearValidators();
    }
    tickerCtrl.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.serverError.set('');

    const value = this.form.getRawValue();
    const op = this.asset
      ? this.svc.update(this.asset.id, {
          nome: value.nome || undefined,
          ticker: value.ticker || undefined,
          observacoes: value.observacoes || undefined
        } as UpdateAssetRequest)
      : this.svc.create({
          nome: value.nome!,
          tipo: value.tipo!,
          ticker: value.ticker || undefined,
          observacoes: value.observacoes || undefined
        } as CreateAssetRequest);

    op.subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: (err) => {
        this.saving.set(false);
        this.serverError.set(apiErrorMessage(err, 'Erro ao salvar.'));
      }
    });
  }
}
