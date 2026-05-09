import fs from "fs";
import path from "path";

describe("contest calendar placement", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("renders the contest calendar before the home hero content", () => {
    const homePageSource = fs.readFileSync(
      path.join(rootDir, "src/app/page.tsx"),
      "utf8",
    );

    expect(homePageSource).toContain("ContestCalendar");
    expect(homePageSource.indexOf("<ContestCalendar />")).toBeGreaterThan(-1);
    expect(homePageSource.indexOf("<ContestCalendar />")).toBeLessThan(
      homePageSource.indexOf("<HeroSection"),
    );
  });

  test("provides an accessible contest calendar section", () => {
    const calendarSource = fs.readFileSync(
      path.join(rootDir, "components/contest-calendar.tsx"),
      "utf8",
    );

    expect(calendarSource).toContain('"use client"');
    expect(calendarSource).toContain('aria-labelledby="contest-calendar-title"');
    expect(calendarSource).toContain('aria-label="이전 달 보기"');
    expect(calendarSource).toContain('aria-label="다음 달 보기"');
    expect(calendarSource).toContain("moveMonth(-1)");
    expect(calendarSource).toContain("moveMonth(1)");
    expect(calendarSource).toContain("공모전 달력");
    expect(calendarSource).toContain("아직 등록된 공모전 일정이 없습니다.");
  });

  test("distinguishes dates that have contest schedules", () => {
    const calendarSource = fs.readFileSync(
      path.join(rootDir, "components/contest-calendar.tsx"),
      "utf8",
    );
    const globalStyles = fs.readFileSync(
      path.join(rootDir, "src/app/globals.css"),
      "utf8",
    );

    expect(calendarSource).toContain("contestScheduleItems");
    expect(calendarSource).toContain("is-contest-day");
    expect(calendarSource).toContain("contest-calendar-badge");
    expect(calendarSource).toContain("공모전 일정");
    expect(globalStyles).toContain(".contest-calendar-day.is-contest-day");
    expect(globalStyles).toContain(".contest-calendar-badge");
  });
});
