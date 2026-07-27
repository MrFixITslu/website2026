import React, { useState, useEffect } from 'react';
import { Course, Module, Lesson } from './courseBuilderTypes';
import { Plus, ChevronDown, ChevronRight, Edit, Trash2, FileText, Video, Download, HelpCircle, ArrowUpRight } from 'lucide-react';
import { cbFetch } from './cbApi';

interface ModuleLessonManagerProps {
  course: Course;
  onOpenQuizBuilder: (lesson: Lesson) => void;
}

export function ModuleLessonManager({ course, onOpenQuizBuilder }: ModuleLessonManagerProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsMap, setLessonsMap] = useState<{ [moduleId: string]: Lesson[] }>({});
  const [expandedModules, setExpandedModules] = useState<{ [modId: string]: boolean }>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // New Module modal/form state
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');

  // New Lesson modal/form state
  const [activeModuleIdForLesson, setActiveModuleIdForLesson] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDesc, setNewLessonDesc] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonTime, setNewLessonTime] = useState('25 mins');

  // Editing lesson content state
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [lessonAutoSaveStatus, setLessonAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lessonLastSavedTime, setLessonLastSavedTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    if (!selectedLesson) return;
    const interval = setInterval(async () => {
      try {
        setLessonAutoSaveStatus('saving');
        const res = await cbFetch(`/api/lessons/${selectedLesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedLesson)
        });
        if (res.ok) {
          const updated = await res.json();
          setLessonAutoSaveStatus('saved');
          setLessonLastSavedTime(new Date().toLocaleTimeString());
        }
      } catch (e) {
        console.error('Lesson auto-save error:', e);
        setLessonAutoSaveStatus('unsaved');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedLesson]);

  useEffect(() => {
    fetchModules();
  }, [course.id]);

  const fetchModules = async () => {
    try {
      const res = await cbFetch(`/api/courses/${course.id}/modules`);
      const data = await res.json();
      setModules(data);
      // Auto expand all
      const exp: { [id: string]: boolean } = {};
      const lMap: { [id: string]: Lesson[] } = {};
      for (const m of data) {
        exp[m.id] = true;
        const lRes = await cbFetch(`/api/modules/${m.id}/lessons`);
        lMap[m.id] = await lRes.json();
      }
      setExpandedModules(exp);
      setLessonsMap(lMap);
      if (data.length > 0 && !selectedLesson && lMap[data[0].id]?.length > 0) {
        setSelectedLesson(lMap[data[0].id][0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    try {
      const res = await cbFetch(`/api/courses/${course.id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newModuleTitle, description: newModuleDesc })
      });
      if (res.ok) {
        setNewModuleTitle('');
        setNewModuleDesc('');
        setIsAddingModule(false);
        fetchModules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteModule = async (modId: string) => {
    if (!confirm('Are you sure you want to delete this module and all its lessons?')) return;
    await cbFetch(`/api/modules/${modId}`, { method: 'DELETE' });
    fetchModules();
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModuleIdForLesson || !newLessonTitle.trim()) return;
    try {
      const res = await cbFetch(`/api/modules/${activeModuleIdForLesson}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newLessonTitle,
          description: newLessonDesc,
          lessonContent: newLessonContent || `# ${newLessonTitle}\n\nEnter lesson content here...`,
          estimatedTime: newLessonTime
        })
      });
      if (res.ok) {
        const created = await res.json();
        setNewLessonTitle('');
        setNewLessonDesc('');
        setNewLessonContent('');
        setActiveModuleIdForLesson(null);
        fetchModules();
        setSelectedLesson(created);
        setIsEditingLesson(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;
    try {
      const res = await cbFetch(`/api/lessons/${selectedLesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedLesson)
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedLesson(updated);
        fetchModules();
        alert('Lesson saved successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    await cbFetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
    if (selectedLesson?.id === lessonId) setSelectedLesson(null);
    fetchModules();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Sidebar: Module & Lesson Tree */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Course Curriculum</h3>
          <button
            onClick={() => setIsAddingModule(true)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Module</span>
          </button>
        </div>

        {/* Add Module Modal Form */}
        {isAddingModule && (
          <form onSubmit={handleCreateModule} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-700">New Module</h4>
            <input
              type="text"
              placeholder="Module Title (e.g., Advanced Routing)"
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
              required
            />
            <textarea
              placeholder="Short Description"
              value={newModuleDesc}
              onChange={(e) => setNewModuleDesc(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800"
              rows={2}
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingModule(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map((mod, modIdx) => (
            <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between">
                <div
                  className="flex items-center space-x-2 cursor-pointer flex-1"
                  onClick={() => setExpandedModules({ ...expandedModules, [mod.id]: !expandedModules[mod.id] })}
                >
                  {expandedModules[mod.id] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  <span className="font-semibold text-xs text-slate-900 truncate">
                    Mod {modIdx + 1}: {mod.title}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveModuleIdForLesson(mod.id)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    title="Add Lesson"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete Module"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Lessons inside module */}
              {expandedModules[mod.id] && (
                <div className="p-2 space-y-1">
                  {lessonsMap[mod.id]?.map((lesson, lIdx) => (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        setSelectedLesson(lesson);
                        setIsEditingLesson(true);
                      }}
                      className={`p-2.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        selectedLesson?.id === lesson.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="w-3.5 h-3.5 shrink-0 opacity-75" />
                        <span className="truncate font-medium">{lIdx + 1}. {lesson.title}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedLesson?.id === lesson.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'}`}>
                        {lesson.estimatedTime}
                      </span>
                    </div>
                  ))}

                  {/* Add Lesson Inline Form */}
                  {activeModuleIdForLesson === mod.id ? (
                    <form onSubmit={handleCreateLesson} className="p-3 bg-white rounded-lg border border-indigo-200 space-y-2 mt-2">
                      <h5 className="text-[11px] font-bold text-indigo-700 uppercase">New Lesson in Mod {modIdx + 1}</h5>
                      <input
                        type="text"
                        placeholder="Lesson Title"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Est. Time (e.g. 20 mins)"
                        value={newLessonTime}
                        onChange={(e) => setNewLessonTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
                      />
                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveModuleIdForLesson(null)}
                          className="px-2 py-1 text-[11px] text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-[11px] font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Add Lesson
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setActiveModuleIdForLesson(mod.id)}
                      className="w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-300 text-xs font-medium flex items-center justify-center space-x-1 bg-white/50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Lesson</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {modules.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No modules created yet. Click "Add Module" to begin.
            </div>
          )}
        </div>
      </div>

      {/* Right Content: Lesson Editor */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
        {selectedLesson ? (
          <form onSubmit={handleUpdateLesson} className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Lesson Editor</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">{selectedLesson.title}</h3>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className={`w-2 h-2 rounded-full ${lessonAutoSaveStatus === 'saving' ? 'bg-amber-500 animate-pulse' : lessonAutoSaveStatus === 'saved' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>{lessonAutoSaveStatus === 'saving' ? 'Auto-saving...' : lessonAutoSaveStatus === 'saved' ? `Auto-saved (${lessonLastSavedTime})` : 'Unsaved'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenQuizBuilder(selectedLesson)}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition-colors border border-purple-200"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Configure Quiz</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm transition-all"
                >
                  Save Lesson
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Title</label>
                <input
                  type="text"
                  value={selectedLesson.title}
                  onChange={(e) => setSelectedLesson({ ...selectedLesson, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Duration</label>
                <input
                  type="text"
                  value={selectedLesson.estimatedTime}
                  onChange={(e) => setSelectedLesson({ ...selectedLesson, estimatedTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Description</label>
              <input
                type="text"
                value={selectedLesson.description || ''}
                onChange={(e) => setSelectedLesson({ ...selectedLesson, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Video URL (MP4 / WebM / YouTube embed)</label>
                <input
                  type="text"
                  value={selectedLesson.videoUrl || ''}
                  onChange={(e) => setSelectedLesson({ ...selectedLesson, videoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exercise Prompt / Practical Assignment</label>
                <input
                  type="text"
                  value={selectedLesson.exercisePrompt || ''}
                  onChange={(e) => setSelectedLesson({ ...selectedLesson, exercisePrompt: e.target.value })}
                  placeholder="e.g. Build a cash sweep rule..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Lesson Content (Markdown Supported)</label>
                <span className="text-[10px] text-slate-400">Supports headers, lists, code blocks, and blockquotes</span>
              </div>
              <textarea
                value={selectedLesson.lessonContent}
                onChange={(e) => setSelectedLesson({ ...selectedLesson, lessonContent: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                rows={12}
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleDeleteLesson(selectedLesson.id)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Delete Lesson
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-24 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">No Lesson Selected</h4>
            <p className="text-xs text-slate-500">Select a lesson from the curriculum tree on the left to edit its content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
