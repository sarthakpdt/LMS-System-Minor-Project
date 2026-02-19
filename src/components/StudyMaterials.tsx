import { useState } from 'react';
import { Search, Plus, FolderOpen, FileText, Video, Image, Download, Eye, Upload } from 'lucide-react';

const materialsData = [
  { 
    id: 1, 
    title: 'Calculus Chapter 5 - Integration', 
    course: 'Mathematics 101', 
    type: 'PDF', 
    size: '2.4 MB', 
    uploadedBy: 'Dr. Sarah Johnson',
    uploadedDate: '2026-01-20',
    downloads: 142,
    category: 'Lecture Notes'
  },
  { 
    id: 2, 
    title: 'Physics Lab Safety Guidelines', 
    course: 'Physics 202', 
    type: 'PDF', 
    size: '1.1 MB', 
    uploadedBy: 'Prof. Michael Chen',
    uploadedDate: '2026-01-18',
    downloads: 98,
    category: 'Guidelines'
  },
  { 
    id: 3, 
    title: 'Organic Chemistry Reactions Video', 
    course: 'Chemistry 301', 
    type: 'Video', 
    size: '45.2 MB', 
    uploadedBy: 'Dr. Emily White',
    uploadedDate: '2026-01-22',
    downloads: 156,
    category: 'Video Lecture'
  },
  { 
    id: 4, 
    title: 'Shakespeare Complete Works', 
    course: 'English Literature', 
    type: 'PDF', 
    size: '8.7 MB', 
    uploadedBy: 'Prof. James Wilson',
    uploadedDate: '2026-01-15',
    downloads: 203,
    category: 'Reference Material'
  },
  { 
    id: 5, 
    title: 'Python Programming Tutorial Series', 
    course: 'Computer Science 101', 
    type: 'Video', 
    size: '120.5 MB', 
    uploadedBy: 'Dr. David Lee',
    uploadedDate: '2026-01-25',
    downloads: 187,
    category: 'Video Lecture'
  },
  { 
    id: 6, 
    title: 'Cell Biology Diagrams', 
    course: 'Biology 150', 
    type: 'Images', 
    size: '5.3 MB', 
    uploadedBy: 'Dr. Amanda Brown',
    uploadedDate: '2026-01-19',
    downloads: 124,
    category: 'Visual Aids'
  },
  { 
    id: 7, 
    title: 'World War II Timeline PDF', 
    course: 'History 201', 
    type: 'PDF', 
    size: '3.2 MB', 
    uploadedBy: 'Prof. Robert Garcia',
    uploadedDate: '2026-01-21',
    downloads: 89,
    category: 'Study Guide'
  },
  { 
    id: 8, 
    title: 'Market Analysis Case Studies', 
    course: 'Economics 101', 
    type: 'PDF', 
    size: '4.8 MB', 
    uploadedBy: 'Dr. Lisa Martinez',
    uploadedDate: '2026-01-24',
    downloads: 76,
    category: 'Case Studies'
  },
];

export function StudyMaterials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredMaterials = materialsData.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || material.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-5 h-5 text-red-500" />;
      case 'Video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'Images': return <Image className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Study Materials</h2>
          <p className="text-gray-600">Centralized repository for lecture notes, study materials, and academic resources.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Material
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900">{materialsData.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">PDF Documents</p>
              <p className="text-2xl font-bold text-gray-900">{materialsData.filter(m => m.type === 'PDF').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Video Lectures</p>
              <p className="text-2xl font-bold text-gray-900">{materialsData.filter(m => m.type === 'Video').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{materialsData.reduce((sum, m) => sum + m.downloads, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials by title or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="PDF">PDF Documents</option>
            <option value="Video">Video Lectures</option>
            <option value="Images">Images</option>
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
          <div key={material.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                  {getTypeIcon(material.type)}
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  {material.category}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{material.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{material.course}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Uploaded by:</span>
                  <span className="text-gray-900">{material.uploadedBy}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-900">{new Date(material.uploadedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Size:</span>
                  <span className="text-gray-900">{material.size}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Downloads:</span>
                  <span className="text-gray-900">{material.downloads}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No materials found matching your search criteria.
        </div>
      )}
    </div>
  );
}
