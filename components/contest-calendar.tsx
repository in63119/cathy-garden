"use client";

import { useMemo, useState } from "react";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

const contestScheduleItems = [
  {
    id: "spring-garden-photo",
    title: "봄 정원 사진 공모전",
    deadline: "2026-05-18",
  },
  {
    id: "daily-idea-note",
    title: "생활 아이디어 메모 공모전",
    deadline: "2026-05-27",
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

export function ContestCalendar() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth],
  );
  const contestEventsByDate = useMemo(() => {
    const eventsByDate = new Map<string, typeof contestScheduleItems>();

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

  function moveMonth(monthOffset: number) {
    setVisibleMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + monthOffset,
          1,
        ),
    );
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

              return (
                <div
                  key={calendarDay.key}
                  className={[
                    "contest-calendar-day",
                    calendarDay.day === null ? "is-empty" : "",
                    hasContestEvents ? "is-contest-day" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden={calendarDay.day === null}
                  aria-label={
                    calendarDay.day === null
                      ? undefined
                      : hasContestEvents
                        ? `${calendarDay.day}일, 공모전 일정 ${contestEvents.length}건`
                        : `${calendarDay.day}일`
                  }
                >
                  <span>{calendarDay.day}</span>
                  {hasContestEvents ? (
                    <span className="contest-calendar-badge">
                      일정 {contestEvents.length}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="contest-calendar-empty">
            {visibleMonthContestCount > 0
              ? `이번 달 공모전 일정 ${visibleMonthContestCount}건`
              : "아직 등록된 공모전 일정이 없습니다."}
          </p>
        </div>
      </div>
    </section>
  );
}
