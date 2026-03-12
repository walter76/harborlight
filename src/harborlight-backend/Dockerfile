# ── Build stage ────────────────────────────────────────────────────────────────
FROM rust:1.86-slim AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
RUN cargo build --release

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/harborlight-backend /usr/local/bin/harborlight-backend

EXPOSE 8083
ENV RUST_LOG=info

CMD ["harborlight-backend"]