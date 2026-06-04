import { render, screen } from '@testing-library/react'
import { QuickActionCard } from '@/components/QuickActionCard'
import { useSession } from 'next-auth/react'

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

    expect(screen.getAllByText('Передать показания').length).toBeGreaterThan(0)
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

  it('renders public access emergency card without alarm card chrome', () => {
    const { container } = render(
      <QuickActionCard
        iconName="AlertTriangle"
        title="Emergency Card"
        description="Emergency description"
        href="/emergency"
        publicAccess={true}
        isEmergency
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/emergency')
    expect(container.querySelector('.border-red-500')).not.toBeInTheDocument()
    expect(container.querySelector('.bg-red-50')).not.toBeInTheDocument()
    expect(container.querySelector('.text-red-500')).toBeInTheDocument()
    expect(container.querySelector('.border-red-600')).toBeInTheDocument()
    expect(container.querySelector('.bg-red-600')).not.toBeInTheDocument()
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
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })
})
