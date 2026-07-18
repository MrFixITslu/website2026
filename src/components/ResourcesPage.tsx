import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Calendar, User, Tag, BookOpen, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { BlogArticle } from "../types";

interface ResourcesPageProps {
  onNavigate?: (v: string) => void;
}

export default function ResourcesPage({ onNavigate }: ResourcesPageProps) {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
        else setError("Failed to load articles.");
      })
      .catch(() => setError("Could not connect to the server."))
      .finally(() => setLoading(false));
  }, []);

  const openArticle = async (slug: string) => {
    setLoadingArticle(true);
    try {
      const r = await fetch(`/api/articles/${slug}`);
      const data = await r.json();
      setSelectedArticle(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not load article.");
    } finally {
      setLoadingArticle(false);
    }
  };

  const closeArticle = () => {
    setSelectedArticle(null);
  };

  if (selectedArticle) {
    return (
      <div className="pb-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 space-y-8">
          <button
            onClick={closeArticle}
            className="flex items-center gap-2 text-sm text-app-text-muted hover:text-indigo-400 transition font-mono mt-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Resources
          </button>

          {selectedArticle.coverImage && (
            <div className="rounded-2xl overflow-hidden h-56 sm:h-72">
              <img
                src={selectedArticle.coverImage}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-app-text-muted">
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{selectedArticle.category}</span>
              {selectedArticle.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{selectedArticle.date}</span>}
              {selectedArticle.author && <span className="flex items-center gap-1"><User className="w-3 h-3" />{selectedArticle.author}</span>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-app-text dark:text-white leading-tight">
              {selectedArticle.title}
            </h1>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-app-text prose-p:text-app-text-sec prose-p:font-light prose-p:leading-relaxed prose-strong:text-app-text prose-li:text-app-text-sec prose-li:font-light prose-a:text-indigo-400 prose-code:text-indigo-400 prose-code:bg-indigo-500/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
            <ReactMarkdown>{selectedArticle.content || ""}</ReactMarkdown>
          </div>

          <div className="pt-6 border-t border-app-border">
            <div className="glass rounded-2xl p-6 text-center space-y-3 border border-indigo-500/20">
              <p className="text-sm text-app-text-sec font-light">Have questions? Our team is ready to help your business implement these best practices.</p>
              <button
                onClick={() => onNavigate?.("contact")}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition mx-auto cursor-pointer"
              >
                Talk to an Expert <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16">
      <section className="pt-10 px-6 lg:px-8 text-center space-y-4">
        <span className="text-[10px] font-mono uppercase font-extrabold tracking-[0.25em] text-indigo-400">Knowledge Base</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white">
          Resources & ICT Insights
        </h1>
        <p className="max-w-xl mx-auto text-sm text-app-text-sec font-light leading-relaxed">
          Expert guidance on cybersecurity, cloud infrastructure, and business technology from the V79SL team.
        </p>
      </section>

      <section className="px-6 lg:px-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass rounded-2xl border border-app-border h-80 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-app-text-muted" />
            <p className="text-sm text-app-text-muted font-mono">{error}</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-app-text-muted" />
            <p className="text-sm text-app-text-muted">No articles found. Check back soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article, i) => (
              <motion.button
                key={article.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => openArticle(article.slug)}
                className="glass rounded-2xl border border-app-border hover:border-indigo-500/30 text-left overflow-hidden group transition-all duration-300 hover:shadow-lg cursor-pointer"
              >
                {article.coverImage && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
                    <Tag className="w-3 h-3" />
                    {article.category}
                  </div>
                  <h3 className="font-extrabold text-sm font-display text-app-text dark:text-white group-hover:text-indigo-400 transition leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-[11px] text-app-text-sec font-light leading-relaxed line-clamp-2">{article.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-app-border/50">
                    <div className="flex items-center gap-3 text-[10px] text-app-text-muted font-mono">
                      {article.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{article.date}</span>}
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
