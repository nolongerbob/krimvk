# Тестирование

Проект использует Jest и React Testing Library для unit-тестов.

## Установка

Зависимости уже установлены в `package.json`.

## Запуск тестов

```bash
# Запустить все тесты
npm test

# Запустить тесты в watch режиме
npm run test:watch

# Запустить тесты с покрытием
npm run test:coverage
```

## Структура тестов

Тесты находятся в папке `__tests__/`:

- `__tests__/components/` - тесты компонентов
- `__tests__/lib/` - тесты утилит
- `__tests__/api/` - тесты API routes

## Примеры тестов

### Тест компонента

```typescript
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Тест API route

```typescript
/**
 * @jest-environment node
 */
import { GET } from '@/app/api/my-route/route'

describe('/api/my-route', () => {
  it('returns data successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/my-route')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

## Моки

В `jest.setup.js` настроены моки для:
- Next.js router (`useRouter`, `usePathname`, `useSearchParams`)
- Next.js Image
- next-auth (`useSession`)

## Покрытие кода

Цель покрытия: минимум 70% для критичных компонентов.

Файлы исключены из покрытия:
- `*.d.ts` (типы)
- `node_modules/`
- `.next/`
- `coverage/`

