// Package domain defines the auth use case contract.
//
// TODO: signup/login — issue #1 (auth) and #2 (multi-company onboarding).
package domain

import "context"

// UseCase is the auth use case contract implemented by the auth service.
type UseCase interface {
	// Signup registers a new owner account and returns an authenticated session.
	Signup(ctx context.Context, req *SignupRequest) (*Session, error)
	// Login authenticates an owner account and returns an authenticated session.
	Login(ctx context.Context, req *LoginRequest) (*Session, error)
}

// SignupRequest is the payload for UseCase.Signup.
type SignupRequest struct {
	Email    string
	Password string
}

// LoginRequest is the payload for UseCase.Login.
type LoginRequest struct {
	Email    string
	Password string
}

// Session is the result of a successful signup/login.
type Session struct {
	Token string
}
