import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Plus, Pencil, Trash2, Image as ImageIcon, Upload, X, Loader2,
  Calendar, ArrowLeft, Eye, EyeOff, AlertTriangle
} from "lucide-react";

interface BlogPostSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  author: string;
  coverImage: string;
}

interface BlogPostFull extends BlogPostSummary {
  content: string;
}

interface BlogManagerProps {
  adminToken: string | null;
  onUnauthorized?: () => void;
}

const emptyForm = {
  title: "",
  description: "",
  category: "General",
  author: "Vision79 Digital Expert",
  date: new Date().toISOString().split("T")[0],
  coverImage: "",
  content: ""
};

export function BlogManager({ adminToken, onUnauthorized }: BlogManagerProps) {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<"list" | "editor">("list");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BlogPostSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const inlineFileInputRef = useRef<HTMLInputElement | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const getHeaders = useCallback((withJson: boolean) => {
    let token = adminToken;
    if (!token) {
      try {
        token = sessionStorage.getItem("admin-token");
      } catch {
        token = null;
      }
    }
    return {
      ...(withJson ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }, [adminToken]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/articles");
      if (!res.ok) throw new Error("Failed to load posts.");
      const data = await res.json();
      const sorted = [...data].sort((a: BlogPostSummary, b: BlogPostSummary) =>
        (b.date || "").localeCompare(a.date || "")
      );
      setPosts(sorted);
    } catch (e: any) {
      setLoadError(e.message || "Failed to load posts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const startCreate = () => {
    setEditingSlug(null);
    setForm({ ...emptyForm });
    setSaveError(null);
    setShowPreview(false);
    setView("editor");
  };

  const startEdit = async (slug: string) => {
    setSaveError(null);
    try {
      const res = await fetch(`/api/articles/${slug}`);
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (!res.ok) throw new Error("Failed to load this post.");
      const data: BlogPostFull = await res.json();
      setEditingSlug(slug);
      setForm({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "General",
        author: data.author || "Vision79 Digital Expert",
        date: data.date || new Date().toISOString().split("T")[0],
        coverImage: data.coverImage || "",
        content: data.content || ""
      });
      setShowPreview(false);
      setView("editor");
    } catch (e: any) {
      setSaveError(e.message || "Failed to load this post.");
    }
  };

  const cancelEditor = () => {
    setView("list");
    setEditingSlug(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setSaveError("A title is required.");
      return;
    }
    if (!form.content.trim()) {
      setSaveError("Post content is required.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const url = editingSlug ? `/api/admin/articles/${editingSlug}` : "/api/admin/articles";
      const method = editingSlug ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getHeaders(true),
        body: JSON.stringify(form)
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save the post.");
      }
      await fetchPosts();
      setView("list");
      setEditingSlug(null);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save the post.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${deleteTarget.slug}`, {
        method: "DELETE",
        headers: getHeaders(false)
      });
      if (res.status === 401) {
        onUnauthorized?.();
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete the post.");
      }
      setDeleteTarget(null);
      await fetchPosts();
    } catch (e: any) {
      setLoadError(e.message || "Failed to delete the post.");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: getHeaders(false),
      body: formData
    });
    if (res.status === 401) {
      onUnauthorized?.();
      throw new Error("Session expired.");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Image upload failed.");
    return data.url as string;
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setSaveError(null);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, coverImage: url }));
    } catch (err: any) {
      setSaveError(err.message || "Cover image upload failed.");
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    }
  };

  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInline(true);
    setSaveError(null);
    try {
      const url = await uploadFile(file);
      const markdownImage = `\n\n![${file.name.replace(/\.[^/.]+$/, "")}](${url})\n\n`;
      const textarea = contentTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? form.content.length;
        const end = textarea.selectionEnd ?? form.content.length;
        const next = form.content.slice(0, start) + markdownImage + form.content.slice(end);
        setForm((f) => ({ ...f, content: next }));
      } else {
        setForm((f) => ({ ...f, content: f.content + markdownImage }));
      }
    } catch (err: any) {
      setSaveError(err.message || "Image upload failed.");
    } finally {
      setUploadingInline(false);
      if (inlineFileInputRef.current) inlineFileInputRef.current.value = "";
    }
  };

  // ==================== LIST VIEW ====================
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-app-text tracking-tight">Blog Posts</h2>
            <p className="text-xs text-app-text-sec">Create, edit, and publish posts to the Resources page.</p>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-text text-app-bg text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>

        {loadError && (
          <div className="p-3 rounded-lg text-xs font-mono border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-app-text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 bg-app-btn-sec/15 rounded-xl border border-dashed border-app-border/45">
            <ImageIcon className="w-8 h-8 text-app-text-muted" />
            <span className="text-sm font-semibold text-app-text">No posts yet</span>
            <span className="text-xs text-app-text-muted">Create your first post to populate the Resources page.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.slug}
                className="glass rounded-2xl overflow-hidden border border-app-border bg-app-aside-bg/50 flex flex-col"
              >
                <div className="h-32 bg-app-btn-sec/40 overflow-hidden">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-app-text-muted">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">{post.category}</span>
                  <h3 className="text-sm font-bold text-app-text leading-snug line-clamp-2">{post.title}</h3>
                  <p className="text-xs text-app-text-sec line-clamp-2 flex-1">{post.description}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-app-text-muted font-mono">
                    <Calendar className="w-3 h-3" />
                    {post.date || "—"}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-app-border/40 mt-1">
                    <button
                      onClick={() => startEdit(post.slug)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-btn-sec hover:bg-app-btn-sec/80 border border-app-border text-xs font-semibold text-app-text transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(post)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400 transition cursor-pointer"
                      title="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div className="glass max-w-sm w-full rounded-2xl border border-red-500/25 bg-app-aside-bg p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-app-text">Delete this post?</h3>
                  <p className="text-xs text-app-text-sec">"{deleteTarget.title}" will be permanently removed.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-app-btn-sec border border-app-border text-app-text hover:bg-app-btn-sec/80 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==================== EDITOR VIEW ====================
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={cancelEditor}
            className="p-2 rounded-lg bg-app-btn-sec hover:bg-app-btn-sec/80 border border-app-border text-app-text transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold font-display text-app-text tracking-tight">
              {editingSlug ? "Edit Post" : "New Post"}
            </h2>
            <p className="text-xs text-app-text-sec">{editingSlug ? `Editing: ${editingSlug}` : "This will be published to the Resources page."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((p) => !p)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-app-btn-sec border border-app-border hover:bg-app-btn-sec/80 text-app-text transition cursor-pointer"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-app-text text-app-bg hover:opacity-90 transition-opacity cursor-pointer shadow-sm disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {editingSlug ? "Save Changes" : "Publish Post"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-3 rounded-lg text-xs font-mono border bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: metadata */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass rounded-2xl p-5 bg-app-aside-bg/50 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-app-text-sec">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Post title"
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-sm focus:outline-none focus:border-app-border/80"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-app-text-sec">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short summary shown in listings"
                rows={3}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-sm focus:outline-none focus:border-app-border/80 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-app-text-sec">Category</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-sm focus:outline-none focus:border-app-border/80"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-app-text-sec">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-sm focus:outline-none focus:border-app-border/80"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-app-text-sec">Author</label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-sm focus:outline-none focus:border-app-border/80"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-app-text-sec">Cover Image</label>
              {form.coverImage && (
                <div className="w-full h-28 rounded-lg overflow-hidden bg-app-btn-sec/40 border border-app-border">
                  <img src={form.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                  placeholder="Image URL, or upload below"
                  className="flex-1 bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-xs focus:outline-none focus:border-app-border/80"
                />
              </div>
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleCoverUpload}
                className="hidden"
                id="cover-upload-input"
              />
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                disabled={uploadingCover}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-app-btn-sec hover:bg-app-btn-sec/80 border border-app-border text-xs font-semibold text-app-text transition cursor-pointer disabled:opacity-60"
              >
                {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploadingCover ? "Uploading..." : "Upload Cover Image"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: content editor / preview */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono uppercase tracking-wider text-app-text-sec">Content (Markdown)</label>
            <input
              ref={inlineFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleInlineImageUpload}
              className="hidden"
              id="inline-upload-input"
            />
            <button
              type="button"
              onClick={() => inlineFileInputRef.current?.click()}
              disabled={uploadingInline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-semibold text-indigo-400 transition cursor-pointer disabled:opacity-60"
            >
              {uploadingInline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              {uploadingInline ? "Uploading..." : "Insert Image"}
            </button>
          </div>

          {showPreview ? (
            <div className="glass rounded-2xl p-6 bg-app-aside-bg/50 min-h-[420px] prose prose-sm dark:prose-invert max-w-none overflow-y-auto">
              <ReactMarkdown>{form.content || "*Nothing to preview yet.*"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              ref={contentTextareaRef}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="# Post title&#10;&#10;Write your post in Markdown..."
              rows={20}
              className="w-full bg-app-input border border-app-input-border text-app-text rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-app-border/80 resize-y min-h-[420px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
