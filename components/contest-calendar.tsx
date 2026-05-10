"use client";

import { useEffect, useMemo, useState } from "react";

import {
  requestPresignedContestCaptureUpload,
  uploadFileToPresignedUrl,
} from "@/lib/upload-client";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

type ContestScheduleItem = {
  id: string;
  title: string;
  deadline: string;
  prize: string;
  captureImageObjectKey: string;
  createdAt: string;
  updatedAt: string;
};

type CalendarDay = {
  key: string;
  day: number | null;
  dateKey: string | null;
};

type ContestSubmission = {
  id: string;
  name: string;
  objectKey: string;
  submittedAt: string;
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
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [contests, setContests] = useState<ContestScheduleItem[]>([]);
  const [contestListStatus, setContestListStatus] = useState("불러오기 전");
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [contestForm, setContestForm] = useState({
    title: "",
    deadline: "",
    prize: "",
    captureImageObjectKey: "",
  });
  const [contestCaptureFile, setContestCaptureFile] = useState<File | null>(
    null,
  );
  const [ideaMemo, setIdeaMemo] = useState("");
  const [ideaMemoStatus, setIdeaMemoStatus] = useState("불러오기 전");
  const [contestCaptureImageUrl, setContestCaptureImageUrl] = useState<
    string | null
  >(null);
  const [isCapturePreviewOpen, setIsCapturePreviewOpen] = useState(false);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [submissionName, setSubmissionName] = useState("");
  const [submissionObjectKey, setSubmissionObjectKey] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("불러오기 전");
  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth],
  );
  const contestEventsByDate = useMemo(() => {
    const eventsByDate = new Map<string, ContestScheduleItem[]>();

    for (const contestItem of contests) {
      const events = eventsByDate.get(contestItem.deadline) ?? [];
      eventsByDate.set(contestItem.deadline, [...events, contestItem]);
    }

    return eventsByDate;
  }, [contests]);
  const visibleMonthContestCount = calendarDays.reduce((count, calendarDay) => {
    if (!calendarDay.dateKey) {
      return count;
    }

    return count + (contestEventsByDate.get(calendarDay.dateKey)?.length ?? 0);
  }, 0);
  const selectedContest = selectedContestId
    ? contests.find(
        (contestItem) => contestItem.id === selectedContestId,
      )
    : null;
  useEffect(() => {
    let ignore = false;

    async function loadContests() {
      setContestListStatus("불러오는 중");

      try {
        const response = await fetch("/api/contests");
        const data = (await response.json()) as {
          contests?: ContestScheduleItem[];
        };

        if (!ignore) {
          setContests(data.contests ?? []);
          setContestListStatus("불러옴");
        }
      } catch {
        if (!ignore) {
          setContests([]);
          setContestListStatus("불러오기 실패");
        }
      }
    }

    loadContests();

    return () => {
      ignore = true;
    };
  }, []);

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

  useEffect(() => {
    let ignore = false;

    if (!selectedContestId) {
      setContestCaptureImageUrl(null);
      setIsCapturePreviewOpen(false);
      return;
    }

    async function loadContestCaptureImageUrl() {
      try {
        const response = await fetch(
          `/api/contests/${selectedContestId}/capture`,
        );
        const data = (await response.json()) as {
          imageUrl?: string;
        };

        if (!ignore) {
          setContestCaptureImageUrl(data.imageUrl ?? null);
        }
      } catch {
        if (!ignore) {
          setContestCaptureImageUrl(null);
        }
      }
    }

    loadContestCaptureImageUrl();

    return () => {
      ignore = true;
    };
  }, [selectedContestId]);

  useEffect(() => {
    let ignore = false;

    if (!selectedContestId) {
      setSubmissions([]);
      setSubmissionName("");
      setSubmissionObjectKey("");
      setSubmissionStatus("불러오기 전");
      return;
    }

    async function loadSubmissions() {
      setSubmissionStatus("불러오는 중");

      try {
        const response = await fetch(
          `/api/contests/${selectedContestId}/submissions`,
        );
        const data = (await response.json()) as {
          archive?: { submissions?: ContestSubmission[] };
        };

        if (!ignore) {
          setSubmissions(data.archive?.submissions ?? []);
          setSubmissionStatus("불러옴");
        }
      } catch {
        if (!ignore) {
          setSubmissions([]);
          setSubmissionStatus("불러오기 실패");
        }
      }
    }

    loadSubmissions();

    return () => {
      ignore = true;
    };
  }, [selectedContestId]);

  function moveMonth(monthOffset: number) {
    setSelectedContestId(null);
    setSelectedDateKey(null);
    resetContestForm();
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
    setSelectedDateKey(null);
    resetContestForm();
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

  async function addSubmission() {
    if (!selectedContestId || !submissionName.trim() || !submissionObjectKey.trim()) {
      setSubmissionStatus("입력 필요");
      return;
    }

    setSubmissionStatus("저장 중");

    try {
      const response = await fetch(`/api/contests/${selectedContestId}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: submissionName,
          objectKey: submissionObjectKey,
        }),
      });
      const data = (await response.json()) as {
        archive?: { submissions?: ContestSubmission[] };
      };

      setSubmissions(data.archive?.submissions ?? []);
      setSubmissionName("");
      setSubmissionObjectKey("");
      setSubmissionStatus("저장됨");
    } catch {
      setSubmissionStatus("저장 실패");
    }
  }

  function updateContestForm(field: keyof typeof contestForm, value: string) {
    setContestForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function resetContestForm() {
    setEditingContestId(null);
    setContestCaptureFile(null);
    setContestForm({
      title: "",
      deadline: "",
      prize: "",
      captureImageObjectKey: "",
    });
  }

  function startCreatingContest(dateKey: string) {
    setSelectedContestId(null);
    setSelectedDateKey(dateKey);
    setEditingContestId(null);
    setContestCaptureFile(null);
    setContestForm({
      title: "",
      deadline: dateKey,
      prize: "",
      captureImageObjectKey: "",
    });
  }

  function startEditingContest(contest: ContestScheduleItem) {
    setEditingContestId(contest.id);
    setSelectedDateKey(contest.deadline);
    setContestCaptureFile(null);
    setContestForm({
      title: contest.title,
      deadline: contest.deadline,
      prize: contest.prize,
      captureImageObjectKey: contest.captureImageObjectKey,
    });
  }

  async function uploadContestCaptureIfNeeded() {
    if (!contestCaptureFile) {
      return contestForm.captureImageObjectKey;
    }

    setContestListStatus("캡쳐 이미지 업로드 중");
    const presigned = await requestPresignedContestCaptureUpload({
      fileName: contestCaptureFile.name,
      contentType: contestCaptureFile.type,
      size: contestCaptureFile.size,
    });

    await uploadFileToPresignedUrl({
      uploadUrl: presigned.uploadUrl,
      file: contestCaptureFile,
      contentType: contestCaptureFile.type,
    });

    return presigned.objectKey;
  }

  async function saveContest() {
    const method = editingContestId ? "PUT" : "POST";
    const endpoint = editingContestId
      ? `/api/contests/${editingContestId}`
      : "/api/contests";

    setContestListStatus(editingContestId ? "수정 중" : "등록 중");

    try {
      const captureImageObjectKey = await uploadContestCaptureIfNeeded();

      const saveResponse = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...contestForm,
          captureImageObjectKey,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("contest-save-failed");
      }

      const saveData = (await saveResponse.json()) as {
        contest?: ContestScheduleItem;
      };
      const response = await fetch("/api/contests");
      const data = (await response.json()) as {
        contests?: ContestScheduleItem[];
      };

      setContests(data.contests ?? []);
      if (saveData.contest?.id) {
        setSelectedContestId(saveData.contest.id);
        setSelectedDateKey(saveData.contest.deadline);
      }
      setContestListStatus(editingContestId ? "수정됨" : "등록됨");
      resetContestForm();
    } catch {
      setContestListStatus(editingContestId ? "수정 실패" : "등록 실패");
    }
  }

  async function deleteContest(contestId: string) {
    setContestListStatus("삭제 중");

    try {
      await fetch(`/api/contests/${contestId}`, {
        method: "DELETE",
      });
      setContests((currentContests) =>
        currentContests.filter((contest) => contest.id !== contestId),
      );
      if (selectedContestId === contestId) {
        setSelectedContestId(null);
        setSelectedDateKey(null);
      }
      if (editingContestId === contestId) {
        resetContestForm();
      }
      setContestListStatus("삭제됨");
    } catch {
      setContestListStatus("삭제 실패");
    }
  }

  function cancelContestForm() {
    resetContestForm();
    if (!selectedContestId) {
      setSelectedDateKey(null);
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
              const isSelectedDate = calendarDay.dateKey === selectedDateKey;
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
                    isSelectedDate || selectedContestIsOnDay ? "is-selected" : "",
                    isToday ? "is-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (contestEvents[0]) {
                      resetContestForm();
                      setSelectedContestId(contestEvents[0].id);
                      setSelectedDateKey(calendarDay.dateKey);
                    } else if (calendarDay.dateKey) {
                      startCreatingContest(calendarDay.dateKey);
                    }
                  }}
                  aria-label={
                    hasContestEvents
                      ? `${calendarDay.day}일, 공모전 일정 ${contestEvents.length}건 상세 보기`
                      : isToday
                        ? `${calendarDay.day}일, 오늘, 공모전 등록`
                        : `${calendarDay.day}일, 공모전 등록`
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

          {selectedDateKey && (!selectedContest || editingContestId) ? (
            <article
              className="contest-manager"
              aria-labelledby="contest-manager-title"
            >
              <div className="contest-manager-header">
                <h3 id="contest-manager-title">
                  {editingContestId ? "공모전 수정" : "공모전 등록"}
                </h3>
                <span aria-live="polite">{contestListStatus}</span>
              </div>
              <div className="contest-manager-form">
                <label htmlFor="contest-title">공모전 이름</label>
                <input
                  id="contest-title"
                  value={contestForm.title}
                  onChange={(event) =>
                    updateContestForm("title", event.target.value)
                  }
                  placeholder="예: 봄 정원 사진 공모전"
                />
                <label htmlFor="contest-deadline">제출 마감일</label>
                <input
                  id="contest-deadline"
                  type="date"
                  value={contestForm.deadline}
                  onChange={(event) =>
                    updateContestForm("deadline", event.target.value)
                  }
                />
                <label htmlFor="contest-prize">상금</label>
                <input
                  id="contest-prize"
                  value={contestForm.prize}
                  onChange={(event) =>
                    updateContestForm("prize", event.target.value)
                  }
                  placeholder="예: 총 상금 300만원"
                />
                <label htmlFor="contest-capture-file">캡쳐 이미지 파일</label>
                <input
                  id="contest-capture-file"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setContestCaptureFile(event.target.files?.[0] ?? null)
                  }
                />
                <p className="contest-manager-capture-note">
                  {contestCaptureFile
                    ? contestCaptureFile.name
                    : contestForm.captureImageObjectKey
                      ? `현재 캡쳐: ${contestForm.captureImageObjectKey}`
                      : "등록할 공모전 캡쳐 이미지를 선택하세요."}
                </p>
                <div className="contest-manager-actions">
                  <button type="button" onClick={saveContest}>
                    {editingContestId ? "수정 저장" : "공모전 등록"}
                  </button>
                  <button type="button" onClick={cancelContestForm}>
                    취소
                  </button>
                </div>
              </div>
            </article>
          ) : null}

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
              <div className="contest-calendar-detail-actions">
                <button
                  type="button"
                  onClick={() => startEditingContest(selectedContest)}
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => deleteContest(selectedContest.id)}
                >
                  삭제
                </button>
              </div>
              <figure className="contest-calendar-capture">
                {contestCaptureImageUrl ? (
                  <button
                    type="button"
                    className="contest-calendar-capture-button"
                    onClick={() => setIsCapturePreviewOpen(true)}
                    aria-label={`${selectedContest.title} 캡쳐 이미지 크게 보기`}
                  >
                    <img
                      src={contestCaptureImageUrl}
                      alt={`${selectedContest.title} 캡쳐 이미지`}
                      loading="lazy"
                    />
                  </button>
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
              <div className="contest-calendar-submissions">
                <div className="contest-calendar-submissions-header">
                  <h4>제출물 아카이브</h4>
                  <span aria-live="polite">{submissionStatus}</span>
                </div>
                {submissions.length > 0 ? (
                  <ul>
                    {submissions.map((submission) => (
                      <li key={submission.id}>
                        <strong>{submission.name}</strong>
                        <code>{submission.objectKey}</code>
                        <span>
                          등록일{" "}
                          {new Intl.DateTimeFormat("ko-KR", {
                            dateStyle: "medium",
                          }).format(new Date(submission.submittedAt))}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>아직 등록된 제출물이 없습니다.</p>
                )}
                <div className="contest-calendar-submission-form">
                  <label htmlFor="contest-submission-name">제출물 이름</label>
                  <input
                    id="contest-submission-name"
                    value={submissionName}
                    onChange={(event) => setSubmissionName(event.target.value)}
                    placeholder="예: 최종 제출 이미지"
                  />
                  <label htmlFor="contest-submission-object-key">
                    S3 object key
                  </label>
                  <input
                    id="contest-submission-object-key"
                    value={submissionObjectKey}
                    onChange={(event) =>
                      setSubmissionObjectKey(event.target.value)
                    }
                    placeholder={`contests/${selectedContest.id}/submissions/final.png`}
                  />
                  <button type="button" onClick={addSubmission}>
                    제출물 추가
                  </button>
                </div>
              </div>
            </article>
          ) : null}

          {selectedContest && contestCaptureImageUrl && isCapturePreviewOpen ? (
            <div
              className="contest-capture-lightbox"
              role="dialog"
              aria-modal="true"
              aria-labelledby="contest-capture-lightbox-title"
            >
              <div className="contest-capture-lightbox-panel">
                <div className="contest-capture-lightbox-header">
                  <h3 id="contest-capture-lightbox-title">
                    {selectedContest.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCapturePreviewOpen(false)}
                  >
                    닫기
                  </button>
                </div>
                <img
                  src={contestCaptureImageUrl}
                  alt={`${selectedContest.title} 캡쳐 이미지 크게 보기`}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
