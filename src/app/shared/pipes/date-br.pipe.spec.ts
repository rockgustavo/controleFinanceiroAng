import { DateBrPipe } from './date-br.pipe';

describe('DateBrPipe', () => {
  let pipe: DateBrPipe;

  beforeEach(() => (pipe = new DateBrPipe()));

  it('retorna — para null', () => {
    expect(pipe.transform(null)).toBe('—');
  });

  it('retorna — para undefined', () => {
    expect(pipe.transform(undefined)).toBe('—');
  });

  it('retorna — para string vazia', () => {
    expect(pipe.transform('')).toBe('—');
  });

  it('formata data ISO no padrão pt-BR sem deslocar o dia', () => {
    expect(pipe.transform('2025-05-31')).toBe('31/05/2025');
  });
});
