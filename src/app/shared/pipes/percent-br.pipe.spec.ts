import { PercentBrPipe } from './percent-br.pipe';

describe('PercentBrPipe', () => {
  let pipe: PercentBrPipe;

  beforeEach(() => (pipe = new PercentBrPipe()));

  it('retorna — para null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('retorna — para undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('formata com 2 casas e sufixo %', () => {
    expect(pipe.transform(10.5)).toBe('10,50%');
  });

  it('usa separador de milhar', () => {
    expect(pipe.transform(1234.5)).toBe('1.234,50%');
  });

  it('respeita o número de casas decimais informado', () => {
    expect(pipe.transform(7.5, 1)).toBe('7,5%');
  });

  it('formata zero', () => {
    expect(pipe.transform(0)).toBe('0,00%');
  });
});
