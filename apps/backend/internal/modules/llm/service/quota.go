package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/robzlabz/employeebot/apps/backend/internal/modules/llm/domain"
)

// Check rejects a call when the workspace has spent its token allowance. It is
// the pre-flight guard: the provider is not called, so nothing is billed.
//
// The check is only as strict as the configured policy: a zero allowance means
// unlimited, which is what a deployment without subscriptions runs with, and
// QuotaEnabled=false skips the check entirely for local development.
func (s *Service) Check(ctx context.Context, workspaceID uuid.UUID) error {
	if s == nil || !s.settings.QuotaEnabled {
		return nil
	}
	if workspaceID == uuid.Nil {
		return fmt.Errorf("%w: workspace is required", domain.ErrInvalidRequest)
	}
	if s.deps.Quota == nil {
		// Running with the check enabled but no policy would silently allow
		// everything, so it is an error instead.
		return fmt.Errorf("llm: quota is enabled but no policy is configured")
	}

	allowance, err := s.deps.Quota.Allowance(ctx, workspaceID)
	if err != nil {
		return fmt.Errorf("llm: read quota allowance: %w", err)
	}
	if allowance <= 0 {
		return nil
	}

	spent, err := s.spent(ctx, workspaceID)
	if err != nil {
		return err
	}
	if spent >= allowance {
		return fmt.Errorf("%w: %d dari %d token terpakai pada periode ini", domain.ErrQuotaExceeded, spent, allowance)
	}

	return nil
}

// spent reads the live token total.
//
// The counter in Redis is the fast path. When it is unavailable the ledger
// answers instead: an outage must not hand every workspace a fresh allowance.
func (s *Service) spent(ctx context.Context, workspaceID uuid.UUID) (int64, error) {
	if s.deps.Counter != nil {
		total, err := s.deps.Counter.Spent(ctx, workspaceID)
		if err == nil {
			return total, nil
		}
		if s.deps.Reader == nil {
			return 0, fmt.Errorf("llm: read live spend: %w", err)
		}
	}

	if s.deps.Reader == nil {
		return 0, fmt.Errorf("llm: no usage reader is configured")
	}

	total, err := s.deps.Reader.SumSince(ctx, workspaceID, PeriodStart(s.now()))
	if err != nil {
		return 0, fmt.Errorf("llm: sum ledger usage: %w", err)
	}
	return total, nil
}

// PeriodStart is the first moment of the current quota period: the start of the
// month in Jakarta. It is exported so the counter and the check cannot disagree
// about which period a token belongs to.
func PeriodStart(now time.Time) time.Time {
	jakarta := now.In(Jakarta)
	return time.Date(jakarta.Year(), jakarta.Month(), 1, 0, 0, 0, 0, Jakarta)
}
