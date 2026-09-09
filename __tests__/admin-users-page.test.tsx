jest.mock("@/lib/get-session", () => ({ getSession: jest.fn() }));
jest.mock("next/navigation", () => ({ redirect: jest.fn(() => { throw new Error("redirect"); }) }));
jest.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() } },
  withRetry: (fn: () => unknown) => fn(),
}));
jest.mock("@/app/admin/users/UsersClient", () => ({ UsersClient: () => null }));
jest.mock("@/components/admin/AdminPageHeader", () => ({ AdminPageHeader: () => null }));

import Page from "@/app/admin/users/page";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

describe("admin users server pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "admin" } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: "ADMIN" });
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.count as jest.Mock).mockResolvedValue(51);
  });

  it("loads only 25 users with stable ordering and explicit public fields", async () => {
    await Page({ searchParams: Promise.resolve({ page: "2" }) });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 25, take: 25, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: expect.objectContaining({ id: true, email: true }),
    }));
    const args = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
    expect(args.select.password).toBeUndefined();
    expect(args.select.userAccounts.select.password1c).toBeUndefined();
  });

  it("searches and counts across the database before pagination", async () => {
    await Page({ searchParams: Promise.resolve({ q: "  12345  " }) });
    const where = (prisma.user.count as jest.Mock).mock.calls[0][0].where;
    expect(where.OR).toContainEqual({ email: { contains: "12345", mode: "insensitive" } });
    expect(where.OR).toContainEqual({ userAccounts: { some: { OR: [
      { accountNumber: { contains: "12345", mode: "insensitive" } },
      { address: { contains: "12345", mode: "insensitive" } },
    ] } } });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
  });

  it.each(["-1", "NaN", "Infinity", "1.5"])("normalizes invalid page %s", async (page) => {
    await Page({ searchParams: Promise.resolve({ page }) });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
  });

  it("clamps pages to the final non-empty page", async () => {
    await Page({ searchParams: Promise.resolve({ page: "999" }) });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 50 }));
  });

  it("blocks regular users before reading the user directory", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: "USER" });
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect");
    expect(prisma.user.count).not.toHaveBeenCalled();
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
