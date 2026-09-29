import { assistantTextParts } from '@/lib/visitor-assistant';
it('renders a friendly known link from markdown',()=>{
  expect(assistantTextParts('Откройте [сюда](/dashboard/meters).')).toEqual([
    {text:'Откройте '},{text:'Передать показания',href:'/dashboard/meters'},{text:'.'},
  ]);
});
it('also replaces bare routes in earlier answers and preserves punctuation',()=>{
  expect(assistantTextParts('Здесь /dashboard/meters.')).toEqual([
    {text:'Здесь '},{text:'Передать показания',href:'/dashboard/meters'},{text:'.'},
  ]);
});
it.each(['[Вход](https://evil.test)','[Вход](javascript:alert(1))','/admin','/dashboard/meters?redirect=evil','https://evil.test/dashboard/meters'])('does not create untrusted links: %s',text=>{
  expect(assistantTextParts(text).some(p=>p.href)).toBe(false);
});
