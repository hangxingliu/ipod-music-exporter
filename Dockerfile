FROM ubuntu:18.04

RUN export DEBIAN_FRONTEND=noninteractive \
	&& apt-get -qq update \
	&& apt-get install --no-install-recommends --no-install-suggests -y \
		cmake make g++ pkg-config qtbase5-dev libgpod-dev \
	&& true

WORKDIR /workspace/
ADD ./src /workspace/src
ADD ./scripts /workspace/scripts
ADD CMakeLists.txt /workspace

RUN ./scripts/build.sh && ./build/export-manifest
