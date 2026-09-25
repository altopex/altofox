"use client";

import React, { useState, useMemo } from "react";
import {
  generateBlogTopicIdeas,
  BlogTopicSuggestion,
  BlogPostData,
  renderBlogIndexHtml,
} from "../lib/blog/blog-engine";
import { Theme } from "../lib/themes";
import { SiteInfoJSON } from "../lib/generator/content-schema";
import {
  BookOpen,
  Sparkles,
  Plus,
  Check,
  Loader2,
  FileText,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

interface BlogManagerProps {
  businessType: string;
  city: string;
  state: string;
  services: string[];
  businessInfo: SiteInfoJSON;
  theme: Theme;
  domain: string;
  existingPosts: BlogPostData[];
  onAddBlogPost: (newFile: { path: string; content: string }, postData: BlogPostData) => void;
  onUpdateBlogIndex: (indexFile: { path: string; content: string }) => void;
}

export function BlogManager({
  businessType,
  city,
  state,
  services,
  businessInfo,
  theme,
  domain,
  existingPosts,
  onAddBlogPost,
  onUpdateBlogIndex,
}: BlogManagerProps) {
  const [showTopicDrawer, setShowTopicDrawer] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");

  // Custom Topic Form
  const [customTitle, setCustomTitle] = useState("");
  const [customKeyword, setCustomKeyword] = useState("");

  // 15 suggested topics
  const suggestedTopics = useMemo(() => {
    return generateBlogTopicIdeas(businessType, city, state, services);
  }, [businessType, city, state, services]);

  const toggleTopic = (id: string) => {
    if (selectedTopics.includes(id)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== id));
    } else {
      if (selectedTopics.length >= 10) {
        alert("Limit 10 posts per batch to maintain high content quality and depth.");
        return;
      }
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  // Generate Selected Topics
  const handleGenerateBatch = async () => {
    const topicsToGenerate = suggestedTopics.filter((t) => selectedTopics.includes(t.id));
    if (topicsToGenerate.length === 0) return;

    setIsGenerating(true);
    let allUpdatedPosts = [...existingPosts];

    for (let i = 0; i < topicsToGenerate.length; i++) {
      const topic = topicsToGenerate[i];
      setGenerationProgress(`Writing post ${i + 1} of ${topicsToGenerate.length}: "${topic.title}"…`);

      try {
        const res = await fetch("/api/blog/generate-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            businessInfo,
            themeId: theme.id,
            domain,
          }),
        });

        const data = await res.json();
        if (data.success && data.postData && data.fullHtml) {
          onAddBlogPost(
            { path: `blog/${topic.slug}.html`, content: data.fullHtml },
            data.postData
          );
          allUpdatedPosts.push(data.postData);
        }
      } catch (err) {
        console.error("Blog generation error:", err);
      }
    }

    // Re-render blog.html index
    const blogIndexHtml = renderBlogIndexHtml(allUpdatedPosts, businessInfo, theme);
    onUpdateBlogIndex({ path: "blog.html", content: blogIndexHtml });

    setIsGenerating(false);
    setShowTopicDrawer(false);
    setSelectedTopics([]);
    setGenerationProgress("");
  };

  // Add Custom Topic
  const handleAddCustomTopic = async () => {
    if (!customTitle.trim() || !customKeyword.trim()) return;

    const topic: BlogTopicSuggestion = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      slug: customTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      primaryKeyword: customKeyword.trim(),
      category: "guide",
      searchIntent: "Informational",
      estimatedWords: 1400,
    };

    setIsGenerating(true);
    setGenerationProgress(`Writing custom guide: "${topic.title}"…`);

    try {
      const res = await fetch("/api/blog/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          businessInfo,
          themeId: theme.id,
          domain,
        }),
      });

      const data = await res.json();
      if (data.success && data.postData && data.fullHtml) {
        onAddBlogPost(
          { path: `blog/${topic.slug}.html`, content: data.fullHtml },
          data.postData
        );
        const updated = [...existingPosts, data.postData];
        const blogIndexHtml = renderBlogIndexHtml(updated, businessInfo, theme);
        onUpdateBlogIndex({ path: "blog.html", content: blogIndexHtml });
      }
    } catch (err) {
      console.error("Custom blog post error:", err);
    } finally {
      setIsGenerating(false);
      setCustomTitle("");
      setCustomKeyword("");
      setGenerationProgress("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Local Blog &amp; Content Marketing Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generates 1200–1800 word guides with author E-E-A-T credentials and internal links to support local search rankings.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowTopicDrawer(!showTopicDrawer)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Suggest 15 Trade Topics</span>
          </button>
        </div>
      </div>

      {/* Suggested Topics Drawer */}
      {showTopicDrawer && (
        <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                15 High-Intent Topic Suggestions for {businessType} in {city}
              </h3>
              <p className="text-[11px] text-slate-500">
                Select up to 10 topics to generate high-depth educational articles.
              </p>
            </div>
            {selectedTopics.length > 0 && (
              <button
                type="button"
                onClick={handleGenerateBatch}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{generationProgress || "Writing Articles…"}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Selected ({selectedTopics.length})</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {suggestedTopics.map((top) => {
              const selected = selectedTopics.includes(top.id);
              return (
                <div
                  key={top.id}
                  onClick={() => toggleTopic(top.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition text-xs flex flex-col justify-between space-y-2 ${
                    selected
                      ? "border-indigo-600 bg-white ring-1 ring-indigo-500 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                        {top.category}
                      </span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          selected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300"
                        }`}
                      >
                        {selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 leading-snug">{top.title}</h4>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>Keyword: <em>{top.primaryKeyword}</em></span>
                    <span>~{top.estimatedWords}w</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generated Articles List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">
            Published Articles ({existingPosts.length})
          </span>
          <a
            href="blog.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline flex items-center space-x-1"
          >
            <span>View blog.html index</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {existingPosts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <BookOpen className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">No blog posts generated yet.</p>
            <p className="text-[11px] text-slate-400">
              Click &quot;Suggest 15 Trade Topics&quot; above to create high-ranking homeowner guides.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {existingPosts.map((post) => (
              <div
                key={post.slug}
                className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{post.datePublished}</span>
                  <span>{post.wordCount} words</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{post.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {post.metaDescription}
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">blog/{post.slug}.html</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                    Live
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
