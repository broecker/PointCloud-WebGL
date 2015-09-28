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

#ifndef POINT_INCLUDED
#define POINT_INCLUDED

#include <vector>
#include <glm/glm.hpp>


struct Point
{
	// position;
	float x, y, z;

	union
	{
		struct
		{
			unsigned char	r, g, b, a;
		};

		unsigned char	_data[4];
		float			_padding;
	};


	
	operator glm::vec3 () const
	{
		return glm::vec3(x, y, z);
	}
	
};


struct Normal8b
{
	char		x, y, z;
		
	operator glm::vec3 () const
	{
		return glm::vec3((float)x / 255.f, (float)y / 255.f, (float)z / 255.f);
	}
};

typedef std::vector<Point>	Pointcloud;
typedef std::vector<Normal8b> Normalcloud;

typedef std::vector<unsigned int> Indexcloud;

#endif
