import React from 'react';
import { Course, Module, Lesson } from './courseBuilderTypes';
import { BookOpen, FileText, CheckCircle2, CloudUpload, Clock, ArrowUpRight, Edit, Play, Download, Sparkles } from 'lucide-react';

interface DashboardProps {
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  onSelectCourse: (course: Course) => void;
  onPreviewCourse: (course: Course) => void;
  onExportCourse: (course: Course) => void;
  onNewCourse: () => void;
  setCurrentView: (view: string) => void;
}

export function Dashboard({
  courses,
  modules,
  lessons,
  onSelectCourse,
  onPreviewCourse,
  onExportCourse,
  onNewCourse,
  setCurrentView
}: DashboardProps) {
  const totalCourses = courses.length;
  const draftCourses = courses.filter((c) => c.status === 'Draft').length;
  const reviewCourses = courses.filter((c) => c.status === 'Review').length;
  const readyCourses = courses.filter((c) => c.status === 'Ready for Upload').length;
  const uploadedCourses = courses.filter((c) => c.status === 'Uploaded').length;

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
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            V79 Academy Management Console
          </span>
          <h2 className="text-3xl font-bold tracking-tight">Course Authoring Dashboard</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Create, review, structure, and export training modules for Fire Finance Pro, SIWM, Tiquet, and KashDash before publishing to the live Academy platform.
          </p>
          <div className="pt-2 flex items-center space-x-4">
            <button
              onClick={onNewCourse}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Create New Course</span>
            </button>
            <button
              onClick={() => setCurrentView('courses')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold text-sm hover:bg-slate-700 transition-all border border-slate-700"
            >
              View Full Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Courses</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{totalCourses}</p>
            <span className="text-xs text-emerald-600 font-medium mt-1 inline-flex items-center">
              Active Curriculum
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Drafts in Progress</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{draftCourses}</p>
            <span className="text-xs text-amber-600 font-medium mt-1 inline-flex items-center">
              Requires authoring
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Ready for Upload</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{readyCourses}</p>
            <span className="text-xs text-emerald-600 font-medium mt-1 inline-flex items-center">
              Export ready
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CloudUpload className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Published / Uploaded</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{uploadedCourses}</p>
            <span className="text-xs text-purple-600 font-medium mt-1 inline-flex items-center">
              Live on Academy
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recently Updated Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recently Updated Courses</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage modules, lessons, quizzes, and package exports.</p>
          </div>
          <button
            onClick={() => setCurrentView('courses')}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Course Name</th>
                <th className="py-3.5 px-6">Application</th>
                <th className="py-3.5 px-6">Difficulty</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Last Updated</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {courses.slice(0, 5).map((course) => (
                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-1">{course.title}</p>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{course.shortDescription}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-slate-700 text-xs bg-slate-100 px-2.5 py-1 rounded-md">
                      {course.category}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-medium text-slate-600">{course.difficultyLevel}</span>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(course.status)}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500">
                    {new Date(course.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => onSelectCourse(course)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPreviewCourse(course)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Student Preview"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onExportCourse(course)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Export Package"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
