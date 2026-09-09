import { act, render, screen, fireEvent } from "@testing-library/react";
import { UsersClient } from "@/app/admin/users/UsersClient";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRouter = { push: mockPush, refresh: mockRefresh };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));

jest.mock("@/components/admin/UserDetailsDialog", () => ({ UserDetailsDialog: () => null }));

const user = {
  id: "one", email: "example@example.test", name: "Тестовый пользователь", phone: null,
  address: null, role: "USER", createdAt: "2026-09-01T00:00:00Z", userAccounts: [],
  applications: [], bills: [], totalDebt: 0, unpaidBillsCount: 0, balanceLoading: true,
};

describe("admin users page controls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
  });
  afterEach(() => { jest.useRealTimers(); });

  it("preserves global search when paging and shows navigation at both ends", () => {
    render(<UsersClient users={[user]} page={2} pageSize={25} totalUsers={80} query="лицевой счет" filter="admins" />);
    const next = screen.getAllByRole("link", { name: "Далее →" });
    expect(next).toHaveLength(2);
    const url = new URL(next[0].getAttribute("href")!, "https://example.test");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.get("filter")).toBe("admins");
    expect(url.searchParams.get("q")).toBe("лицевой счет");
    expect(screen.getByRole("textbox")).toHaveAttribute("name", "q");
  });

  it("has no next link when the last page is exactly full", () => {
    render(<UsersClient users={[user]} page={2} pageSize={25} totalUsers={50} query="" />);
    expect(screen.queryByRole("link", { name: "Далее →" })).not.toBeInTheDocument();
  });

  it('navigates to a global filter, resetting the page and preserving search', () => {
    render(<UsersClient users={[user]} page={2} totalUsers={80} query="test" />);
    fireEvent.click(screen.getByRole('button', { name: /Должники/ }));
    const url = new URL(mockPush.mock.calls[0][0], 'https://example.test');
    expect(url.searchParams.get('filter')).toBe('debtors');
    expect(url.searchParams.get('q')).toBe('test');
    expect(url.searchParams.has('page')).toBe(false);
  });

  it('shows unknown counts while loading, not a false zero', async () => {
    render(<UsersClient users={[user]} totalUsers={875} query="" />);
    expect(screen.getByRole('button', { name: 'Все (875)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Без долгов/ })).toBeInTheDocument();
    await act(async () => {});
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses global counts and explicitly excludes unavailable balances', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({
      stats: { total: 875, admins: 5, debtors: 120, overpaid: 50, noDebt: 704, unknown: 1, pending: 0 },
      running: false, error: false, finishedAt: 3, balances: { one: null },
    }) });
    render(<UsersClient users={[{ ...user, applicationsCount: 37 }]} totalUsers={875} query="" filter="debtors" snapshotVersion={1} />);
    await act(async () => {});
    expect(screen.getByRole('button', { name: /Должники/ })).toBeInTheDocument();
    expect(screen.getByText('Баланс недоступен')).toBeInTheDocument();
    expect(screen.getByText(/Заявок: 37/)).toBeInTheDocument();
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
