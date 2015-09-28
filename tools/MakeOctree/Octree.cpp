#include "Octree.h"

#include <algorithm>
#include <string>
#include <sstream>
#include <iostream>
#include <fstream>
#include <chrono>
#include <random>
#include <cstring>

#include <glm/gtx/io.hpp>


static std::string getJSONString(const AABB& bbox)
{
	std::stringstream ss;

	ss << "{ \"min\":[" << bbox.min.x << "," << bbox.min.y << "," << bbox.min.z << "], \"max\":[" << bbox.max.x << "," << bbox.max.y << "," << bbox.max.z << "]}";
	return ss.str();
}

Octree::Octree(const Pointcloud& pc, Octree* pn) : points(pc), parent(pn)
{
	for (int i = 0; i < 8; ++i)
		children[i] = nullptr;

	this->aabb.reset();


	for (size_t i = 0; i < points.size(); ++i)
	{
		aabb.extend(points[i]);
	}

}

Octree::~Octree()
{
	for (int i = 0; i < 8; ++i)
		delete children[i];
}

bool Octree::hasChildren() const
{
	for (int i = 0; i < 8; ++i)
		if (children[i])
			return true;

	return false;
}


void Octree::build(const SplitConfig& config, const std::string& basename)
{
	if (this->hasChildren())
		return;

	std::cout << "[Octree] Building octree ";
	recurseSplit(this, config);
	std::cout << " done.\n";
	
	std::cout << "[Octree] Saving tree structure to \"" << basename + ".json ... \n";

	recurseSave(this);

	// save tree structure
	std::ofstream jsonFile(basename + ".json");
	jsonFile << "[\n";

	jsonFile << recurseBuildJSON(this);


	jsonFile << "\n]";



}

// Fisher-Yates shuffle, Sattolo Variant
void Octree::shuffle()
{
	std::mt19937 rng; // ((unsigned int)std::chrono::system_clock::now().time_since_epoch().count());

	size_t i = points.size() - 1;
	while (i > 1)
	{
		--i;

		unsigned int j = rng() % (unsigned int)points.size();
		std::swap(points[i], points[j]);

	}		
}


void Octree::split(const SplitConfig& config)
{
	//std::cout << "Splitting node with " << points.size() << " points ...\n";
	std::cout << ".";

	const glm::vec3 center = aabb.getCentroid();

	// the new sectors
	Pointcloud	sectors[8];


	std::random_shuffle(points.begin(), points.end());

	// select n points to keep in this node

	Pointcloud temp(points.begin() + config.maxNodeSize, points.end());
	points.resize(config.maxNodeSize);


	for (size_t i = 0; i < temp.size(); ++i)
	{
		const Point& p = temp[i];

		if (p.y > center.y)
		{
			if (p.x < center.x)
			{
				if (p.z < center.z)
					sectors[0].push_back(p);
				else
					sectors[1].push_back(p);
			}
			else
			{
				if (p.z < center.z)
					sectors[3].push_back(p);
				else
					sectors[2].push_back(p);

			}
		}
		else
		{
			if (p.x < center.x)
			{
				if (p.z < center.z)
					sectors[4].push_back(p);
				else
					sectors[5].push_back(p);
			}
			else
			{
				if (p.z < center.z)
					sectors[7].push_back(p);
				else
					sectors[6].push_back(p);
			}
		}
	}

	/*
	std::cout << "Sectors: \n";
	for (int i = 0; i < 8; ++i)
	std::cout << "sectors[" << i << "]: " << sectors[i].size() << std::endl;
	*/

	int childCount = 0;
	for (int i = 0; i < 8; ++i)
	{
		if (!sectors[i].empty())
		{
			if (sectors[i].size() > config.minNodeSize)
			{

				++childCount;
				this->children[i] = new Octree(sectors[i], this);

			}
			else
			{
				// if the child node has too few points, push them back onto the parent again

				points.insert(points.end(), sectors[i].begin(), sectors[i].end());
				//std::cout << "Split resulted in node with too few points (" << sectors[i].size() << "), discarding ... \n";

			}
		}
	}

	//std::cout << "Created " << childCount << " children.\n";
}

void Octree::recurseSplit(Octree* node, const SplitConfig& config)
{
	node->split(config);
	
	for (unsigned int i = 0; i < 8; ++i)
	{
		if (node->children[i])
		{

			if (node->children[i]->points.size() > config.maxNodeSize)
				recurseSplit(node->children[i], config);
		}
	}
}
void Octree::recurseSave(const Octree* node)
{
	std::string filename = node->getNodename() + ".blob";

	std::ofstream ofile(filename.c_str(), std::ios::binary | std::ios::trunc);
	assert(ofile.is_open());

	// write the data
	ofile.write(reinterpret_cast<const char*>(&node->points[0]), sizeof(Point)*node->points.size());


	for (int i = 0; i < 8; ++i)
	{
		if (node->children[i])
			recurseSave(node->children[i]);
	}


}

std::string Octree::recurseBuildJSON(const Octree* node)
{
	std::string result;
	result += node->getJSONEntry();
	for (int i = 0; i < 8; ++i)
	{
		if (node->children[i])
		{
			result += ",\n";
			result += recurseBuildJSON(node->children[i]);
		}
	}

	return result;
}

std::string Octree::getNodename() const
{
	// find path to parent and create name
	std::vector<int> path;

	const Octree* cn = this;
	while (cn->parent)
	{
		const Octree* pn = cn->parent;
		for (int i = 0; i < 8; ++i)
		{
			// reverse look-up
			if (pn->children[i] == cn)
			{
				path.push_back(i);
				break;
			}
		}
		cn = pn;
	}
	
	if (!path.empty())
	{
		std::reverse(path.begin(), path.end());

		char pathstring[256];
		memset(pathstring, 0, 256);

		for (size_t i = 0; i < path.size(); ++i)
		{
			// int to ascii char conversion
			pathstring[i] = 48 + path[i];
		}
		

		return "node-" + std::string(pathstring);
	}
	else
		return "node-root";

}

// old version?
std::string Octree::getJSONEntry() const
{
	std::stringstream ss;

	ss << "{\n";

	// write the parent
	ss << "\"parent\":" << (parent ? "\"" + parent->getNodename() + "\"" : "null") << ",\n";
	ss << "\"file\":\"" << getNodename() << "\",\n";

	ss << "\"points\":" << points.size() << ",\n";


	// write the bbox
	ss << "\"bbox\":" << getJSONString(this->aabb) << ",\n";

	// write the children here
	if (this->hasChildren())
	{

		ss << "\"children\":[";
		for (int i = 0; i < 8; ++i)
		{
			if (children[i])
				ss << "\"" << children[i]->getNodename() << "\"";
			else
				ss << "null";

			if (i < 7)
				ss << ", ";
		}
		ss << "]\n";

	}
	else
		ss << "\"children\":null";

	ss << "}";

	return ss.str();

}
