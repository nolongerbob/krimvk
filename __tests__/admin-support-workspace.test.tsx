import { act, fireEvent, render, screen } from '@testing-library/react';
import { AdminQuestionsChat } from '@/components/admin/AdminQuestionsChat';

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }));
jest.mock('@/components/admin/ChatUserProfile', () => ({ ChatUserProfile: ({ userId, onUserUpdated, onUserDeleted }: any) => <div>
  <button onClick={() => onUserUpdated({ id: userId, name: 'Новое имя', email: 'new@example.test' })}>rename profile</button>
  <button onClick={() => onUserDeleted(userId)}>delete profile</button>
</div> }));
const questions = ['Анна', 'Борис', 'Вера'].map((name, index) => ({
  id: String(index), status: index === 2 ? 'COMPLETED' : 'PENDING',
  createdAt: new Date(), updatedAt: new Date(),
  user: { id: String(index), name, email: `${index}@example.test` },
  messages: [{ id: `m${index}`, text: `Вопрос ${index}`, imageUrl: null, isFromAdmin: false, createdAt: new Date() }],
}));
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
});

it('keeps a separate draft for each person', () => {
  render(<AdminQuestionsChat questions={questions} currentUserId="admin" />);
  fireEvent.change(screen.getByLabelText('Ответ пользователю'), { target: { value: 'Ответ Анне' } });
  fireEvent.click(screen.getByRole('button', { name: /Борис Вопрос/ }));
  expect(screen.getByLabelText('Ответ пользователю')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Ответ пользователю'), { target: { value: 'Ответ Борису' } });
  fireEvent.click(screen.getByRole('button', { name: /Анна Вопрос/ }));
  expect(screen.getByLabelText('Ответ пользователю')).toHaveValue('Ответ Анне');
});

it('searches conversations and keeps completed ones in a separate filter', () => {
  render(<AdminQuestionsChat questions={questions} currentUserId="admin" />);
  expect(screen.queryByRole('button', { name: /Вера Вопрос/ })).toBeNull();
  fireEvent.change(screen.getByLabelText('Поиск диалогов'), { target: { value: '1@example.test' } });
  expect(screen.getByRole('button', { name: /Борис Вопрос/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Анна Вопрос/ })).toBeNull();
  fireEvent.change(screen.getByLabelText('Поиск диалогов'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Статус диалогов'), { target: { value: 'COMPLETED' } });
  expect(screen.getByRole('button', { name: /Вера Вопрос/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Открыть шаблоны и базу знаний' })).toBeInTheDocument();
});

it('retains the draft and displays a failed send', async () => {
  render(<AdminQuestionsChat questions={questions} currentUserId="admin" />);
  (fetch as jest.Mock).mockResolvedValue({ ok: false });
  fireEvent.change(screen.getByLabelText('Ответ пользователю'), { target: { value: 'Мой ответ' } });
  fireEvent.click(screen.getByTitle('Отправить'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось отправить');
  expect(screen.getByLabelText('Ответ пользователю')).toHaveValue('Мой ответ');
});

it('updates the chat name and removes all conversations of a deleted user', async () => {
  jest.useFakeTimers();
  try {
    render(<AdminQuestionsChat questions={questions} currentUserId="admin" />);
    fireEvent.click(screen.getByRole('button', { name: 'Открыть профиль: Анна' }));
    fireEvent.click(screen.getByText('rename profile'));
    expect(screen.getByRole('button', { name: 'Открыть профиль: Новое имя' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('delete profile'));
    expect(screen.queryByRole('button', { name: /Новое имя Вопрос/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Борис Вопрос/ })).toBeInTheDocument();
    // An older in-flight delta must not resurrect the removed conversation.
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ delta: true, questions }) });
    await act(async () => { jest.advanceTimersByTime(10000); });
    expect(screen.queryByRole('button', { name: /Анна Вопрос/ })).not.toBeInTheDocument();
  } finally { jest.useRealTimers(); }
});
