package logger

import (
	"context"
	"log/slog"
	"os"

	"worker/internal/middleware"
)

var defaultLogger *slog.Logger

func init() {
	defaultLogger = slog.New(slog.NewJSONHandler(os.Stdout, nil))
}

func logWithBaggage(ctx context.Context, level slog.Level, msg string, args ...any) {
	baggage := middleware.GetBaggageFromContext(ctx)
	if baggage != "" {
		args = append(args, "baggage", baggage)
	}
	defaultLogger.Log(ctx, level, msg, args...)
}

func Info(ctx context.Context, msg string, args ...any) {
	logWithBaggage(ctx, slog.LevelInfo, msg, args...)
}

func Error(ctx context.Context, msg string, args ...any) {
	logWithBaggage(ctx, slog.LevelError, msg, args...)
}

func Warn(ctx context.Context, msg string, args ...any) {
	logWithBaggage(ctx, slog.LevelWarn, msg, args...)
}

func Debug(ctx context.Context, msg string, args ...any) {
	logWithBaggage(ctx, slog.LevelDebug, msg, args...)
}
