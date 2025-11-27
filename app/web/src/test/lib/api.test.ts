import { describe, it, expect, vi, beforeEach } from 'vitest'
import { portfolioApi, usersApi, modulesApi, gamificationApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
        },
    },
}))

global.fetch = vi.fn()

describe('API Client', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
            data: {
                session: {
                    access_token: 'test-token',
                } as any,
            },
            error: null,
        })
    })

    describe('portfolioApi', () => {
        it('adds position', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ id: '1', symbol: 'AAPL', quantity: 10, avgCost: 180 }),
            } as Response)
            const result = await portfolioApi.addPosition({
                symbol: 'AAPL',
                quantity: 10,
                avgCost: 180,
            })
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/portfolio/positions'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token',
                    }),
                })
            )
            expect(result).toEqual({ id: '1', symbol: 'AAPL', quantity: 10, avgCost: 180 })
        })

        it('gets portfolio', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ holdings: [], totalValue: 0 }),
            } as Response)
            await portfolioApi.getPortfolio()
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/portfolio'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token',
                    }),
                })
            )
        })

        it('gets snapshots with query params', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ snapshots: [] }),
            } as Response)
            await portfolioApi.getSnapshots('2024-01-01', '2024-01-31', 'daily')
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/portfolio/snapshots?from=2024-01-01&to=2024-01-31&granularity=daily'),
                expect.any(Object)
            )
        })

        it('generates snapshot', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ status: 'success', message: 'Generated', count: 1 }),
            } as Response)
            await portfolioApi.generateSnapshot('2024-01-01', '2024-01-31')
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/portfolio/snapshots/generate?from=2024-01-01&to=2024-01-31'),
                expect.objectContaining({
                    method: 'POST',
                })
            )
        })
    })

    describe('usersApi', () => {
        it('gets onboarding status', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ completed: true }),
            } as Response)
            const result = await usersApi.getOnboardingStatus()
            expect(result).toEqual({ completed: true })
        })

        it('gets financial profile', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ risk_tolerance: 'moderate' }),
            } as Response)
            await usersApi.getFinancialProfile()
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/users/financial-profile'),
                expect.any(Object)
            )
        })

        it('updates financial profile', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            } as Response)
            await usersApi.updateFinancialProfile({ risk_tolerance: 'aggressive' })
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/users/financial-profile'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ risk_tolerance: 'aggressive' }),
                })
            )
        })

        it('gets suggestions', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ([]),
            } as Response)
            await usersApi.getSuggestions()
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/users/suggestions'),
                expect.any(Object)
            )
        })
    })

    describe('modulesApi', () => {
        it('gets module', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ id: 'module-1', title: 'Test Module' }),
            } as Response)
            await modulesApi.getModule('module-1')
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/modules/module-1'),
                expect.any(Object)
            )
        })

        it('submits attempt', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({ success: true }),
            } as Response)
            await modulesApi.submitAttempt('module-1', 8, 10, true)
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/v1/modules/module-1/attempt'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ score: 8, max_score: 10, passed: true }),
                })
            )
        })
    })

    describe('gamificationApi', () => {
        it('sends event', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({
                    total_xp: 500,
                    level: 3,
                    current_streak: 5,
                    xp_gained: 10,
                    level_up: false,
                    streak_incremented: false,
                    new_badges: [],
                    xp_to_next_level: 100,
                }),
            } as Response)
            await gamificationApi.sendEvent({ event_type: 'login' })
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/gamification/event'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ event_type: 'login' }),
                })
            )
        })

        it('gets state', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ({
                    total_xp: 500,
                    level: 3,
                    current_streak: 5,
                    xp_to_next_level: 100,
                    badges: [],
                }),
            } as Response)
            await gamificationApi.getState()
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/gamification/me'),
                expect.any(Object)
            )
        })

        it('gets badges', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ([]),
            } as Response)
            await gamificationApi.getBadges()
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/gamification/badges'),
                expect.any(Object)
            )
        })
    })

    describe('error handling', () => {
        it('throws error when not authenticated', async () => {
            vi.mocked(supabase.auth.getSession).mockResolvedValue({
                data: { session: null },
                error: null,
            })
            await expect(portfolioApi.getPortfolio()).rejects.toThrow('Not authenticated')
        })

        it('throws error on API error response', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: false,
                statusText: 'Bad Request',
                json: async () => ({ detail: 'Invalid request' }),
            } as Response)
            await expect(portfolioApi.getPortfolio()).rejects.toThrow('Invalid request')
        })

        it('handles JSON parse error', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
                json: async () => {
                    throw new Error('Invalid JSON')
                },
            } as Response)
            await expect(portfolioApi.getPortfolio()).rejects.toThrow('Internal Server Error')
        })
    })
})

