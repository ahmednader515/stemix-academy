import { getUserById } from "@/lib/db";
import { CourseChatPanel } from "./CourseChatPanel";

type SessionUser = {
  id: string;
  name?: string | null;
  role: string;
};

type Props = {
  courseId: string;
  courseTitle: string;
  createdById: string | null;
  session: { user: SessionUser } | null;
  groupOnly?: boolean;
  privateConversationId?: string | null;
  defaultTab?: "group" | "private";
  compact?: boolean;
};

export async function CourseChatSection({
  courseId,
  courseTitle,
  createdById,
  session,
  groupOnly = false,
  privateConversationId = null,
  defaultTab = "group",
  compact = false,
}: Props) {
  if (!session?.user?.id) return null;

  let creatorRole: string | null = null;
  if (createdById) {
    const creator = await getUserById(createdById);
    creatorRole = creator?.role ?? null;
  }

  const role = session.user.role;
  const staffOnCoursePage = role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";

  return (
    <div className={compact ? "mt-4" : "mt-8"}>
      <CourseChatPanel
        courseId={courseId}
        courseTitle={courseTitle}
        creatorId={createdById}
        creatorRole={creatorRole}
        userRole={role}
        userId={session.user.id}
        userName={session.user.name ?? ""}
        groupOnly={groupOnly || (staffOnCoursePage && !privateConversationId)}
        privateConversationId={privateConversationId}
        defaultTab={defaultTab}
        compact={compact}
      />
    </div>
  );
}
