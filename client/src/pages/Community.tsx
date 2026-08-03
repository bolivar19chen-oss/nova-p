import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { CommunityPost, commentOnPost, createPost, getPosts, likePost } from "@/lib/api";

interface CommunityProps {
  onBack: () => void;
  ownerName: string;
  city: string;
  petName: string;
}

const EMOJIS = ["🐶", "🐱", "🐾", "🐰", "🐦", "🐢"];

export default function Community({ onBack, ownerName, city, petName }: CommunityProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [draft, setDraft] = useState("");
  const [openComment, setOpenComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = async () => {
    try {
      const data = await getPosts();
      if (Array.isArray(data)) {
        setPosts(data);
        setOffline(false);
      } else {
        setOffline(true);
      }
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePost = async () => {
    if (!draft.trim()) return;
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    try {
      const post = await createPost({ author: ownerName, city, petName, text: draft.trim(), emoji });
      setPosts((p) => [post, ...p]);
      setDraft("");
    } catch {
      // Offline fallback: keep it local so the UI still feels alive
      const localPost: CommunityPost = {
        id: `local-${Date.now()}`,
        author: ownerName,
        city,
        petName,
        text: draft.trim(),
        emoji,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
      setPosts((p) => [localPost, ...p]);
      setDraft("");
      toast.info("Guardado localmente (backend no disponible en esta vista previa)");
    }
  };

  const handleLike = async (id: string) => {
    setPosts((p) => p.map((post) => (post.id === id ? { ...post, likes: post.likes.includes(ownerName) ? post.likes.filter((u) => u !== ownerName) : [...post.likes, ownerName] } : post)));
    try {
      await likePost(id, ownerName);
    } catch {
      /* optimistic update already applied */
    }
  };

  const handleComment = async (id: string) => {
    if (!commentDraft.trim()) return;
    setPosts((p) =>
      p.map((post) =>
        post.id === id
          ? { ...post, comments: [...post.comments, { id: `c-${Date.now()}`, author: ownerName, text: commentDraft.trim(), createdAt: new Date().toISOString() }] }
          : post
      )
    );
    const text = commentDraft.trim();
    setCommentDraft("");
    try {
      await commentOnPost(id, ownerName, text);
    } catch {
      /* optimistic update already applied */
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50" style={{ fontFamily: "'Geist', sans-serif" }}>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">
            My Pet Community
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {offline && (
          <Card className="p-3 bg-amber-50 border-amber-200 text-sm text-amber-800">
            No se pudo conectar al backend — mostrando la comunidad en modo local. Al desplegar el servidor esto se sincroniza para todos.
          </Card>
        )}

        <Card className="p-5 bg-white border-gray-100">
          <Textarea
            placeholder={`¿Qué está haciendo ${petName} hoy?`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button onClick={handlePost} className="gap-2">
              <Send size={16} /> Publicar
            </Button>
          </div>
        </Card>

        {loading ? (
          <p className="text-center text-gray-500">Cargando comunidad...</p>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center text-gray-500 bg-white border-gray-100">Sé el primero en compartir un momento con tu mascota 🐾</Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="p-5 bg-white border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple-light to-brand-cyan flex items-center justify-center text-white font-bold">
                  {post.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {post.author} {post.petName ? `· con ${post.petName} ${post.emoji}` : post.emoji}
                  </p>
                  <p className="text-xs text-gray-500">
                    {post.city} · {new Date(post.createdAt).toLocaleString("es-PA")}
                  </p>
                </div>
              </div>
              <p className="text-gray-800 mb-4">{post.text}</p>
              <div className="flex items-center gap-4 border-t pt-3">
                <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 text-sm ${post.likes.includes(ownerName) ? "text-red-500" : "text-gray-500"}`}>
                  <Heart size={16} fill={post.likes.includes(ownerName) ? "currentColor" : "none"} /> {post.likes.length}
                </button>
                <button onClick={() => setOpenComment(openComment === post.id ? null : post.id)} className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageCircle size={16} /> {post.comments.length}
                </button>
              </div>

              {openComment === post.id && (
                <div className="mt-3 space-y-2">
                  {post.comments.map((c) => (
                    <div key={c.id} className="text-sm bg-gray-50 rounded-lg p-2">
                      <b>{c.author}:</b> {c.text}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea
                      value={commentDraft}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="min-h-9 py-2"
                    />
                    <Button size="sm" onClick={() => handleComment(post.id)}>
                      Enviar
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
