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

export type RecentComment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  content: string;
  createdAt: string | null;
};

export type CommentStats = {
  total: number;
  recent7d: number;
  pendingReply: number;
};

const RECENT_DAYS = 7;
const PENDING_REPLY_AFTER_HOURS = 24;

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

export async function listRecentPublishedComments(
  supabase: SupabaseQueryClient,
  limit = 12,
): Promise<RecentComment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, parent_id, author_name, content, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const current = row as {
      id: string;
      post_id: string;
      parent_id: string | null;
      author_name: string;
      content: string;
      created_at: string | null;
    };
    return {
      id: current.id,
      postId: current.post_id,
      parentId: current.parent_id,
      authorName: current.author_name,
      content: current.content,
      createdAt: current.created_at,
    };
  });
}

export async function getPublishedCommentStats(
  supabase: SupabaseQueryClient,
): Promise<CommentStats> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, parent_id, created_at")
    .eq("status", "published");

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<{
    id: string;
    parent_id: string | null;
    created_at: string | null;
  }>;

  const now = Date.now();
  const recentWindowStart = now - RECENT_DAYS * 24 * 60 * 60 * 1000;
  const pendingReplyThreshold = now - PENDING_REPLY_AFTER_HOURS * 60 * 60 * 1000;
  const repliedRootIds = new Set<string>();
  const createdAtById = new Map<string, number | null>();

  let recent7d = 0;
  rows.forEach((row) => {
    const ts = row.created_at ? new Date(row.created_at).getTime() : Number.NaN;
    createdAtById.set(row.id, Number.isNaN(ts) ? null : ts);

    if (row.parent_id) {
      repliedRootIds.add(row.parent_id);
    }
    if (!Number.isNaN(ts) && ts >= recentWindowStart) {
      recent7d += 1;
    }
  }); 

  const pendingReply = rows.reduce((acc, row) => {
    if (row.parent_id) return acc;
    if (repliedRootIds.has(row.id)) return acc;
    const createdAt = createdAtById.get(row.id);
    if (!createdAt) return acc;
    if (createdAt > pendingReplyThreshold) return acc;
    return acc + 1;
  }, 0);

  return {
    total: rows.length,
    recent7d,
    pendingReply,
  };
}
