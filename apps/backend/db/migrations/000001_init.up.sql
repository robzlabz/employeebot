-- Bootstrap schema for Employee Bot.
-- The users table is the auth stub for issue #1; later migrations add
-- companies, bots, groups, memory, secrets and billing tables.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
