import React, { useState, useEffect } from 'react';
import { Course, Asset } from './courseBuilderTypes';
import { FolderKanban, Upload, FileText, Video, Music, Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react';
import { cbFetch } from './cbApi';

interface AssetManagerProps {
  course: Course;
}

export function AssetManager({ course }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [name, setName] = useState('');
  const [fileType, setFileType] = useState<'video' | 'audio' | 'image' | 'pdf' | 'document' | 'download'>('pdf');
  const [url, setUrl] = useState('');
  const [fileSize, setFileSize] = useState('2.1 MB');

  useEffect(() => {
    fetchAssets();
  }, [course.id]);

  const fetchAssets = async () => {
    try {
      const res = await cbFetch(`/api/courses/${course.id}/assets`);
      const data = await res.json();
      setAssets(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await cbFetch(`/api/courses/${course.id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          fileType,
          url: url || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileSize
        })
      });
      if (res.ok) {
        setName('');
        setUrl('');
        fetchAssets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    await cbFetch(`/api/assets/${id}`, { method: 'DELETE' });
    fetchAssets();
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-blue-600" />;
      case 'audio': return <Music className="w-5 h-5 text-purple-600" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-emerald-600" />;
      default: return <FileText className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Asset Manager: {course.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">Organize videos, audio files, PDFs, spreadsheets, and exercises for this course.</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FolderKanban className="w-6 h-6" />
        </div>
      </div>

      {/* Upload Asset Form */}
      <form onSubmit={handleAddAsset} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
          <Upload className="w-4 h-4 text-indigo-600" />
          <span>Add New Asset</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Name</label>
            <input
              type="text"
              placeholder="e.g. Treasury_Spreadsheet_Template.xlsx"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">File Type</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800"
            >
              <option value="pdf">PDF Document</option>
              <option value="document">Spreadsheet / Doc</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
              <option value="download">Downloadable Archive</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">File Size</label>
            <input
              type="text"
              placeholder="e.g. 3.4 MB"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">File URL / Source Link</label>
          <input
            type="text"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 font-mono"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-md transition-all"
          >
            Upload Asset
          </button>
        </div>
      </form>

      {/* Asset List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-base">Course Assets ({assets.length})</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {assets.map((ast) => (
            <div key={ast.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  {getAssetIcon(ast.fileType)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{ast.name}</p>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                    <span className="uppercase font-medium text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">{ast.fileType}</span>
                    <span>{ast.fileSize}</span>
                    <span>Uploaded {new Date(ast.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={ast.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Open Asset"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDeleteAsset(ast.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Asset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {assets.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              No assets attached to this course yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
