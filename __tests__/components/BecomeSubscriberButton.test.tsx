import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BecomeSubscriberButton } from '@/components/BecomeSubscriberButton'

// Mock useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('BecomeSubscriberButton', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders button with correct text', () => {
    render(<BecomeSubscriberButton />)
    expect(screen.getByText(/стать абонентом/i)).toBeInTheDocument()
  })

  it('navigates to correct page on click', async () => {
    const user = userEvent.setup()
    render(<BecomeSubscriberButton />)

    const button = screen.getByText(/стать абонентом/i)
    await user.click(button)

    expect(mockPush).toHaveBeenCalledWith('/stat-abonentom')
  })

  it('applies custom className', () => {
    const { container } = render(
      <BecomeSubscriberButton className="custom-class" />
    )

    const button = container.querySelector('.custom-class')
    expect(button).toBeInTheDocument()
  })
})

