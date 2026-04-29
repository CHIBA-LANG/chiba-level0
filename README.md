# usage

[![chiba-ci](https://github.com/CHIBA-LANG/chiba-level0/actions/workflows/ci.yml/badge.svg)](https://github.com/CHIBA-LANG/chiba-level0/actions/workflows/ci.yml)

1. has `gcc`
2. download main.o from releases https://github.com/CHIBA-LANG/chiba-level0/releases
3. ./main.o --project .

## macOS development note

Before the portable C backend is complete, run the compiler through the Linux amd64 container on macOS:

```sh
podman run --platform linux/amd64 --rm -v $(pwd):/project -it chibac-level0:v0.6.13 /chibac --project /project
```

The current default backend emits Linux-oriented amd64 assembly, so this container path is the supported macOS workflow for now.
