/** @jest-environment node */
import { NextRequest } from "next/server";
import { GET } from "@/app/api/questions/get-or-create/route";
import { POST } from "@/app/api/questions/create/route";
import { GET as listAdmin } from "@/app/api/admin/questions/list/route";
import { GET as notifications } from "@/app/api/admin/notifications/route";
import { prisma } from "@/lib/prisma";
import { getAppSession } from "@/lib/get-app-session";

jest.mock("@/lib/get-app-session", () => ({ getAppSession: jest.fn() }));
jest.mock("@/lib/require-admin", () => ({ requireAdmin: jest.fn(async () => ({ ok: true })) }));
jest.mock("@/lib/auth-config", () => ({ authOptions: {} }));
jest.mock("@/lib/message-image-access", () => ({ assertMessageImageUrlOwnedByUser: jest.fn(() => ({ ok: true })) }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    question: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    application: { count: jest.fn() },
    $transaction: jest.fn(),
  },
  withRetry: (fn: () => unknown) => fn(),
}));

const tx = {
  $queryRaw: jest.fn(),
  question: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  message: { create: jest.fn() },
};
const request = (body?: object) => new NextRequest("https://example.test/api/questions/create", body
  ? { method: "POST", body: JSON.stringify(body) } : undefined);

beforeEach(() => {
  jest.clearAllMocks();
  (getAppSession as jest.Mock).mockResolvedValue({ user: { id: "client" } });
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "client" });
  (prisma.question.findFirst as jest.Mock).mockResolvedValue(null);
  (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(tx));
  tx.$queryRaw.mockResolvedValue([{ id: "client" }]);
  tx.question.findFirst.mockResolvedValue(null);
  tx.question.create.mockResolvedValue({ id: "chat", status: "PENDING", messages: [] });
  tx.message.create.mockResolvedValue({ id: "message", questionId: "chat" });
});

it("opening a chat without a conversation is read-only", async () => {
  const response = await GET(request());
  expect(await response.json()).toEqual({ question: null });
  expect(prisma.question.create).not.toHaveBeenCalled();
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("returns the existing conversation on open without creating another", async () => {
  (prisma.question.findFirst as jest.Mock).mockResolvedValue({ id: "existing", messages: [] });
  expect((await (await GET(request())).json()).question.id).toBe("existing");
  expect(prisma.question.create).not.toHaveBeenCalled();
});

it("rejects empty sends without creating a conversation", async () => {
  expect((await POST(request({ text: "   " }))).status).toBe(400);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("creates the first message and greeting inside the same transaction", async () => {
  expect((await POST(request({ text: "Hello" }))).status).toBe(201);
  expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  expect(tx.$queryRaw).toHaveBeenCalled();
  expect(tx.question.create).toHaveBeenCalledTimes(1);
  expect(tx.message.create).toHaveBeenCalledTimes(2);
  expect(tx.message.create.mock.calls[0][0].data).toMatchObject({ text: "Hello", isFromAdmin: false });
  expect(prisma.question.create).not.toHaveBeenCalled();
});

it("reuses an old empty conversation", async () => {
  tx.question.findFirst.mockResolvedValue({ id: "old-empty", status: "PENDING", messages: [] });
  expect((await POST(request({ text: "Hello" }))).status).toBe(201);
  expect(tx.question.create).not.toHaveBeenCalled();
  expect(tx.message.create.mock.calls[0][0].data.questionId).toBe("old-empty");
});

it("reopens completed conversations without deleting their history", async () => {
  tx.question.findFirst.mockResolvedValue({ id: "old", status: "COMPLETED", messages: [{ id: "previous" }] });
  expect((await POST(request({ text: "Again" }))).status).toBe(201);
  expect(tx.question.update).toHaveBeenCalledWith({ where: { id: "old" }, data: { status: "PENDING" } });
  expect(tx.question.create).not.toHaveBeenCalled();
});

it("requires a client message in admin lists and notification counts", async () => {
  (prisma.question.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.question.count as jest.Mock).mockResolvedValue(0);
  (prisma.application.count as jest.Mock).mockResolvedValue(0);
  await listAdmin(request());
  await notifications(request());
  expect(prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { messages: { some: { isFromAdmin: false } } },
  }));
  for (const [args] of (prisma.question.count as jest.Mock).mock.calls) {
    expect(args.where.messages).toEqual({ some: { isFromAdmin: false } });
  }
});
