FROM alpine:latest
WORKDIR /
RUN apk add --no-cache build-base
COPY chibac .
RUN chmod +x chibac

# run with
# podman build  --platform linux/amd64 -t chibac-level0:v0.6.13 -t chibac-level0:latest . 

# macOS note: before the C backend is complete, use the linux/amd64 container
# because the current amd64 asm backend is Linux-oriented.
# test with mount current dir to /project
# and run /chibac --project /project
# podman run --platform linux/amd64 --rm -v $(pwd):/project -it chibac-level0:v0.6.13 /chibac --project /project
