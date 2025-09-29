package middleware

import (
	"context"
)

type baggageKey struct{}

func WithBaggage(ctx context.Context, baggage string) context.Context {
	return context.WithValue(ctx, baggageKey{}, baggage)
}

func GetBaggageFromContext(ctx context.Context) string {
	if baggage, ok := ctx.Value(baggageKey{}).(string); ok {
		return baggage
	}
	return ""
}
