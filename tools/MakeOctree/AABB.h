
/*
The MIT License (MIT)

Copyright (c) 2015 Markus Broecker <broecker@wisc.edu>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

#ifndef AABB_INCLUDED
#define AABB_INCLUDED

#include <glm/glm.hpp>

/// Minimal axis-aligned bounding box
struct AABB
{
	glm::vec3	min, max;
	
	enum ClipResult
	{
		OUTSIDE=0,
		INSIDE,
		INTERSECT
	};

	ClipResult isVisible(const glm::mat4& mvp) const;
	void draw() const;

	void reset();
	void extend(const glm::vec3& pt);

	/// checks if the ray, defined by the origin o and vector v intersects this box
	bool isIntersectedByRay(const glm::vec3& o, const glm::vec3& v) const;

	inline glm::vec3 getCentroid() const { return (min + max)*0.5f; }

	inline float getSpanLength() const { return glm::length(max-min); }



};




#endif
