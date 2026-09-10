/** @jest-environment node */
import { blockScannerPaths } from "@/lib/security/http-guard";
import { NextRequest } from "next/server";
const request = (pathname: string) => ({ nextUrl: { pathname } }) as NextRequest;
it("allows dots within a private filename to reach authorization", () => {
  expect(blockScannerPaths(request("/api/files/private/applications/user/file._..PDF"))).toBeNull();
});
it.each([
  "/api/files/private/applications/../file.pdf",
  "/api/files/private/applications/..\\file.pdf",
  "/files/applications/file..pdf",
  "/.env",
  "/api/files/private/other/file..pdf",
])("retains blocking for %s", (path) => {
  expect(blockScannerPaths(request(path))?.status).toBe(404);
});
