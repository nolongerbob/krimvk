import { act, render, screen, fireEvent } from "@testing-library/react";
import { UsersClient } from "@/app/admin/users/UsersClient";

jest.mock("@/components/admin/UserDetailsDialog", () => ({ UserDetailsDialog: () => null }));

const user = {
  id: "one", email: "example@example.test", name: "Тестовый пользователь", phone: null,
  address: null, role: "USER", createdAt: "2026-09-01T00:00:00Z", userAccounts: [],
  applications: [], bills: [], totalDebt: 0, unpaidBillsCount: 0, balanceLoading: true,
};

describe("admin users page controls", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });
  afterEach(() => { jest.useRealTimers(); });

  it("preserves global search when paging and shows navigation at both ends", () => {
    render(<UsersClient users={[user]} page={2} pageSize={25} totalUsers={80} query="лицевой счет" />);
    const next = screen.getAllByRole("link", { name: "Далее →" });
    expect(next).toHaveLength(2);
    const url = new URL(next[0].getAttribute("href")!, "https://example.test");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.get("q")).toBe("лицевой счет");
    expect(screen.getByRole("textbox")).toHaveAttribute("name", "q");
  });

  it("has no next link when the last page is exactly full", () => {
    render(<UsersClient users={[user]} page={2} pageSize={25} totalUsers={50} query="" />);
    expect(screen.queryByRole("link", { name: "Далее →" })).not.toBeInTheDocument();
  });

  it("does not classify loading or failed balances as debt-free", async () => {
    render(<UsersClient users={[user]} page={1} totalUsers={1} query="" />);
    expect(screen.getByRole("button", { name: /Без долгов \(0\)/ })).toBeInTheDocument();
    await act(async () => { jest.advanceTimersByTime(1); });
    expect(screen.getByText("Баланс недоступен")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Без долгов/ }));
    expect(screen.queryByText(user.name)).not.toBeInTheDocument();
  });
});
