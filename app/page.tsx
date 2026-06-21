import { unstable_noStore } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings } from "@/lib/db";
import { BeHomePage } from "@/components/be-home/BeHomePage";

/** ISR للمحتوى العام — البيانات المُخزَّنة مؤقتاً تُحدَّث كل 60 ثانية */
export const revalidate = 60;

export default async function HomePage() {
  const [session, homepageSettings] = await Promise.all([
    getServerSession(authOptions),
    getHomepageSettings(),
  ]);

  return (
    <div className="be-home">
      <BeHomePage homepageSettings={homepageSettings} session={session} />
    </div>
  );
}
