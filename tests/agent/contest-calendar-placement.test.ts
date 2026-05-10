import fs from "fs";
import path from "path";

describe("contest calendar placement", () => {
  const rootDir = path.resolve(__dirname, "../..");

  test("renders the contest calendar on the protected contests page", () => {
    const contestsPageSource = fs.readFileSync(
      path.join(rootDir, "src/app/(private)/contests/page.tsx"),
      "utf8",
    );
    const homePageSource = fs.readFileSync(
      path.join(rootDir, "src/app/page.tsx"),
      "utf8",
    );
    const headerSource = fs.readFileSync(
      path.join(rootDir, "components/site-header.tsx"),
      "utf8",
    );

    expect(contestsPageSource).toContain("ContestCalendar");
    expect(contestsPageSource).toContain("<ContestCalendar />");
    expect(homePageSource).not.toContain("ContestCalendar");
    expect(headerSource).toContain('{ href: "/contests", label: "공모전" }');
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

    expect(calendarSource).toContain('fetch("/api/contests")');
    expect(calendarSource).toContain("contests");
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
    expect(calendarSource).toContain("prizeItems: ContestPrizeItem[]");
    expect(calendarSource).toContain("buildPrizeSummary");
    expect(calendarSource).toContain("getPrizeItemCountLabel");
    expect(calendarSource).toContain("getPrizeSummaryLabel");
    expect(calendarSource).toContain("상금");
    expect(calendarSource).toContain("contest-prize-editor");
    expect(calendarSource).toContain("contest-prize-row");
    expect(calendarSource).toContain("상금 항목 추가");
    expect(calendarSource).toContain("contest-prize-panel");
    expect(calendarSource).toContain("contest-prize-summary");
    expect(calendarSource).toContain("contest-prize-list");
    expect(calendarSource).toContain("captureImageObjectKey");
    expect(calendarSource).toContain("contestCaptureImages");
    expect(calendarSource).toContain("/api/contests/${selectedContestId}/capture");
    expect(calendarSource).toContain("setContestCaptureFiles");
    expect(calendarSource).toContain("multiple");
    expect(calendarSource).toContain("contest-calendar-capture-grid");
    expect(calendarSource).toContain("isCapturePreviewOpen");
    expect(calendarSource).toContain("setIsCapturePreviewOpen(true)");
    expect(calendarSource).toContain('role="dialog"');
    expect(calendarSource).toContain("aria-modal=\"true\"");
    expect(calendarSource).toContain("크게 보기");
    expect(calendarSource).toContain("contest-calendar-capture");
    expect(calendarSource).toContain("캡쳐 이미지");
    expect(calendarSource).toContain("aria-pressed={selectedContestIsOnDay}");
    expect(globalStyles).toContain(".contest-calendar-detail");
    expect(globalStyles).toContain(".contest-prize-editor");
    expect(globalStyles).toContain(".contest-prize-panel");
    expect(globalStyles).toContain(".contest-prize-summary");
    expect(globalStyles).toContain(".contest-prize-plain");
    expect(globalStyles).toContain(".contest-prize-list");
    expect(globalStyles).toContain(".contest-calendar-capture");
    expect(globalStyles).toContain(".contest-calendar-capture-grid");
    expect(globalStyles).toContain(".contest-calendar-capture-button");
    expect(globalStyles).toContain(".contest-capture-lightbox");
    expect(globalStyles).toContain(".contest-calendar-day.is-contest-day.is-selected");
  });

  test("registers, edits, and deletes contests through the contests API", () => {
    const calendarSource = fs.readFileSync(
      path.join(rootDir, "components/contest-calendar.tsx"),
      "utf8",
    );
    const globalStyles = fs.readFileSync(
      path.join(rootDir, "src/app/globals.css"),
      "utf8",
    );

    expect(calendarSource).toContain("공모전 등록");
    expect(calendarSource).toContain("공모전 수정");
    expect(calendarSource).toContain("startCreatingContest(calendarDay.dateKey)");
    expect(calendarSource).toContain("isSelectedDate");
    expect(calendarSource).toContain("calendarDay.dateKey === selectedDateKey");
    expect(calendarSource).toContain('isSelectedDate || selectedContestIsOnDay ? "is-selected" : ""');
    expect(calendarSource).toContain("requestPresignedContestCaptureUpload");
    expect(calendarSource).toContain("uploadFileToPresignedUrl");
    expect(calendarSource).toContain("캡쳐 이미지 파일");
    expect(calendarSource).toContain('accept="image/*"');
    expect(calendarSource).toContain("saveContest");
    expect(calendarSource).toContain("deleteContest");
    expect(calendarSource).toContain('method = editingContestId ? "PUT" : "POST"');
    expect(calendarSource).toContain('method: "DELETE"');
    expect(calendarSource).toContain("contest-calendar-detail-actions");
    expect(globalStyles).toContain(".contest-manager");
    expect(globalStyles).toContain(".contest-calendar-detail-actions");
    expect(globalStyles).toContain(".contest-calendar-day.is-selected");
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

  test("stores an idea memo separately for each contest", () => {
    const calendarSource = fs.readFileSync(
      path.join(rootDir, "components/contest-calendar.tsx"),
      "utf8",
    );
    const globalStyles = fs.readFileSync(
      path.join(rootDir, "src/app/globals.css"),
      "utf8",
    );

    expect(calendarSource).toContain("/api/contests/${selectedContestId}/idea-memo");
    expect(calendarSource).toContain('method: "PUT"');
    expect(calendarSource).toContain("JSON.stringify({ memo: ideaMemo })");
    expect(calendarSource).toContain("아이디어 메모장");
    expect(calendarSource).toContain("메모 저장");
    expect(calendarSource).toContain('aria-live="polite"');
    expect(globalStyles).toContain(".contest-calendar-memo");
    expect(globalStyles).toContain(".contest-calendar-memo-actions");
  });

  test("shows a per-contest submission archive backed by the contest API", () => {
    const calendarSource = fs.readFileSync(
      path.join(rootDir, "components/contest-calendar.tsx"),
      "utf8",
    );
    const globalStyles = fs.readFileSync(
      path.join(rootDir, "src/app/globals.css"),
      "utf8",
    );

    expect(calendarSource).toContain("/api/contests/${selectedContestId}/submissions");
    expect(calendarSource).toContain('method: "POST"');
    expect(calendarSource).toContain("제출물 아카이브");
    expect(calendarSource).toContain("제출물 이름");
    expect(calendarSource).toContain("S3 object key");
    expect(calendarSource).toContain("제출물 추가");
    expect(globalStyles).toContain(".contest-calendar-submissions");
    expect(globalStyles).toContain(".contest-calendar-submission-form");
  });
});
