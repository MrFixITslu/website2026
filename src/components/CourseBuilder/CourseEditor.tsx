import React, { useState, useEffect, useRef } from 'react';
import { Course, Lesson } from './courseBuilderTypes';
import { ArrowLeft, BookOpen, Layers, FolderKanban, Settings, Save, CheckCircle2, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ModuleLessonManager } from './ModuleLessonManager';
import { AssetManager } from './AssetManager';
import { QuizBuilder } from './QuizBuilder';
import { cbFetch } from './cbApi';

interface CourseEditorProps {
  course: Course;
  onBack: () => void;
  onUpdateCourse: (updated: Course) => void;
  onExportCourse: (course: Course) => void;
}

export function CourseEditor({ course, onBack, onUpdateCourse, onExportCourse }: CourseEditorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'assets' | 'quiz' | 'settings'>('curriculum');
  const [formData, setFormData] = useState<Course>({ ...course });
  const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState<Lesson | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'saving' | 'error'>('synced');
  const [lastSavedTime, setLastSavedTime] = useState<string>(new Date().toLocaleTimeString());
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [publishError, setPublishError] = useState<string | null>(null);

  const handlePublish = async () => {
    setPublishState('publishing');
    setPublishError(null);
    try {
      const res = await cbFetch(`/api/courses/${course.id}/publish`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish course to the website.');
      }
      setFormData(data.course);
      onUpdateCourse(data.course);
      setPublishState('success');
    } catch (err: any) {
      setPublishError(err.message || 'Failed to publish course to the website.');
      setPublishState('error');
    }
  };

  const lastSavedJsonRef = useRef<string>(JSON.stringify(course));
  const isInitialMount = useRef(true);

  // Detect form data changes and set sync status to pending
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const currentJson = JSON.stringify(formData);
    if (currentJson !== lastSavedJsonRef.current) {
      setSyncStatus('pending');
    }
  }, [formData]);

  // Execute sync to server
  const triggerSync = async () => {
    setSyncStatus('saving');
    try {
      const res = await cbFetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateCourse(updated);
        lastSavedJsonRef.current = JSON.stringify(formData);
        setSyncStatus('synced');
        setLastSavedTime(new Date().toLocaleTimeString());
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      console.error('Auto-save sync error:', e);
      setSyncStatus('error');
    }
  };

  // Debounced auto-save effect when status is pending
  useEffect(() => {
    if (syncStatus !== 'pending') return;

    const timer = setTimeout(() => {
      triggerSync();
    }, 2000);

    return () => clearTimeout(timer);
  }, [syncStatus, formData, course.id]);

  // Backup periodic auto-save interval (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (JSON.stringify(formData) !== lastSavedJsonRef.current) {
        triggerSync();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, course.id]);

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerSync();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                {formData.category}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">v{formData.courseVersion}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{formData.title}</h2>
          </div>
        </div>

        {/* Sync Status Indicator & Actions */}
        <div className="flex items-center space-x-3">
          <div
            onClick={() => (syncStatus === 'pending' || syncStatus === 'error') && triggerSync()}
            title={
              syncStatus === 'pending'
                ? 'Changes pending auto-save. Click to sync immediately.'
                : syncStatus === 'error'
                ? 'Sync failed. Click to retry.'
                : `Synced with server at ${lastSavedTime}`
            }
            className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
              syncStatus === 'pending' || syncStatus === 'error'
                ? 'cursor-pointer hover:shadow-xs hover:scale-[1.01]'
                : ''
            } ${
              syncStatus === 'synced'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : syncStatus === 'saving'
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-800'
                : syncStatus === 'pending'
                ? 'bg-amber-50/80 border-amber-200 text-amber-800 shadow-2xs'
                : 'bg-rose-50/80 border-rose-200 text-rose-800'
            }`}
          >
            <div className="relative flex items-center justify-center">
              {syncStatus === 'synced' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              {syncStatus === 'saving' && (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              )}
              {syncStatus === 'pending' && (
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              )}
              {syncStatus === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5 font-semibold">
                <span>Sync Status:</span>
                <span className="capitalize">
                  {syncStatus === 'synced' && 'Synced'}
                  {syncStatus === 'saving' && 'Saving...'}
                  {syncStatus === 'pending' && 'Pending'}
                  {syncStatus === 'error' && 'Failed'}
                </span>
                {syncStatus === 'pending' && (
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
                    Queued
                  </span>
                )}
              </div>
              <span className="text-[10px] opacity-80 font-normal">
                {syncStatus === 'synced' && `Up to date (${lastSavedTime})`}
                {syncStatus === 'saving' && 'Syncing with server...'}
                {syncStatus === 'pending' && 'Auto-save scheduled • Click to sync'}
                {syncStatus === 'error' && 'Click to retry sync'}
              </span>
            </div>

            {(syncStatus === 'pending' || syncStatus === 'error') && (
              <RefreshCw className="w-3.5 h-3.5 opacity-70 ml-1" />
            )}
          </div>

          <button
            onClick={() => onExportCourse(formData)}
            className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition-colors"
          >
            Export Package
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setActiveTab('curriculum'); setSelectedLessonForQuiz(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
            activeTab === 'curriculum' && !selectedLessonForQuiz
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Curriculum & Lessons</span>
        </button>

        <button
          onClick={() => { setActiveTab('overview'); setSelectedLessonForQuiz(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Course Overview & Metadata</span>
        </button>

        <button
          onClick={() => { setActiveTab('assets'); setSelectedLessonForQuiz(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
            activeTab === 'assets'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Asset Manager</span>
        </button>

        <button
          onClick={() => { setActiveTab('settings'); setSelectedLessonForQuiz(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Publishing & Status</span>
        </button>
      </div>

      {/* Tab Content */}
      {selectedLessonForQuiz ? (
        <QuizBuilder
          lesson={selectedLessonForQuiz}
          onBack={() => setSelectedLessonForQuiz(null)}
        />
      ) : (
        <>
          {activeTab === 'curriculum' && (
            <ModuleLessonManager
              course={formData}
              onOpenQuizBuilder={(lesson) => setSelectedLessonForQuiz(lesson)}
            />
          )}

          {activeTab === 'overview' && (
            <form onSubmit={handleSaveOverview} className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6 shadow-xs max-w-4xl mx-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900">Course Metadata & Overview</h3>
                <button
                  type="submit"
                  disabled={syncStatus === 'saving'}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{syncStatus === 'saving' ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">V79 Application Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800"
                  >
                    <option value="Fire Finance Pro (FFPRO2)">Fire Finance Pro (FFPRO2)</option>
                    <option value="SIWM">SIWM</option>
                    <option value="Tiquet">Tiquet</option>
                    <option value="KashDash">KashDash</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty Level</label>
                  <select
                    value={formData.difficultyLevel}
                    onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Type</label>
                  <select
                    value={formData.pricingType || 'free'}
                    onChange={(e) => {
                      const pricingType = e.target.value as Course['pricingType'];
                      setFormData({ ...formData, pricingType, price: pricingType === 'premium' ? formData.price : 0 });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800"
                  >
                    <option value="free">Free</option>
                    <option value="free_trial">Free Trial</option>
                    <option value="premium">Premium (paid)</option>
                  </select>
                </div>

                {formData.pricingType === 'premium' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Price (USD)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.price ?? 0}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Version</label>
                  <input
                    type="text"
                    value={formData.courseVersion}
                    onChange={(e) => setFormData({ ...formData, courseVersion: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thumbnail Image URL</label>
                  <input
                    type="text"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Short Description</label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800"
                    rows={2}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Description</label>
                  <textarea
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 leading-relaxed"
                    rows={4}
                  />
                </div>
              </div>
            </form>
          )}

          {activeTab === 'assets' && (
            <AssetManager course={formData} />
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-6 max-w-4xl mx-auto shadow-xs">
              <h3 className="text-lg font-bold text-slate-900">Publishing & Workflow Status</h3>
              <p className="text-xs text-slate-500">Update the internal workflow status, then publish for real once it's ready.</p>

              <div className="space-y-4 pt-4">
                <label className="block text-xs font-semibold text-slate-700">Internal Workflow Status</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['Draft', 'Review', 'Ready for Upload'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, status: st };
                        setFormData(updated);
                        onUpdateCourse(updated);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.status === st
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold text-xs text-slate-900">{st}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {st === 'Draft' && 'Work in progress by author'}
                        {st === 'Review' && 'Submitted for peer review'}
                        {st === 'Ready for Upload' && 'Approved & ready to publish'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Publish to Website</label>
                {formData.status === 'Uploaded' && formData.websiteAppId ? (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Live on the website</p>
                    <p>Website app ID: {formData.websiteAppId}{formData.websitePublishedAt ? ` · last published ${new Date(formData.websitePublishedAt).toLocaleString()}` : ''}</p>
                    <p className="text-emerald-700/80">Publishing again will update this same entry with your latest content.</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    This course hasn't been published yet. Publishing sends the curriculum and exam to the website and makes it live there.
                  </p>
                )}

                {publishState === 'error' && publishError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{publishError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishState === 'publishing'}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {publishState === 'publishing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      {formData.websiteAppId ? 'Republish to Website' : 'Publish to Website'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
