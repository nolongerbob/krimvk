import { render, screen } from '@testing-library/react'
import { QuickActionCard } from '@/components/QuickActionCard'
import { useSession } from 'next-auth/react'

// Mock useSession
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('QuickActionCard', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1', email: 'test@test.com' } },
      status: 'authenticated',
    })
  })

  it('renders card with title and description', () => {
    render(
      <QuickActionCard
        iconName="Droplet"
        title="Передать показания"
        description="Передать показания счетчиков воды"
        href="/dashboard/meters"
      />
    )

    expect(screen.getByText('Передать показания')).toBeInTheDocument()
    expect(screen.getByText('Передать показания счетчиков воды')).toBeInTheDocument()
  })

  it('renders as a link with correct href when authenticated', () => {
    render(
      <QuickActionCard
        iconName="Droplet"
        title="Test Card"
        description="Test description"
        href="/test-path"
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test-path')
  })

  it('renders public access card correctly', () => {
    render(
      <QuickActionCard
        iconName="AlertTriangle"
        title="Emergency Card"
        description="Emergency description"
        href="/emergency"
        publicAccess={true}
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/emergency')
  })

  it('applies custom icon color', () => {
    const { container } = render(
      <QuickActionCard
        iconName="Droplet"
        title="Test Card"
        description="Test description"
        href="/test"
        iconColor="text-blue-500"
      />
    )

    const icon = container.querySelector('.text-blue-500')
    expect(icon).toBeInTheDocument()
  })

  it('renders with primary styling when isPrimary is true', () => {
    render(
      <QuickActionCard
        iconName="Droplet"
        title="Primary Card"
        description="Primary description"
        href="/test"
        isPrimary={true}
      />
    )

    const card = screen.getByText('Primary Card').closest('a')
    expect(card).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(
      <QuickActionCard
        iconName="Droplet"
        title="Test Card"
        description="Test description"
        href="/test"
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/login')
    expect(screen.getByText('Войти для доступа')).toBeInTheDocument()
  })
})

