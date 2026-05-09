import { HeroSection } from "@/components/hero-section";

export default function HomePage() {
  return (
    <div style={{ paddingBottom: "48px" }}>
      <HeroSection
        title="Cathy Garden"
        description="매일 쓰는 작은 기능들을 한 사람의 흐름에 맞춰 모아둔 개인 전용 사이트입니다."
      />
    </div>
  );
}
