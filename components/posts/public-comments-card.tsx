import CommentsThread from "@/components/posts/comments-thread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublishedCommentsByPostId } from "@/lib/comments";
import { createPublicClient } from "@/lib/supabase/server";

type PublicCommentsCardProps = {
  postId: string;
  slug: string;
  commentError: string | null;
  commentSuccess: boolean;
};

export default async function PublicCommentsCard({
  postId,
  slug,
  commentError,
  commentSuccess,
}: PublicCommentsCardProps) {
  const supabase = createPublicClient();
  const comments = await listPublishedCommentsByPostId(supabase, postId);

  return (
    <Card className="surface-panel rounded-none">
      <CardHeader>
        <CardTitle className="korean-display text-2xl">댓글 남기기</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <CommentsThread
          slug={slug}
          comments={comments}
          commentError={commentError ?? null}
          commentSuccess={commentSuccess}
        />
      </CardContent>
    </Card>
  );
}
