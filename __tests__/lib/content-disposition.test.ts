import { safeContentDisposition } from '@/lib/content-disposition';

describe('safeContentDisposition', () => {
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
