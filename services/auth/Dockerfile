FROM golang:1.21.8-alpine as builder

WORKDIR /app

COPY . .

RUN go build -o auth .

FROM alpine:latest

COPY --from=builder /app/auth .

CMD ["./auth"]
