#include "AABB.h"

#ifndef NO_GRAPHICS
#include <GL/glew.h>
#include <GL/gl.h>
#endif

#include <limits>

#include <glm/gtc/type_ptr.hpp>
#include <glm/gtc/matrix_access.hpp>

AABB::ClipResult AABB::isVisible(const glm::mat4& mvp) const
{
	using namespace glm;

	// create the eight vertices of the bounding box
	vec4 vertices[] = {	vec4(min.x, min.y, min.z, 1.f),
						vec4(min.x, min.y, max.z, 1.f),
						vec4(max.x, min.y, max.z, 1.f),
						vec4(max.x, min.y, min.z, 1.f),
						vec4(min.x, max.y, min.z, 1.f),
						vec4(min.x, max.y, max.z, 1.f),
						vec4(max.x, max.y, max.z, 1.f),
						vec4(max.x, max.y, min.z, 1.f)};


	/* simple solution -- does not work for close objects
	for (int i = 0; i < 8; ++i)
	{
		vec4 v = mvp * vertices[i];

		if (v.x >= -v.w && v.x <= v.w &&
			v.y >= -v.w && v.y <= v.w && 
			v.z >= -v.w && v.z <= v.w)
			return INSIDE;

	}

	return OUTSIDE;
	*/





	/* the six planes, based on manually extracting the mvp columns from clip space coordinates, as seen here:
		http://www.lighthouse3d.com/tutorials/view-frustum-culling/clip-space-approach-extracting-the-planes/
		Note that the article's matrix is in row-major format and therefore has to be switched. See also:
		http://www.cs.otago.ac.nz/postgrads/alexis/planeExtraction.pdf
	*/
	vec4 row3 = row(mvp, 3);
	vec4 planes[] = 
	{
		 row(mvp, 0) + row3,
		-row(mvp, 0) + row3,
		 row(mvp, 1) + row3,
		-row(mvp, 1) + row3,
		 row(mvp, 2) + row3,
		-row(mvp, 2) + row3
	};

	
	ClipResult result = INSIDE;
	for (int i = 0; i < 6; ++i)
	{
		int out = 0;
		int in = 0;

		for (int j = 0; j < 8; ++j)
		{
			float d = dot(planes[i], vertices[j]);
			
			if (d < 0.f)
				++out;
			else
				++in;
		}

		if (!in)
			return OUTSIDE;
		else if (out > 0)
			result = INTERSECT;
	}

	return result;

}

#ifndef NO_GRAPHICS
void AABB::draw() const
{
	using namespace glm;

	vec4 vertices[] = {	vec4(min.x, min.y, min.z, 1.f),
						vec4(min.x, min.y, max.z, 1.f),
						vec4(max.x, min.y, max.z, 1.f),
						vec4(max.x, min.y, min.z, 1.f),
						vec4(min.x, max.y, min.z, 1.f),
						vec4(min.x, max.y, max.z, 1.f),
						vec4(max.x, max.y, max.z, 1.f),
						vec4(max.x, max.y, min.z, 1.f)};
	
	static const unsigned char indices[] = 
	{
		0,1,1,2,2,3,3,0, 
		4,5,5,6,6,7,7,4,
		0,4,1,5,2,6,3,7
	};


	glEnableClientState(GL_VERTEX_ARRAY);
	glVertexPointer(4, GL_FLOAT, 0, value_ptr(vertices[0]));

	glDrawElements(GL_LINES, 24, GL_UNSIGNED_BYTE, indices);

	glDisableClientState(GL_VERTEX_ARRAY);

}
#endif // NO_GRAPHICS


void AABB::extend(const glm::vec3& pt)
{
	this->min = glm::min(this->min, pt);
	this->max = glm::max(this->max, pt);
}

void AABB::reset()
{
	this->min = glm::vec3(std::numeric_limits<float>::max());
	this->max = glm::vec3(std::numeric_limits<float>::lowest());
}

bool AABB::isIntersectedByRay(const glm::vec3& o, const glm::vec3& v) const
{
	// see 'Essential Math ..., 12.3, pg. 567f

	float maxS = 0.f;
	float minT = std::numeric_limits<float>::max();

	// test yz planes
	float s, t;

	glm::vec3 r = glm::vec3(1.f) / v;
	if (r.x >= 0.f)
	{
		s = (min.x - o.x) * r.x;
		t = (max.x - o.x) * r.x;
	}
	else
	{
		s = (max.x - o.x) * r.x;
		t = (min.x - o.x) * r.x;
	}

	maxS = glm::max(s, maxS);
	minT = glm::min(t, minT);

	if (maxS > minT)
		return false;


	// test xz planes
	if (r.y >= 0.f)
	{
		s = (min.y - o.y) * r.y;
		t = (max.y - o.y) * r.y;
	}
	else
	{
		s = (max.y - o.y) * r.y;
		t = (min.y - o.y) * r.y;
	}

	maxS = glm::max(s, maxS);
	minT = glm::min(t, minT);

	if (maxS > minT)
		return false;


	// test xy planes
	if (r.z >= 0.f)
	{
		s = (min.z - o.z) * r.z;
		t = (max.z - o.z) * r.z;
	}
	else
	{
		s = (max.z - o.z) * r.z;
		t = (min.z - o.z) * r.z;
	}

	maxS = glm::max(s, maxS);
	minT = glm::min(t, minT);

	if (maxS > minT)
		return false;


	return true;
}
