package logger

import (
	"context"
	"log/slog"
	"os"

	"booking/internal/middleware"
)

var defaultLogger *slog.Logger

func init() {
	defaultLogger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
}

func Info(ctx context.Context, msg string, args ...any) {
	logWithBaggage(ctx, slog.LevelInfo, msg, args...)
}

func Error(ctx context.Context, msg string, args ...any) {
	logWithBaggage(ctx, slog.LevelError, msg, args...)
}

func Debug(ctx context.Context, msg string, args ...any) {
	logWithBaggage(ctx, slog.LevelDebug, msg, args...)
}

func Warn(ctx context.Context, msg string, args ...any) {
	logWithBaggage(ctx, slog.LevelWarn, msg, args...)
}

func logWithBaggage(ctx context.Context, level slog.Level, msg string, args ...any) {
	baggage := middleware.GetBaggageFromContext(ctx)

	logArgs := make([]any, 0, len(args)+2)
	if baggage != "" {
		logArgs = append(logArgs, "baggage", baggage)
	}
	logArgs = append(logArgs, args...)

	defaultLogger.Log(ctx, level, msg, logArgs...)
}
