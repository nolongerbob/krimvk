import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QuestionsChat } from "@/components/questions/QuestionsChat";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));

it("opens a local draft and sends its first message without a conversation id", async () => {
  const fetchMock = jest.fn()
    .mockResolvedValueOnce({ ok: true })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ question: {
      id: "created", status: "PENDING", messages: [{
        id: "message", text: "Первый вопрос", imageUrl: null,
        isFromAdmin: false, createdAt: new Date(),
      }],
    } }) });
  const originalFetch = global.fetch;
  global.fetch = fetchMock;
  try {
    const { unmount } = render(<QuestionsChat question={null} />);
    expect(screen.getByText("Пока нет сообщений. Задайте первый вопрос.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText("Введите сообщение…"), { target: { value: "Первый вопрос" } });
    fireEvent.click(screen.getByTitle("Отправить"));
    await waitFor(() => expect(screen.getByText("Первый вопрос")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/questions/create", expect.objectContaining({
      method: "POST", body: JSON.stringify({ text: "Первый вопрос", imageUrl: null }),
    }));
    unmount();
  } finally {
    global.fetch = originalFetch;
  }
});
