import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssistantChat } from '@/components/seasonal/AssistantChat';
const reply=jest.fn();
it('returns to AI only after confirmation and keeps the operator history',async()=>{
  let question={id:'q',status:'PENDING',messages:[{id:'1',text:'Сохраните эту переписку',isFromAdmin:false}]};
  (fetch as jest.Mock).mockImplementation((url)=>{
    if(url==='/api/assistant/return-to-ai')question={...question,status:'COMPLETED'};
    return Promise.resolve({ok:true,json:async()=>({question})});
  });
  render(<AssistantChat open onOpenChange={()=>{}} />);
  const back=await screen.findByRole('button',{name:'Вернуться к ИИ'});
  await waitFor(()=>expect(back).toBeEnabled());fireEvent.click(back);
  expect((fetch as jest.Mock).mock.calls.some(([url])=>url==='/api/assistant/return-to-ai')).toBe(false);
  fireEvent.click(screen.getByRole('button',{name:'Завершить и вернуться к ИИ'}));
  expect(await screen.findByLabelText('Ваш вопрос')).toBeEnabled();
  expect(screen.getByText('Сохраните эту переписку')).toBeInTheDocument();
});
it('retains operator history and the draft after completion, including on reopen',async()=>{
  const question={status:'PENDING',messages:[{id:'1',text:'Мой вопрос',isFromAdmin:false},{id:'2',text:'Ответ сотрудника',isFromAdmin:true}]};
  (fetch as jest.Mock).mockImplementation(()=>Promise.resolve({ok:true,json:async()=>({question})}));
  const {rerender}=render(<AssistantChat open onOpenChange={()=>{}} />);
  fireEvent.change(await screen.findByLabelText('Сообщение оператору'),{target:{value:'Спасибо, ещё вопрос'}});
  question.status='COMPLETED';
  fireEvent(window,new Event('focus'));
  expect(await screen.findByText(/Диалог с оператором завершён/)).toBeInTheDocument();
  expect(screen.getByText('Ответ сотрудника')).toBeInTheDocument();
  expect(screen.getByText('Мой вопрос')).toBeInTheDocument();
  expect(screen.getByLabelText('Ваш вопрос')).toHaveValue('Спасибо, ещё вопрос');
  rerender(<AssistantChat open={false} onOpenChange={()=>{}} />);
  rerender(<AssistantChat open onOpenChange={()=>{}} />);
  expect(await screen.findByText('Ответ сотрудника')).toBeInTheDocument();
});
it('loads a completed operator dialogue after a fresh mount',async()=>{
  (fetch as jest.Mock).mockResolvedValue({ok:true,json:async()=>({question:{status:'COMPLETED',messages:[{id:'2',text:'Сохранённый ответ',isFromAdmin:true}]}})});
  render(<AssistantChat open onOpenChange={()=>{}} />);
  expect(await screen.findByText('Сохранённый ответ')).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Позвать оператора'})).toBeEnabled();
});
it('invites a guest to sign in or register instead of sending chat messages',async()=>{
  (fetch as jest.Mock).mockResolvedValue({ok:false,status:401});
  render(<AssistantChat open onOpenChange={()=>{}} />);
  expect(await screen.findByRole('link',{name:'Войти'})).toHaveAttribute('href','/login?callbackUrl=%2Fdashboard%2Fquestions');
  expect(screen.getByRole('link',{name:'Зарегистрироваться'})).toHaveAttribute('href','/register');
  expect(screen.queryByLabelText('Ваш вопрос')).toBeNull();
  expect(reply).not.toHaveBeenCalled();
});
beforeEach(() => {
  reply.mockReset();
  global.fetch = jest.fn((url,options)=>url==='/api/questions/list' ? Promise.resolve({ok:true,json:async()=>({question:null})} as Response) : reply(url,options));
  Object.defineProperty(window,'matchMedia',{configurable:true,value:jest.fn(()=>({matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()}))});
});
it('is non-modal and preserves the draft across collapse and reopen', () => {
  const change=jest.fn();
  const {rerender}=render(<AssistantChat open onOpenChange={change} />);
  expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal','false');
  expect(screen.getByRole('img',{name:'Капелька в шляпе'})).toBeInTheDocument();
  expect(screen.queryByText('Я рядом')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Ваш вопрос'),{target:{value:'Мой незаконченный вопрос'}});
  fireEvent.click(screen.getByRole('button',{name:'Свернуть в капельку'}));
  expect(change).toHaveBeenCalledWith(false);
  rerender(<AssistantChat open={false} onOpenChange={change} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  rerender(<AssistantChat open onOpenChange={change} />);
  expect(screen.getByLabelText('Ваш вопрос')).toHaveValue('Мой незаконченный вопрос');
});
it('shows a real answer and retains the question on provider failure', async () => {
  reply.mockResolvedValueOnce({ ok: false, status: 503, json: async()=>({error:'ИИ недоступен'}) });
  render(<AssistantChat open onOpenChange={()=>{}} />);
  fireEvent.change(screen.getByLabelText('Ваш вопрос'),{target:{value:'Как передать показания?'}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Отправить'})).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:'Отправить'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('ИИ недоступен');
  expect(screen.getByLabelText('Ваш вопрос')).toHaveValue('Как передать показания?');
  reply.mockResolvedValueOnce({ok:true,json:async()=>({answer:'Откройте раздел показаний.'})});
  fireEvent.click(screen.getByRole('button',{name:'Отправить'}));
  expect(await screen.findByText('Откройте раздел показаний.')).toBeInTheDocument();
});
it('does not claim an operator was called on a failed handoff', async () => {
  reply.mockResolvedValue({ok:false,status:503,json:async()=>({error:'Оператор не подключён'})});
  render(<AssistantChat open onOpenChange={()=>{}} />);
  fireEvent.change(screen.getByLabelText('Ваш вопрос'),{target:{value:'Нужен оператор'}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Позвать оператора'})).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:'Позвать оператора'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Оператор не подключён');
  await waitFor(()=>expect(screen.getByRole('button',{name:'Позвать оператора'})).not.toBeDisabled());
  expect(screen.queryByText(/История передана/)).not.toBeInTheDocument();
});
it('keeps writing to the operator in the same chat and restores the mode on reopen',async()=>{
  const question={status:'PENDING',messages:[{id:'1',text:'Вопрос оператору',isFromAdmin:false}]};
  (fetch as jest.Mock).mockImplementation((url,options)=>{
    if(url==='/api/questions/list')return Promise.resolve({ok:true,json:async()=>({question})});
    return reply(url,options);
  });
  reply.mockResolvedValue({ok:true,json:async()=>({success:true})});
  const {rerender}=render(<AssistantChat open onOpenChange={()=>{}} />);
  expect(await screen.findByLabelText('Сообщение оператору')).toBeEnabled();
  expect(screen.queryByRole('button',{name:'Новый разговор'})).toBeNull();
  fireEvent.change(screen.getByLabelText('Сообщение оператору'),{target:{value:'Дополнение'}});
  fireEvent.click(screen.getByRole('button',{name:'Отправить'}));
  await waitFor(()=>expect(reply).toHaveBeenCalledWith('/api/questions/create',expect.objectContaining({body:JSON.stringify({text:'Дополнение'})})));
  rerender(<AssistantChat open={false} onOpenChange={()=>{}} />);
  rerender(<AssistantChat open onOpenChange={()=>{}} />);
  expect(await screen.findByLabelText('Сообщение оператору')).toBeInTheDocument();
  expect(reply.mock.calls.some(([url])=>url==='/api/assistant/chat')).toBe(false);
});
