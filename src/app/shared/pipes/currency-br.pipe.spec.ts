import { CurrencyBrPipe } from './currency-br.pipe';

describe('CurrencyBrPipe', () => {
  let pipe: CurrencyBrPipe;

  beforeEach(() => (pipe = new CurrencyBrPipe()));

  it('retorna — para null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('retorna — para undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('formata em BRL com 2 casas por padrão', () => {
    const out = pipe.transform(1234.5);
    expect(out).toContain('R$');
    expect(out).toContain('1.234,50');
  });

  it('formata zero com 2 casas', () => {
    expect(pipe.transform(0)).toContain('0,00');
  });

  it('respeita o número de casas decimais informado', () => {
    const out = pipe.transform(1000, 0);
    expect(out).toContain('1.000');
    expect(out).not.toContain(',');
  });

  it('formata valores negativos', () => {
    const out = pipe.transform(-50);
    expect(out).toContain('-');
    expect(out).toContain('50,00');
  });
});
