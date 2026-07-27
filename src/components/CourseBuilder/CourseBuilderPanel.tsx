import React, { useState, useEffect } from 'react';
import { Course, Module, Lesson } from './courseBuilderTypes';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Dashboard } from './Dashboard';
import { CourseList } from './CourseList';
import { CourseEditor } from './CourseEditor';
import { CoursePreview } from './CoursePreview';
import { ExportModal } from './ExportModal';
import { AICourseAssistantModal } from './AICourseAssistantModal';
import { cbFetch } from './cbApi';

// This panel is the full V79 Academy Course Builder, ported to run inside
// the VISION79 admin page. It is mounted only after AdminApp has already
// authenticated the operator, so - unlike the original standalone app -
// it has no login/change-password screens of its own. Every API call goes
// through cbFetch, which attaches the admin's existing Bearer session token.
interface CourseBuilderPanelProps {
  onExit?: () => void;
}

export default function CourseBuilderPanel({ onExit }: CourseBuilderPanelProps) {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [exportingCourse, setExportingCourse] = useState<Course | null>(null);
  const [previewingCourse, setPreviewingCourse] = useState<Course | null>(null);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [selectedAppCategory, setSelectedAppCategory] = useState<string>('All Applications');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await cbFetch('/api/courses');
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNewCourse = async () => {
    try {
      const res = await cbFetch('/api/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New V79 Academy Course',
          shortDescription: 'Enter course short description here...',
          fullDescription: 'Enter comprehensive course overview and learning outcomes...',
          category: selectedAppCategory === 'All Applications' ? 'Fire Finance Pro (FFPRO2)' : selectedAppCategory,
          difficultyLevel: 'Intermediate',
          instructor: 'V79 Academy Lead Author',
          courseVersion: '1.0.0',
          thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
          estimatedDuration: '3.0 hours',
          prerequisites: ['Basic V79 Application Knowledge'],
          learning_objectives: ['Understand core workflows', 'Execute advanced configuration tasks'],
          status: 'Draft'
        })
      });
      if (res.ok) {
        const created = await res.json();
        await fetchCourses();
        setSelectedCourse(created);
        setCurrentView('editor');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await cbFetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      await fetchCourses();
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setCurrentView('dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (previewingCourse) {
    return (
      <CoursePreview
        course={previewingCourse}
        onBack={() => setPreviewingCourse(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans antialiased">
      <Sidebar
        currentView={currentView}
        setCurrentView={(v) => {
          setCurrentView(v);
          setSelectedCourse(null);
        }}
        selectedAppCategory={selectedAppCategory}
        setSelectedAppCategory={setSelectedAppCategory}
        onExit={onExit}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNewCourse={handleCreateNewCourse}
          onOpenAiAssistant={() => setShowAiModal(true)}
          selectedAppCategory={selectedAppCategory}
        />

        <main className="flex-1">
          {currentView === 'dashboard' && (
            <Dashboard
              courses={courses}
              modules={modules}
              lessons={lessons}
              onSelectCourse={(c) => {
                setSelectedCourse(c);
                setCurrentView('editor');
              }}
              onPreviewCourse={(c) => setPreviewingCourse(c)}
              onExportCourse={(c) => setExportingCourse(c)}
              onNewCourse={handleCreateNewCourse}
              setCurrentView={setCurrentView}
            />
          )}

          {currentView === 'courses' && (
            <CourseList
              courses={courses}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedAppCategory={selectedAppCategory}
              onSelectCourse={(c) => {
                setSelectedCourse(c);
                setCurrentView('editor');
              }}
              onPreviewCourse={(c) => setPreviewingCourse(c)}
              onExportCourse={(c) => setExportingCourse(c)}
              onDeleteCourse={handleDeleteCourse}
              onNewCourse={handleCreateNewCourse}
            />
          )}

          {currentView === 'editor' && selectedCourse && (
            <CourseEditor
              course={selectedCourse}
              onBack={() => {
                setSelectedCourse(null);
                setCurrentView('courses');
              }}
              onUpdateCourse={(updated) => {
                setSelectedCourse(updated);
                fetchCourses();
              }}
              onExportCourse={(c) => setExportingCourse(c)}
            />
          )}

          {currentView === 'assets' && (
            <div className="p-8 space-y-6 max-w-7xl mx-auto">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
                <h3 className="font-bold text-slate-800 text-base">Integrated with Course Authoring</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Assets are organized directly per course, module, and lesson within each course editor. Select a course from the catalog to manage its media assets.
                </p>
                <button
                  onClick={() => setCurrentView('courses')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all inline-block"
                >
                  Browse Course Catalog
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {exportingCourse && (
        <ExportModal
          course={exportingCourse}
          onClose={() => setExportingCourse(null)}
        />
      )}

      {showAiModal && (
        <AICourseAssistantModal
          onClose={() => setShowAiModal(false)}
          onCourseCreated={() => {
            fetchCourses();
            setCurrentView('courses');
          }}
        />
      )}
    </div>
  );
}
