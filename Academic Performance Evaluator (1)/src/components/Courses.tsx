import { useState } from 'react';
import { Search, Plus, Users, Clock, Calendar, BookOpen } from 'lucide-react';

const coursesData = [
  { id: 1, name: 'Mathematics 101', instructor: 'Dr. Sarah Johnson', students: 156, duration: '12 weeks', progress: 68, startDate: '2026-01-15', category: 'Mathematics' },
  { id: 2, name: 'Physics 202', instructor: 'Prof. Michael Chen', students: 124, duration: '14 weeks', progress: 52, startDate: '2026-01-20', category: 'Science' },
  { id: 3, name: 'Chemistry 301', instructor: 'Dr. Emily White', students: 98, duration: '16 weeks', progress: 45, startDate: '2026-02-01', category: 'Science' },
  { id: 4, name: 'English Literature', instructor: 'Prof. James Wilson', students: 187, duration: '10 weeks', progress: 78, startDate: '2026-01-10', category: 'Arts' },
  { id: 5, name: 'Computer Science 101', instructor: 'Dr. David Lee', students: 201, duration: '12 weeks', progress: 61, startDate: '2026-01-18', category: 'Technology' },
  { id: 6, name: 'Biology 150', instructor: 'Dr. Amanda Brown', students: 143, duration: '14 weeks', progress: 55, startDate: '2026-01-22', category: 'Science' },
  { id: 7, name: 'History 201', instructor: 'Prof. Robert Garcia', students: 112, duration: '10 weeks', progress: 72, startDate: '2026-01-12', category: 'Arts' },
  { id: 8, name: 'Economics 101', instructor: 'Dr. Lisa Martinez', students: 165, duration: '12 weeks', progress: 48, startDate: '2026-02-05', category: 'Business' },
];

export function Courses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredCourses = coursesData.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || course.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Courses</h2>
          <p className="text-gray-600">Manage courses and track their progress throughout the semester.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Arts">Arts</option>
            <option value="Technology">Technology</option>
            <option value="Business">Business</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  course.category === 'Mathematics' ? 'bg-purple-100 text-purple-700' :
                  course.category === 'Science' ? 'bg-green-100 text-green-700' :
                  course.category === 'Arts' ? 'bg-orange-100 text-orange-700' :
                  course.category === 'Technology' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {course.category}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{course.instructor}</p>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{course.students} students enrolled</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration} duration</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Started {new Date(course.startDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">{course.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No courses found matching your search criteria.
        </div>
      )}
    </div>
  );
}
