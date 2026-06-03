import { isAllowedPublicS3Key } from '@/lib/s3-file-access';

describe('isAllowedPublicS3Key', () => {
  it('allows news prefix', () => {
    expect(isAllowedPublicS3Key('news/2024/file.pdf')).toBe(true);
  });

  it('blocks legacy private uploads', () => {
    expect(isAllowedPublicS3Key('uploads/applications/user_1/doc.pdf')).toBe(
      false
    );
  });

  it('allows legacy public uploads under posts', () => {
    expect(isAllowedPublicS3Key('uploads/posts/file.pdf')).toBe(true);
  });
});
