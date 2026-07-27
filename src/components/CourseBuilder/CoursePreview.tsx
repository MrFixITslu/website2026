import React, { useState, useEffect } from 'react';
import { Course, Module, Lesson, Quiz } from './courseBuilderTypes';
import { ArrowLeft, Play, CheckCircle2, FileText, Download, HelpCircle, GraduationCap, ChevronRight, Check } from 'lucide-react';
import { cbFetch } from './cbApi';

interface CoursePreviewProps {
  course: Course;
  onBack: () => void;
}

export function CoursePreview({ course, onBack }: CoursePreviewProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsMap, setLessonsMap] = useState<{ [modId: string]: Lesson[] }>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<{ [lesId: string]: boolean }>({});

  useEffect(() => {
    fetchPreviewData();
  }, [course.id]);

  const fetchPreviewData = async () => {
    try {
      const mRes = await cbFetch(`/api/courses/${course.id}/modules`);
      const mData = await mRes.json();
      setModules(mData);

      const lMap: { [id: string]: Lesson[] } = {};
      for (const m of mData) {
        const lRes = await cbFetch(`/api/modules/${m.id}/lessons`);
        const lData = await lRes.json();
        lMap[m.id] = lData;
        if (!currentLesson && lData.length > 0) {
          setCurrentLesson(lData[0]);
        }
      }
      setLessonsMap(lMap);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentLesson) {
      fetchQuizForLesson(currentLesson.id);
    }
  }, [currentLesson]);

  const fetchQuizForLesson = async (lessonId: string) => {
    try {
      const res = await cbFetch(`/api/lessons/${lessonId}/quiz`);
      const data = await res.json();
      setActiveQuiz(data);
      setQuizSubmitted(false);
      setQuizAnswers({});
      setQuizScore(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuizSubmit = () => {
    if (!activeQuiz) return;
    let correct = 0;
    for (const q of activeQuiz.questions) {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    }
    const score = Math.round((correct / activeQuiz.questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    if (score >= activeQuiz.passingScore && currentLesson) {
      setCompletedLessons({ ...completedLessons, [currentLesson.id]: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <div className="h-16 bg-slate-950 border-b border-slate-800 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Preview</span>
          </button>
          <div className="h-5 w-px bg-slate-800"></div>
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm tracking-wide text-white">V79 Academy Student View</span>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Course: <span className="text-white font-semibold">{course.title}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Curriculum */}
        <aside className="w-80 bg-slate-950/70 border-r border-slate-800 overflow-y-auto p-6 space-y-6 shrink-0">
          <div>
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">{course.category}</span>
            <h2 className="font-bold text-white text-base mt-1">{course.title}</h2>
          </div>

          <div className="space-y-4">
            {modules.map((mod, modIdx) => (
              <div key={mod.id} className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Mod {modIdx + 1}: {mod.title}
                </p>
                <div className="space-y-1 pl-2 border-l border-slate-800">
                  {lessonsMap[mod.id]?.map((lesson, lIdx) => (
                    <button
                      key={lesson.id}
                      onClick={() => setCurrentLesson(lesson)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        currentLesson?.id === lesson.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {completedLessons[lesson.id] ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{lIdx + 1}. {lesson.title}</span>
                      </div>
                      <span className="text-[10px] opacity-75">{lesson.estimatedTime}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-900">
          {currentLesson ? (
            <div className="max-w-3xl mx-auto space-y-8">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Estimated Time: {currentLesson.estimatedTime}</span>
                <h1 className="text-3xl font-bold text-white mt-1">{currentLesson.title}</h1>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{currentLesson.description}</p>
              </div>

              {/* Video Player Mock if videoUrl exists */}
              {currentLesson.videoUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center relative">
                  <video
                    src={currentLesson.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Lesson Markdown Content */}
              <div className="bg-slate-950/60 border border-slate-800 p-8 rounded-2xl text-slate-200 text-sm leading-relaxed space-y-4 font-sans">
                <div className="whitespace-pre-wrap">{currentLesson.lessonContent}</div>
              </div>

              {/* Downloads / Assets */}
              {currentLesson.downloads && currentLesson.downloads.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Lesson Downloads & Templates</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentLesson.downloads.map((dl, idx) => (
                      <a
                        key={idx}
                        href={dl.url}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-indigo-500/50 flex items-center justify-between transition-colors group"
                      >
                        <div className="truncate">
                          <p className="font-semibold text-xs text-slate-200 group-hover:text-white truncate">{dl.name}</p>
                          <p className="text-[10px] text-slate-400">{dl.size}</p>
                        </div>
                        <Download className="w-4 h-4 text-indigo-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz Assessment */}
              {activeQuiz && (
                <div className="bg-slate-950/80 border border-indigo-500/30 p-8 rounded-2xl space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Lesson Assessment</span>
                      <h3 className="text-xl font-bold text-white mt-0.5">{activeQuiz.title}</h3>
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                      Passing Score: {activeQuiz.passingScore}%
                    </span>
                  </div>

                  {quizSubmitted ? (
                    <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
                      <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center font-bold text-xl ${
                        quizScore! >= activeQuiz.passingScore ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {quizScore}%
                      </div>
                      <h4 className="font-bold text-white text-lg">
                        {quizScore! >= activeQuiz.passingScore ? 'Assessment Passed! 🎉' : 'Assessment Not Passed'}
                      </h4>
                      <p className="text-xs text-slate-300">
                        {quizScore! >= activeQuiz.passingScore
                          ? 'Congratulations! You have met the mastery threshold for this lesson.'
                          : `You scored ${quizScore}%. Required passing score is ${activeQuiz.passingScore}%.`}
                      </p>
                      <button
                        onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
                      >
                        Retake Quiz
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {activeQuiz.questions.map((q, qIdx) => (
                        <div key={q.id} className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
                          <p className="font-bold text-sm text-white">
                            {qIdx + 1}. {q.questionText}
                          </p>
                          <div className="space-y-2 pl-4">
                            {q.options.map((opt, oIdx) => (
                              <label
                                key={oIdx}
                                className={`flex items-center space-x-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  quizAnswers[q.id] === opt
                                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                                    : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  value={opt}
                                  checked={quizAnswers[q.id] === opt}
                                  onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt })}
                                  className="w-4 h-4 text-indigo-600"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleQuizSubmit}
                          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all"
                        >
                          Submit Assessment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24 text-slate-400">
              Select a lesson from the sidebar to begin previewing.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
