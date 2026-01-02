/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/water-quality/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    waterQualityDistrict: {
      findMany: jest.fn(),
    },
  },
}))

describe('/api/water-quality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns water quality data successfully', async () => {
    const { prisma } = require('@/lib/prisma')
    
    const mockData = [
      {
        id: '1',
        name: 'Test District',
        cities: [
          {
            id: '1',
            name: 'Test City',
            years: [
              {
                id: '1',
                year: 2024,
                documents: [],
              },
            ],
          },
        ],
      },
    ]

    prisma.waterQualityDistrict.findMany.mockResolvedValue(mockData)

    const request = new NextRequest('http://localhost:3000/api/water-quality')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Test District')
  })

  it('handles errors gracefully', async () => {
    const { prisma } = require('@/lib/prisma')
    
    prisma.waterQualityDistrict.findMany.mockRejectedValue(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/water-quality')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error')
  })
})

