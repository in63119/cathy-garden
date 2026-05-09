"use client";

import { useEffect, useMemo, useState } from "react";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

type ContestScheduleItem = {
  id: string;
  title: string;
  deadline: string;
  prize: string;
  captureImageObjectKey: string;
};

const contestScheduleItems: ContestScheduleItem[] = [
  {
    id: "spring-garden-photo",
    title: "봄 정원 사진 공모전",
    deadline: "2026-05-18",
    prize: "총 상금 300만원",
    captureImageObjectKey: "contests/spring-garden-photo/capture.png",
  },
  {
    id: "daily-idea-note",
    title: "생활 아이디어 메모 공모전",
    deadline: "2026-05-27",
    prize: "대상 100만원",
    captureImageObjectKey: "contests/daily-idea-note/capture.png",
  },
];

type CalendarDay = {
  key: string;
  day: number | null;
  dateKey: string | null;
};

function buildCalendarDays(monthDate: Date): CalendarDay[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = firstDay.getDay();
  const calendarDays: CalendarDay[] = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    calendarDays.push({ key: `empty-${index}`, day: null, dateKey: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push({
      key: `day-${day}`,
      day,
      dateKey: formatDateKey(year, month, day),
    });
  }

  return calendarDays;
}

function formatDateKey(year: number, monthIndex: number, day: number) {
  const month = String(monthIndex + 1).padStart(2, "0");
  const dayOfMonth = String(day).padStart(2, "0");

  return `${year}-${month}-${dayOfMonth}`;
}

function formatMonthLabel(monthDate: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(monthDate);
}

function getContestCaptureImageUrl(objectKey: string) {
  const baseUrl = process.env.NEXT_PUBLIC_CONTEST_CAPTURE_BASE_URL?.replace(
    /\/$/,
    "",
  );

  return baseUrl ? `${baseUrl}/${objectKey}` : null;
}

export function ContestCalendar() {
  const todayDateKey = useMemo(() => {
    const today = new Date();

    return formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedContestId, setSelectedContestId] = useState<string | null>(
    null,
  );
  const [ideaMemo, setIdeaMemo] = useState("");
  const [ideaMemoStatus, setIdeaMemoStatus] = useState("불러오기 전");
  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth],
  );
  const contestEventsByDate = useMemo(() => {
    const eventsByDate = new Map<string, ContestScheduleItem[]>();

    for (const contestItem of contestScheduleItems) {
      const events = eventsByDate.get(contestItem.deadline) ?? [];
      eventsByDate.set(contestItem.deadline, [...events, contestItem]);
    }

    return eventsByDate;
  }, []);
  const visibleMonthContestCount = calendarDays.reduce((count, calendarDay) => {
    if (!calendarDay.dateKey) {
      return count;
    }

    return count + (contestEventsByDate.get(calendarDay.dateKey)?.length ?? 0);
  }, 0);
  const selectedContest = selectedContestId
    ? contestScheduleItems.find(
        (contestItem) => contestItem.id === selectedContestId,
      )
    : null;
  const selectedContestCaptureUrl = selectedContest
    ? getContestCaptureImageUrl(selectedContest.captureImageObjectKey)
    : null;

  useEffect(() => {
    let ignore = false;

    if (!selectedContestId) {
      setIdeaMemo("");
      setIdeaMemoStatus("불러오기 전");
      return;
    }

    async function loadIdeaMemo() {
      setIdeaMemoStatus("불러오는 중");

      try {
        const response = await fetch(
          `/api/contests/${selectedContestId}/idea-memo`,
        );
        const data = (await response.json()) as {
          ideaMemo?: { memo?: string };
        };

        if (!ignore) {
          setIdeaMemo(data.ideaMemo?.memo ?? "");
          setIdeaMemoStatus("불러옴");
        }
      } catch {
        if (!ignore) {
          setIdeaMemo("");
          setIdeaMemoStatus("불러오기 실패");
        }
      }
    }

    loadIdeaMemo();

    return () => {
      ignore = true;
    };
  }, [selectedContestId]);

  function moveMonth(monthOffset: number) {
    setSelectedContestId(null);
    setVisibleMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + monthOffset,
          1,
        ),
    );
  }

  function moveToToday() {
    const today = new Date();

    setSelectedContestId(null);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  async function saveIdeaMemo() {
    if (!selectedContestId) {
      return;
    }

    setIdeaMemoStatus("저장 중");

    try {
      await fetch(`/api/contests/${selectedContestId}/idea-memo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memo: ideaMemo }),
      });
      setIdeaMemoStatus("저장됨");
    } catch {
      setIdeaMemoStatus("저장 실패");
    }
  }

  return (
    <section
      className="content-shell contest-calendar-section"
      aria-labelledby="contest-calendar-title"
    >
      <div className="card contest-calendar-card">
        <div className="contest-calendar-copy">
          <span className="eyebrow">Contest Calendar</span>
          <div>
            <h2 id="contest-calendar-title">공모전 달력</h2>
            <p>
              캡쳐해 둔 공모전 일정과 제출 준비를 이곳에서 확인합니다.
            </p>
          </div>
        </div>

        <div className="contest-calendar-board" aria-label="공모전 월간 달력">
          <div className="contest-calendar-toolbar">
            <button
              type="button"
              className="contest-calendar-nav-button"
              onClick={() => moveMonth(-1)}
              aria-label="이전 달 보기"
            >
              이전
            </button>
            <div className="contest-calendar-month">
              {formatMonthLabel(visibleMonth)}
            </div>
            <button
              type="button"
              className="contest-calendar-nav-button"
              onClick={() => moveMonth(1)}
              aria-label="다음 달 보기"
            >
              다음
            </button>
          </div>
          <button
            type="button"
            className="contest-calendar-today-button"
            onClick={moveToToday}
          >
            오늘
          </button>

          <div className="contest-calendar-grid contest-calendar-weekdays">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="contest-calendar-grid">
            {calendarDays.map((calendarDay) => {
              const contestEvents = calendarDay.dateKey
                ? contestEventsByDate.get(calendarDay.dateKey) ?? []
                : [];
              const hasContestEvents = contestEvents.length > 0;
              const isToday = calendarDay.dateKey === todayDateKey;
              const selectedContestIsOnDay = contestEvents.some(
                (contestEvent) => contestEvent.id === selectedContestId,
              );

              if (calendarDay.day === null) {
                return (
                  <div
                    key={calendarDay.key}
                    className="contest-calendar-day is-empty"
                    aria-hidden="true"
                  />
                );
              }

              return (
                <button
                  type="button"
                  key={calendarDay.key}
                  className={[
                    "contest-calendar-day",
                    hasContestEvents ? "is-contest-day" : "",
                    selectedContestIsOnDay ? "is-selected" : "",
                    isToday ? "is-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (contestEvents[0]) {
                      setSelectedContestId(contestEvents[0].id);
                    }
                  }}
                  disabled={!hasContestEvents}
                  aria-label={
                    hasContestEvents
                      ? `${calendarDay.day}일, 공모전 일정 ${contestEvents.length}건 상세 보기`
                      : isToday
                        ? `${calendarDay.day}일, 오늘`
                        : `${calendarDay.day}일`
                  }
                  aria-pressed={selectedContestIsOnDay}
                >
                  <span>{calendarDay.day}</span>
                  {isToday ? (
                    <span className="contest-calendar-today-badge">오늘</span>
                  ) : null}
                  {hasContestEvents ? (
                    <span className="contest-calendar-badge">
                      일정 {contestEvents.length}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <p className="contest-calendar-empty">
            {visibleMonthContestCount > 0
              ? `이번 달 공모전 일정 ${visibleMonthContestCount}건`
              : "아직 등록된 공모전 일정이 없습니다."}
          </p>

          {selectedContest ? (
            <article
              className="contest-calendar-detail"
              aria-labelledby="contest-calendar-detail-title"
            >
              <span className="eyebrow">Selected Contest</span>
              <h3 id="contest-calendar-detail-title">
                {selectedContest.title}
              </h3>
              <p>선택한 공모전 상세 정보를 확인합니다.</p>
              <figure className="contest-calendar-capture">
                {selectedContestCaptureUrl ? (
                  <img
                    src={selectedContestCaptureUrl}
                    alt={`${selectedContest.title} 캡쳐 이미지`}
                    loading="lazy"
                  />
                ) : (
                  <figcaption>
                    캡쳐 이미지 경로: {selectedContest.captureImageObjectKey}
                  </figcaption>
                )}
              </figure>
              <dl>
                <div>
                  <dt>공모전 이름</dt>
                  <dd>{selectedContest.title}</dd>
                </div>
                <div>
                  <dt>제출 마감일</dt>
                  <dd>{selectedContest.deadline}</dd>
                </div>
                <div>
                  <dt>상금</dt>
                  <dd>{selectedContest.prize}</dd>
                </div>
              </dl>
              <div className="contest-calendar-memo">
                <label htmlFor="contest-idea-memo">아이디어 메모장</label>
                <textarea
                  id="contest-idea-memo"
                  value={ideaMemo}
                  onChange={(event) => {
                    setIdeaMemo(event.target.value);
                    setIdeaMemoStatus("수정 중");
                  }}
                  placeholder="공모전에 떠오른 아이디어를 적어두세요."
                  rows={5}
                />
                <div className="contest-calendar-memo-actions">
                  <button type="button" onClick={saveIdeaMemo}>
                    메모 저장
                  </button>
                  <span aria-live="polite">{ideaMemoStatus}</span>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
