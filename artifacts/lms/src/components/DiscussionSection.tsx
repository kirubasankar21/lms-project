import { useState } from "react";
import { useListDiscussions, useCreateDiscussion, getListDiscussionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Reply } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function PostCard({ post, courseId, depth = 0 }: { post: { id: number; userId: string; userName?: string | null; userAvatarUrl?: string | null; message: string; replies?: object[]; createdAt: string }; courseId: number; depth?: number }) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const queryClient = useQueryClient();
  const createDiscussion = useCreateDiscussion();

  const handleReply = () => {
    if (!reply.trim()) return;
    createDiscussion.mutate({ courseId, data: { message: reply, parentId: post.id } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDiscussionsQueryKey(courseId) });
        setReply("");
        setReplying(false);
      },
    });
  };

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
      <div className="bg-card border border-border rounded-xl p-3 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={post.userAvatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{post.userName?.[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{post.userName ?? "User"}</span>
          <span className="text-xs text-muted-foreground ml-auto">{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <p className="text-sm text-foreground">{post.message}</p>
        {depth === 0 && (
          <button onClick={() => setReplying(v => !v)} className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-primary transition-colors">
            <Reply className="w-3 h-3" /> Reply
          </button>
        )}
      </div>
      {replying && (
        <div className="ml-4 mb-3 flex gap-2">
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Write a reply..."
            className="text-sm min-h-16 resize-none"
          />
          <div className="flex flex-col gap-1">
            <Button size="sm" onClick={handleReply} disabled={createDiscussion.isPending}>
              <Send className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>Cancel</Button>
          </div>
        </div>
      )}
      {(post.replies as typeof post[])?.map(r => (
        <PostCard key={r.id} post={r} courseId={courseId} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function DiscussionSection({ courseId }: { courseId: number }) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useListDiscussions(courseId);
  const createDiscussion = useCreateDiscussion();

  const handlePost = () => {
    if (!message.trim()) return;
    createDiscussion.mutate({ courseId, data: { message } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDiscussionsQueryKey(courseId) });
        setMessage("");
      },
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Discussion</h3>
        <span className="text-xs text-muted-foreground">({posts?.length ?? 0} posts)</span>
      </div>

      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Ask a question or share your thoughts..."
          className="text-sm min-h-20 resize-none"
        />
        <Button onClick={handlePost} disabled={createDiscussion.isPending || !message.trim()} className="self-end">
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground text-center py-4">Loading...</div>}

      {!isLoading && posts?.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No posts yet. Be the first to start the discussion!
        </div>
      )}

      <div className="space-y-3">
        {posts?.map(post => (
          <PostCard key={post.id} post={post as typeof post & { replies: object[] }} courseId={courseId} />
        ))}
      </div>
    </div>
  );
}
