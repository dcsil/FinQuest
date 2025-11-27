-- Migration: Add gamification tables
-- Created: 2025-01-XX
-- Description: Adds user_gamification_stats, badge_definitions, and user_badges tables

-- Create user_gamification_stats table
CREATE TABLE IF NOT EXISTS user_gamification_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    last_streak_date DATE,
    total_modules_completed INTEGER NOT NULL DEFAULT 0,
    total_quizzes_completed INTEGER NOT NULL DEFAULT 0,
    total_portfolio_positions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_gamification_stats_user ON user_gamification_stats (user_id);
CREATE INDEX IF NOT EXISTS ix_gamification_stats_user ON user_gamification_stats (user_id);

-- Create badge_definitions table
CREATE TABLE IF NOT EXISTS badge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_badge_code ON badge_definitions (code);
CREATE INDEX IF NOT EXISTS ix_badge_code ON badge_definitions (code);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge_definitions (id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, badge_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_badge ON user_badges (user_id, badge_id);
CREATE INDEX IF NOT EXISTS ix_user_badges_user ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS ix_user_badges_badge ON user_badges (badge_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_gamification_stats_updated_at
    BEFORE UPDATE ON user_gamification_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

