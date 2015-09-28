cmake_minimum_required (VERSION 2.6)

# setup project info
project (makeOctree)

set (makeOctree_VERSION_MIN_VERSION_MAJ 1)
set (makeOctree_VERSION_MIN_VERSION_MIN 0)

include_directories("${PROJECT_BINARY_DIR}" ".")
include_directories("${PROJECT_BINARY_DIR}" "/usr/local/include")


# add boost
set(Boost_USE_MULTITHREAD ON) #set a flag
find_package (Boost)
include_directories(${include_directories} ${Boost_INCLUDE_DIRS})
link_directories(${link_directories} ${Boost_LIBRARY_DIRS})

# add glm
find_package(GLM)
include_directories(${GLM_INCLUDE_DIRS})


# set no-graphis
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DNO_GRAPHICS -DNO_TIMER -Wall -std=c++0x -fopenmp")

# set recent g++ on the cluster
# set(CMAKE_CXX_COMPILER "g++-4.7")

# add source file to executable
add_executable(makeOctree main.cpp Octree.cpp AABB.cpp)
target_link_libraries (makeOctree)


