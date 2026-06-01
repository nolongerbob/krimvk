/**
 * @jest-environment node
 */
import { normalize1CResponse } from '@/lib/normalize-1c-response';

describe('normalize1CResponse', () => {
  it('unwraps array payload', () => {
    const data = normalize1CResponse([{ CommonDuty: '100,50', MeteringDevices: [] }]);
    expect(data.CommonDuty).toBe('100,50');
  });

  it('throws AUTH on Error incoming data', () => {
    expect(() => normalize1CResponse({ Error: '## Error in incoming data.' })).toThrow(
      /AUTH_ERROR/
    );
  });
});
