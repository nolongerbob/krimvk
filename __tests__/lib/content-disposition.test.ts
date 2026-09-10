import { safeContentDisposition } from '@/lib/content-disposition';

describe('safeContentDisposition', () => {
  it('preserves Russian download names without raw header control characters', () => {
    const header = safeContentDisposition('application/pdf', 'Мой паспорт.pdf');
    expect(header).toContain("filename*=UTF-8''" + encodeURIComponent('Мой паспорт.pdf'));
    expect(safeContentDisposition('application/pdf', 'name\r\n.pdf')).not.toMatch(/[\r\n]/);
  });
  it('uses inline for PDF', () => {
    expect(safeContentDisposition('application/pdf', 'report.pdf')).toMatch(/^inline;/);
  });

  it('uses attachment for HTML', () => {
    expect(safeContentDisposition('text/html', 'evil.html')).toMatch(/^attachment;/);
  });

  it('uses attachment for octet-stream', () => {
    expect(safeContentDisposition('application/octet-stream', 'bin')).toMatch(
      /^attachment;/
    );
  });
});
