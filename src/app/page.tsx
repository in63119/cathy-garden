import { ContestCalendar } from "@/components/contest-calendar";
import { HeroSection } from "@/components/hero-section";
import { isAuthenticated } from "@/lib/auth-server";

export default async function HomePage() {
  const authenticated = await isAuthenticated();

  return (
    <div style={{ paddingBottom: "48px" }}>
      {authenticated ? <ContestCalendar /> : null}
      <HeroSection
        title="Cathy Garden"
        description="간직하고 싶은 사진과 영상을 올리고, 정리하고, 다시 꺼내 보는 개인 보관함입니다."
      />
    </div>
  );
}
