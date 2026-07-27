import React, { useState } from 'react';
import { Sparkles, X, BookOpen, Check } from 'lucide-react';
import { AppCategory, DifficultyLevel } from './courseBuilderTypes';
import { cbFetch } from './cbApi';

interface AICourseAssistantModalProps {
  onClose: () => void;
  onCourseCreated: () => void;
}

export function AICourseAssistantModal({ onClose, onCourseCreated }: AICourseAssistantModalProps) {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState<AppCategory>('Fire Finance Pro (FFPRO2)');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Advanced');
  const [loading, setLoading] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const prompt = `Create a professional training course outline and metadata for V79 Academy application "${category}".
Topic: ${topic}
Difficulty: ${difficulty}
Provide the response as JSON with fields:
{
  "title": "string",
  "shortDescription": "string",
  "fullDescription": "string",
  "estimatedDuration": "string",
  "prerequisites": ["string"],
  "learning_objectives": ["string"]
}`;

      const res = await cbFetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'course_outline' })
      });
      const data = await res.json();
      if (data.result) {
        // Parse JSON from response
        let jsonStr = data.result;
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.split('```json')[1].split('```')[0];
        } else if (jsonStr.includes('```')) {
          jsonStr = jsonStr.split('```')[1].split('```')[0];
        }
        const parsed = JSON.parse(jsonStr.trim());
        setGeneratedPreview(parsed);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate course with AI. Please check GEMINI_API_KEY.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCourse = async () => {
    if (!generatedPreview) return;
    try {
      const res = await cbFetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generatedPreview,
          category,
          difficultyLevel: difficulty,
          instructor: 'V79 AI Curriculum Architect',
          courseVersion: '1.0.0',
          thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
          status: 'Draft'
        })
      });
      if (res.ok) {
        onCourseCreated();
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Course Architect</h3>
              <p className="text-xs text-indigo-100">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {!generatedPreview ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Topic / Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Advanced Multi-Currency Liquidity Sweeping in FFPRO2"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Application</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800"
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
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loading ? 'Generating Outline...' : 'Generate AI Course'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">AI Generated Outline</span>
                <h4 className="font-bold text-slate-900 text-base">{generatedPreview.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{generatedPreview.fullDescription}</p>
                <div className="flex items-center space-x-4 text-xs font-medium text-indigo-900 pt-1">
                  <span>Duration: {generatedPreview.estimatedDuration}</span>
                  <span>•</span>
                  <span>Level: {difficulty}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedPreview(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleAcceptCourse}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept & Create Course</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
