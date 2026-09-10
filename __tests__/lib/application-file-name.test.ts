import { cleanApplicationFileName, applicationFileLabel } from "@/lib/application-file-name";
import { isValidS3Key, isPrivateS3Key, isAllowedPublicS3Key } from "@/lib/s3-file-access";
import { fileHrefForStoredUrl } from "@/lib/file-url";

it("preserves Russian words with only the extension dot", () => {
  expect(cleanApplicationFileName("Мой_паспорт---копия._..PDF")).toBe("Мой паспорт копия.pdf");
  expect(cleanApplicationFileName("Акт.pdf")).toBe("Акт.pdf");
});
it("does not display technical prefixes or unrecoverable legacy names", () => {
  expect(applicationFileLabel("/files/applications/user/user_abc_12345________._..PDF", 0)).toBe("Документ 1.pdf");
  expect(applicationFileLabel("/api/files/private/applications/user/abc/unique/%D0%90%D0%BA%D1%82.pdf", 0)).toBe("Акт.pdf");
});
it("routes the legacy double-dot filename through authenticated access", () => {
  const key = "applications/user/user_abc_12345________._..PDF";
  expect(isValidS3Key(key)).toBe(true);
  expect(isPrivateS3Key(key)).toBe(true);
  expect(isAllowedPublicS3Key(key)).toBe(false);
  expect(fileHrefForStoredUrl("https://krimvk.ru/files/" + key)).toBe("/api/files/private/" + key);
});
it.each(["../file", "applications/../file", "applications/./file", "/applications/file", "applications//file", "applications/\\file", "applications/%2e%2e/file", "applications/%252e%252e/file", "applications/\u0000file"])("rejects unsafe path %s", key => {
  expect(isValidS3Key(key)).toBe(false);
});
