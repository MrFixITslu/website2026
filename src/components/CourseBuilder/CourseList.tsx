import React, { useState } from 'react';
import { Course } from './courseBuilderTypes';
import { BookOpen, Search, Filter, Plus, Edit, Play, Download, Trash2, Globe, Clock, User } from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedAppCategory: string;
  onSelectCourse: (course: Course) => void;
  onPreviewCourse: (course: Course) => void;
  onExportCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onNewCourse: () => void;
}

export function CourseList({
  courses,
  searchQuery,
  setSearchQuery,
  selectedAppCategory,
  onSelectCourse,
  onPreviewCourse,
  onExportCourse,
  onDeleteCourse,
  onNewCourse
}: CourseListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedAppCategory === 'All Applications' || course.category === selectedAppCategory;

    const matchesStatus = statusFilter === 'All' || course.status === statusFilter;
    const matchesDifficulty = difficultyFilter === 'All' || course.difficultyLevel === difficultyFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesDifficulty;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Draft</span>;
      case 'Review':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">In Review</span>;
      case 'Ready for Upload':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Ready for Upload</span>;
      case 'Uploaded':
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">Uploaded</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Course Catalog</h2>
          <p className="text-sm text-slate-500">
            {selectedAppCategory === 'All Applications' ? 'Showing all V79 Academy courses' : `Showing courses for ${selectedAppCategory}`}
          </p>
        </div>
        <button
          onClick={onNewCourse}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Course</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 uppercase">Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Review">In Review</option>
          <option value="Ready for Upload">Ready for Upload</option>
          <option value="Uploaded">Uploaded</option>
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="All">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <div className="ml-auto text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredCourses.length}</span> courses
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden group"
          >
            <div className="relative h-48 overflow-hidden bg-slate-100">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3">
                {getStatusBadge(course.status)}
              </div>
              <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-medium px-2.5 py-1 rounded-md">
                {course.category}
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {course.estimatedDuration}</span>
                  <span>•</span>
                  <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1" /> {course.instructor}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {course.shortDescription}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onSelectCourse(course)}
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    title="Edit Course"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onPreviewCourse(course)}
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Student Preview"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onExportCourse(course)}
                    className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                    title="Export Package"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${course.title}"?`)) {
                      onDeleteCourse(course.id);
                    }
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-lg font-bold text-slate-800">No courses found</h4>
          <p className="text-sm text-slate-500">Try adjusting your search query or application filter.</p>
        </div>
      )}
    </div>
  );
}
