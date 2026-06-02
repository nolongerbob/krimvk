import {
  assertMessageImageUrlOwnedByUser,
  buildMessageImageS3Key,
  isLegacyMessageImageKey,
  isUserOwnedMessageImageKey,
} from '@/lib/message-image-access';

const USER = 'user_abc123';

describe('message-image-access', () => {
  it('builds per-user S3 key', () => {
    expect(buildMessageImageS3Key(USER, '1_photo.jpg')).toBe(
      'messages/user_abc123/1_photo.jpg'
    );
  });

  it('detects owned keys', () => {
    expect(isUserOwnedMessageImageKey(`messages/${USER}/x.jpg`, USER)).toBe(true);
    expect(isUserOwnedMessageImageKey('messages/other/x.jpg', USER)).toBe(false);
  });

  it('detects legacy keys', () => {
    expect(isLegacyMessageImageKey('messages/1700000000_pic.jpg')).toBe(true);
    expect(isLegacyMessageImageKey(`messages/${USER}/pic.jpg`)).toBe(false);
  });

  it('rejects foreign imageUrl on create', () => {
    const foreign = `/api/files/private/messages/other_user/1.jpg`;
    expect(assertMessageImageUrlOwnedByUser(foreign, USER).ok).toBe(false);
    const own = `/api/files/private/messages/${USER}/1.jpg`;
    expect(assertMessageImageUrlOwnedByUser(own, USER).ok).toBe(true);
  });
});
