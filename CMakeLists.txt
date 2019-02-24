cmake_minimum_required(VERSION 2.8)

# ===============================
# project and cpp options
# ===============================
project(ipod-music-exporter)
set(BIN_EXPORT_MANIFEST export-manifest)

# build static binary
# set(CMAKE_FIND_LIBRARY_SUFFIXES ".a")
# set(BUILD_SHARED_LIBS OFF)
# set(CMAKE_EXE_LINKER_FLAGS "-static")

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -std=c++11")

configure_file(src/main-export-music.js ${CMAKE_BINARY_DIR}/export-music.js COPYONLY)
add_executable(${BIN_EXPORT_MANIFEST} src/main-export-manifest.cpp)

# ===============================
# dependencies
# ===============================
# libgpod
include(FindPkgConfig)
pkg_search_module(LIBGPOD REQUIRED libgpod-1.0)

# Qt core
find_package(Qt5Core REQUIRED)

target_include_directories(${BIN_EXPORT_MANIFEST} PRIVATE ${Qt5Core_INCLUDE_DIRS} ${LIBGPOD_INCLUDE_DIRS})
target_link_libraries(${BIN_EXPORT_MANIFEST} PRIVATE ${Qt5Core_LIBRARIES} ${LIBGPOD_LIBRARIES} )
