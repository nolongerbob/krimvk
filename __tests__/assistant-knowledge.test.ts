/** @jest-environment node */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { VISITOR_KNOWLEDGE, publicAssistantKnowledge } from '@/lib/visitor-assistant-knowledge';
import { ASSISTANT_LINKS } from '@/lib/visitor-assistant';

it('keeps unique topics and traceable source files',()=>{
  expect(new Set(VISITOR_KNOWLEDGE.map(x=>x.id)).size).toBe(VISITOR_KNOWLEDGE.length);
  for(const entry of VISITOR_KNOWLEDGE)for(const source of entry.sources)expect(existsSync(join(process.cwd(),source))).toBe(true);
});
it('only uses supported help links and includes every topic in the prompt',()=>{
  const context=publicAssistantKnowledge();
  for(const entry of VISITOR_KNOWLEDGE)expect(context).toContain(entry.text);
  for(const match of Array.from(context.matchAll(/\/[a-z-]+(?:\/[a-z-]+)*/g))) {
    // Only paths, not slash-separated Russian alternatives.
    expect(ASSISTANT_LINKS[match[0]]).toBeDefined();
  }
});
it('documents account-password distinction and unsupported changes',()=>{
  const context=publicAssistantKnowledge();
  expect(context).toContain('НЕ восстанавливает пароль 1С');
  expect(context).toContain('нельзя самостоятельно отредактировать');
  expect(context).toContain('не рекомендуй платить повторно');
});
