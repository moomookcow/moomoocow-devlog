"use client";

import { useEffect, useState } from "react";

import { createPostCommentAction } from "@/app/posts/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CommentNode } from "@/lib/comments";

type CommentsThreadProps = {
  slug: string;
  comments: CommentNode[];
  commentError: string | null;
  commentSuccess: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }) + " " + date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function CommentsThread({
  slug,
  comments,
  commentError,
  commentSuccess,
}: CommentsThreadProps) {
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);

  useEffect(() => {
    const forceScrollToPageBottom = () => {
      const scrollElement = document.scrollingElement ?? document.documentElement;
      const top = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        scrollElement.scrollHeight,
      );
      scrollElement.scrollTop = top;
      window.scrollTo({ top, behavior: "auto" });
    };

    const scrollToCommentsEnd = () => {
      if (window.location.hash !== "#comments-end") return;
      requestAnimationFrame(forceScrollToPageBottom);
      window.setTimeout(forceScrollToPageBottom, 120);
      window.setTimeout(forceScrollToPageBottom, 360);
    };

    scrollToCommentsEnd();
    window.addEventListener("hashchange", scrollToCommentsEnd);
    return () => {
      window.removeEventListener("hashchange", scrollToCommentsEnd);
    };
  }, []);

  return (
    <div id="comments" className="space-y-3">
      {commentError ? (
        <p className="text-sm text-destructive" role="alert">
          {commentError}
        </p>
      ) : null}
      {commentSuccess ? (
        <p className="text-sm text-foreground" role="status">
          댓글이 등록되었습니다.
        </p>
      ) : null}

      <form action={createPostCommentAction} className="space-y-2 border-b border-border/50 pb-3">
        <input type="hidden" name="slug" value={slug} />
        <Input name="authorName" className="h-10 rounded-none" placeholder="닉네임" required />
        <Input name="authorEmail" className="h-10 rounded-none" placeholder="이메일(선택)" />
        <Textarea
          name="content"
          className="korean-display min-h-28 rounded-none"
          placeholder="댓글을 입력하세요."
          required
        />
        <div className="flex justify-end">
          <Button type="submit" variant="outline" className="h-9 rounded-none px-4">
            댓글 등록
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <p className="korean-display text-base text-muted-foreground">댓글 {comments.length}개</p>
        {comments.length === 0 ? (
          <p className="korean-display text-sm text-muted-foreground">첫 댓글을 남겨보세요.</p>
        ) : (
          <ul className="space-y-2">
            {comments.map((node) => {
              const replyOpen = activeReplyCommentId === node.id;
              return (
                <li key={node.id} className="rounded-none bg-muted/35 p-3">
                  <div className="space-y-2">
                    <div className="space-y-1.5 bg-card/70 px-2.5 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 leading-none">
                          <p className="korean-display text-base">{node.authorName}</p>
                          <span className="font-mono text-xs text-muted-foreground">{formatDate(node.createdAt)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-7 rounded-none px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setActiveReplyCommentId(replyOpen ? null : node.id)}
                        >
                          {replyOpen ? "답글 닫기" : "답글 달기"}
                        </Button>
                      </div>
                      <p className="korean-display whitespace-pre-wrap text-sm leading-6 text-foreground/95">{node.content}</p>
                    </div>

                    {replyOpen ? (
                      <form action={createPostCommentAction} className="space-y-2 pt-1.5">
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="parentId" value={node.id} />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input name="authorName" className="h-9 rounded-none" placeholder="닉네임" required />
                          <Input name="authorEmail" className="h-9 rounded-none" placeholder="이메일(선택)" />
                        </div>
                        <Textarea name="content" className="korean-display min-h-20 rounded-none" placeholder="답글을 입력하세요." required />
                        <div className="flex justify-end">
                          <Button type="submit" variant="outline" className="h-8 rounded-none px-3">
                            답글 등록
                          </Button>
                        </div>
                      </form>
                    ) : null}

                    {node.replies.length > 0 ? (
                      <ul className="ml-5 space-y-1.5 pl-2">
                        {node.replies.map((reply) => (
                          <li key={reply.id} className="px-2 py-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="korean-display text-sm">{reply.authorName}</p>
                              <span className="font-mono text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                            </div>
                            <p className="korean-display mt-0.5 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{reply.content}</p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div id="comments-end" className="h-px w-full" aria-hidden="true" />
    </div>
  );
}
