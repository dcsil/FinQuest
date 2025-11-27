import { describe, it, expect } from 'vitest'
import { getUserDisplayName, getUserInitial } from '@/features/profile/utils/user'
import type { User } from '@supabase/supabase-js'

describe('User Utils', () => {
    describe('getUserDisplayName', () => {
        it('returns full_name from metadata when available', () => {
            const user = {
                user_metadata: { full_name: 'John Doe' },
                email: 'john@example.com',
            } as unknown as User
            expect(getUserDisplayName(user)).toBe('John Doe')
        })

        it('returns email prefix when no full_name', () => {
            const user = {
                email: 'john@example.com',
            } as User
            expect(getUserDisplayName(user)).toBe('john')
        })

        it('returns "User" when no email or name', () => {
            const user = {} as User
            expect(getUserDisplayName(user)).toBe('User')
        })

        it('handles null user', () => {
            expect(getUserDisplayName(null)).toBe('User')
        })

        it('handles undefined user', () => {
            expect(getUserDisplayName(undefined)).toBe('User')
        })
    })

    describe('getUserInitial', () => {
        it('returns uppercase initial from full name', () => {
            const user = {
                user_metadata: { full_name: 'John Doe' },
            } as unknown as User
            expect(getUserInitial(user)).toBe('J')
        })

        it('returns uppercase initial from email', () => {
            const user = {
                email: 'john@example.com',
            } as User
            expect(getUserInitial(user)).toBe('J')
        })

        it('returns "U" when no user data', () => {
            expect(getUserInitial(null)).toBe('U')
            expect(getUserInitial(undefined)).toBe('U')
        })
    })
})

