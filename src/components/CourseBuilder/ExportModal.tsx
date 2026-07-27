import React, { useState, useEffect } from 'react';
import { Course } from './courseBuilderTypes';
import { X, Download, Folder, FileJson, FileText, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import { cbFetch } from './cbApi';

interface ExportModalProps {
  course: Course;
  onClose: () => void;
}

export function ExportModal({ course, onClose }: ExportModalProps) {
  const [packageData, setPackageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchPackage();
  }, [course.id]);

  const fetchPackage = async () => {
    try {
      const res = await cbFetch(`/api/courses/${course.id}/export-package`);
      const data = await res.json();
      setPackageData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!packageData) return;
    setExporting(true);
    try {
      const zip = new JSZip();
      const folderName = `v79-academy-course-${course.id}`;
      const courseFolder = zip.folder(folderName);

      if (!courseFolder) return;

      courseFolder.file('course.json', JSON.stringify(packageData['course.json'], null, 2));
      courseFolder.file('README.md', packageData['README.md']);

      const modulesFolder = courseFolder.folder('modules');
      if (modulesFolder) {
        packageData.modules.forEach((mod: any, mIdx: number) => {
          const modFolder = modulesFolder.folder(`module-0${mIdx + 1}`);
          if (modFolder) {
            modFolder.file('module.json', JSON.stringify(mod, null, 2));
            const lessonsFolder = modFolder.folder('lessons');
            if (lessonsFolder && mod.lessons) {
              mod.lessons.forEach((les: any, lIdx: number) => {
                const lesFolder = lessonsFolder.folder(`lesson-0${lIdx + 1}`);
                if (lesFolder) {
                  lesFolder.file('content.json', JSON.stringify(les, null, 2));
                }
              });
            }
          }
        });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ZIP generation error:', e);
      alert('Failed to generate zip package.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Course Package Export</h3>
              <p className="text-xs text-slate-500">Ready for automated upload to V79 Academy website</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading package structure...</div>
          ) : packageData ? (
            <div className="space-y-4">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-1 shadow-inner overflow-x-auto">
                <p className="text-indigo-400 font-bold">course-package/</p>
                <p className="pl-4">├── course.json</p>
                <p className="pl-4">├── README.md</p>
                <p className="pl-4">├── modules/</p>
                <p className="pl-8">└── module-01/</p>
                <p className="pl-12">├── module.json</p>
                <p className="pl-12">└── lessons/</p>
                <p className="pl-16">└── lesson-01/</p>
                <p className="pl-20">└── content.json</p>
                <p className="pl-4">├── quizzes/ ({packageData.quizzes?.length || 0} attached)</p>
                <p className="pl-4">└── assets/ ({packageData.assets?.length || 0} attached)</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 space-y-1">
                  <p className="font-bold">Structured for V79 Academy Ingestion API</p>
                  <p>This package strictly adheres to the Academy schema specification, enabling seamless synchronization with Fire Finance Pro, SIWM, Tiquet, and KashDash portals.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-rose-500">Failed to load package preview.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">Format: Standard Academy JSON Archive (.zip)</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={exporting || !packageData}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Generating ZIP...' : 'Download Course ZIP'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
