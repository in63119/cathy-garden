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
    expect(calendarSource).toContain("moveToToday");
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

  test("shows selected contest details after clicking a scheduled date", () => {
    const calendarSource = fs.readFileSync(
      path.join(rootDir, "components/contest-calendar.tsx"),
      "utf8",
    );
    const globalStyles = fs.readFileSync(
      path.join(rootDir, "src/app/globals.css"),
      "utf8",
    );

    expect(calendarSource).toContain("selectedContestId");
    expect(calendarSource).toContain("setSelectedContestId(contestEvents[0].id)");
    expect(calendarSource).toContain("contest-calendar-detail");
    expect(calendarSource).toContain("선택한 공모전 상세 정보를 확인합니다.");
    expect(calendarSource).toContain("공모전 이름");
    expect(calendarSource).toContain("<dd>{selectedContest.title}</dd>");
    expect(calendarSource).toContain("제출 마감일");
    expect(calendarSource).toContain("<dd>{selectedContest.deadline}</dd>");
    expect(calendarSource).toContain("prize: string");
    expect(calendarSource).toContain("상금");
    expect(calendarSource).toContain("<dd>{selectedContest.prize}</dd>");
    expect(calendarSource).toContain("captureImageObjectKey");
    expect(calendarSource).toContain("contests/spring-garden-photo/capture.png");
    expect(calendarSource).toContain("NEXT_PUBLIC_CONTEST_CAPTURE_BASE_URL");
    expect(calendarSource).toContain("contest-calendar-capture");
    expect(calendarSource).toContain("캡쳐 이미지");
    expect(calendarSource).toContain("aria-pressed={selectedContestIsOnDay}");
    expect(globalStyles).toContain(".contest-calendar-detail");
    expect(globalStyles).toContain(".contest-calendar-capture");
    expect(globalStyles).toContain(".contest-calendar-day.is-contest-day.is-selected");
  });

  test("marks today and lets users return to the current month", () => {
    const calendarSource = fs.readFileSync(
      path.join(rootDir, "components/contest-calendar.tsx"),
      "utf8",
    );
    const globalStyles = fs.readFileSync(
      path.join(rootDir, "src/app/globals.css"),
      "utf8",
    );

    expect(calendarSource).toContain("todayDateKey");
    expect(calendarSource).toContain("is-today");
    expect(calendarSource).toContain("contest-calendar-today-badge");
    expect(calendarSource).toContain("contest-calendar-today-button");
    expect(calendarSource).toContain("오늘");
    expect(globalStyles).toContain(".contest-calendar-day.is-today");
    expect(globalStyles).toContain(".contest-calendar-today-badge");
    expect(globalStyles).toContain(".contest-calendar-today-button");
  });
});
