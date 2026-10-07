# Build
FROM golang:1.24-alpine AS builder

WORKDIR /src

RUN apk add --no-cache git ca-certificates

# Dependency layer: only re-downloaded when the manifests change.
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server .

# Runtime
FROM alpine:3.21

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /out/server ./server
COPY --from=builder /src/config ./config

EXPOSE 8080
ENV ENVIRONMENT=production

CMD ["./server", "http"]
