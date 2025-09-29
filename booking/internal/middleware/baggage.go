package middleware

import (
	"context"
	"net/http"
)

type contextKey string

const BaggageContextKey contextKey = "baggage"

func BaggageMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		baggage := r.Header.Get("baggage")

		ctx := context.WithValue(r.Context(), BaggageContextKey, baggage)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}

func GetBaggageFromContext(ctx context.Context) string {
	if baggage, ok := ctx.Value(BaggageContextKey).(string); ok {
		return baggage
	}
	return ""
}
