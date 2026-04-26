import type { createClient } from "@/lib/supabase/server";

type SupabaseQueryClient = {
  from: Awaited<ReturnType<typeof createClient>>["from"];
};

export type CommentStatus = "published" | "hidden";

export type Comment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  authorEmail: string | null;
  content: string;
  status: CommentStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CommentNode = Comment & {
  replies: CommentNode[];
};

type CommentRow = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string | null;
  content: string;
  status: CommentStatus;
  created_at: string | null;
  updated_at: string | null;
};

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    content: row.content,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedCommentsByPostId(
  supabase: SupabaseQueryClient,
  postId: string,
): Promise<CommentNode[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, parent_id, author_name, author_email, content, status, created_at, updated_at")
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  const comments = (data ?? []).map((row) => mapComment(row as CommentRow));
  const nodeById = new Map<string, CommentNode>();
  comments.forEach((comment) => {
    nodeById.set(comment.id, { ...comment, replies: [] });
  });

  const roots: CommentNode[] = [];
  comments.forEach((comment) => {
    const current = nodeById.get(comment.id)!;
    if (!comment.parentId) {
      roots.push(current);
      return;
    }
    const parent = nodeById.get(comment.parentId);
    if (!parent) {
      roots.push(current);
      return;
    }
    parent.replies.push(current);
  });

  return roots;
}

export async function getCommentById(
  supabase: SupabaseQueryClient,
  commentId: string,
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, parent_id, author_name, author_email, content, status, created_at, updated_at")
    .eq("id", commentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;
  return mapComment(data as CommentRow);
}

export async function createComment(
  supabase: SupabaseQueryClient,
  input: {
    postId: string;
    parentId?: string | null;
    authorName: string;
    authorEmail?: string | null;
    content: string;
  },
): Promise<Comment> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: input.postId,
      parent_id: input.parentId ?? null,
      author_name: input.authorName.trim(),
      author_email: input.authorEmail?.trim() || null,
      content: input.content.trim(),
      status: "published",
      updated_at: now,
    })
    .select("id, post_id, parent_id, author_name, author_email, content, status, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return mapComment(data as CommentRow);
}

