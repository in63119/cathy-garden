"use client";

import { useEffect, useMemo, useState } from "react";

import {
  requestPresignedUpload,
  requestPresignedContestCaptureUpload,
  uploadFileToPresignedUrl,
} from "@/lib/upload-client";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
const presetPrizeTitles = ["대상", "최우수상", "우수상", "장려상", "입상"];

type ContestScheduleItem = {
  id: string;
  title: string;
  deadline: string;
  prize: string;
  prizeItems: ContestPrizeItem[];
  captureImageObjectKey: string;
  captureImageObjectKeys: string[];
  createdAt: string;
  updatedAt: string;
};

type ContestPrizeItem = {
  title: string;
  amount: string;
  count: string;
};

type ContestCaptureImage = {
  objectKey: string;
  imageUrl: string;
};

type CalendarDay = {
  key: string;
  day: number | null;
  dateKey: string | null;
};

type ContestSubmission = {
  id: string;
  name: string;
  type: "file" | "youtube";
  objectKey: string;
  url: string;
  submittedAt: string;
};

function createPresetPrizeItems() {
  return presetPrizeTitles.map((title) => ({
    title,
    amount: "",
    count: "",
  }));
}

function getDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function getPrizeAmountDigits(amount: string) {
  return getDigits(amount, 4);
}

function getPrizeCountDigits(count: string) {
  return getDigits(count, 2);
}

function formatPrizeAmountFromDigits(value: string) {
  const digits = getPrizeAmountDigits(value);

  return digits ? `${Number(digits)}만원` : "";
}

function formatPrizeCountFromDigits(value: string) {
  const digits = getPrizeCountDigits(value);

  return digits ? `${Number(digits)}명` : "";
}

function hasPrizeItemDetail(prizeItem: ContestPrizeItem) {
  return Boolean(prizeItem.amount.trim() || prizeItem.count.trim());
}

function getVisiblePrizeItems(prizeItems: ContestPrizeItem[]) {
  return prizeItems.filter(hasPrizeItemDetail);
}

function mergePrizeItemsWithPresets(prizeItems: ContestPrizeItem[]) {
  const presetItems = presetPrizeTitles.map(
    (title) =>
      prizeItems.find((prizeItem) => prizeItem.title.trim() === title) ?? {
        title,
        amount: "",
        count: "",
      },
  );
  const customItems = prizeItems.filter(
    (prizeItem) => !presetPrizeTitles.includes(prizeItem.title.trim()),
  );

  return [...presetItems, ...customItems];
}

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

function buildPrizeSummary(prizeItems: ContestPrizeItem[]) {
  return getVisiblePrizeItems(prizeItems)
    .map((prizeItem) =>
      [prizeItem.title, prizeItem.amount, prizeItem.count]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean)
    .join(", ");
}

function getPrizeItemCountLabel(prizeItems: ContestPrizeItem[]) {
  return `${getVisiblePrizeItems(prizeItems).length}개 수상 항목`;
}

function getPrizeSummaryLabel(
  prizeItems: ContestPrizeItem[],
  fallback: string,
) {
  return buildPrizeSummary(getVisiblePrizeItems(prizeItems)) || fallback;
}

export function ContestCalendar() {
  const todayDateKey = useMemo(() => {
    const today = new Date();

    return formatDateKey(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
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
  const [isCreatingContest, setIsCreatingContest] = useState(false);
  const [contestForm, setContestForm] = useState({
    title: "",
    deadline: "",
    prize: "",
    prizeItems: createPresetPrizeItems() as ContestPrizeItem[],
    captureImageObjectKey: "",
    captureImageObjectKeys: [] as string[],
  });
  const [contestCaptureFiles, setContestCaptureFiles] = useState<File[]>([]);
  const [ideaMemo, setIdeaMemo] = useState("");
  const [ideaMemoStatus, setIdeaMemoStatus] = useState("불러오기 전");
  const [contestCaptureImages, setContestCaptureImages] = useState<
    ContestCaptureImage[]
  >([]);
  const [isCapturePreviewOpen, setIsCapturePreviewOpen] = useState(false);
  const [activeCaptureImageIndex, setActiveCaptureImageIndex] = useState(0);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [submissionName, setSubmissionName] = useState("");
  const [submissionType, setSubmissionType] = useState<"file" | "youtube">(
    "file",
  );
  const [submissionObjectKey, setSubmissionObjectKey] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
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
    ? contests.find((contestItem) => contestItem.id === selectedContestId)
    : null;
  const selectedContestPrizeItems = selectedContest
    ? getVisiblePrizeItems(selectedContest.prizeItems)
    : [];
  const selectedDateContests = selectedDateKey
    ? (contestEventsByDate.get(selectedDateKey) ?? [])
    : [];
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
      setContestCaptureImages([]);
      setIsCapturePreviewOpen(false);
      setActiveCaptureImageIndex(0);
      return;
    }

    async function loadContestCaptureImageUrl() {
      try {
        const response = await fetch(
          `/api/contests/${selectedContestId}/capture`,
        );
        const data = (await response.json()) as {
          imageUrl?: string;
          images?: ContestCaptureImage[];
        };

        if (!ignore) {
          setContestCaptureImages(data.images ?? []);
          setActiveCaptureImageIndex(0);
        }
      } catch {
        if (!ignore) {
          setContestCaptureImages([]);
          setActiveCaptureImageIndex(0);
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
      setSubmissionType("file");
      setSubmissionObjectKey("");
      setSubmissionFile(null);
      setSubmissionUrl("");
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
    const submissionReference =
      submissionType === "youtube"
        ? submissionUrl.trim()
        : (submissionFile?.name ?? "");
    const normalizedSubmissionName =
      submissionName.trim() || submissionFile?.name || "";

    if (
      !selectedContestId ||
      !normalizedSubmissionName ||
      !submissionReference
    ) {
      setSubmissionStatus("입력 필요");
      return;
    }

    setSubmissionStatus(
      submissionType === "file" ? "파일 업로드 중" : "저장 중",
    );

    try {
      let submissionObjectKey = "";

      if (submissionType === "file" && submissionFile) {
        const presigned = await requestPresignedUpload({
          fileName: submissionFile.name,
          contentType: submissionFile.type,
          size: submissionFile.size,
        });

        await uploadFileToPresignedUrl({
          uploadUrl: presigned.uploadUrl,
          file: submissionFile,
          contentType: submissionFile.type,
        });

        submissionObjectKey = presigned.objectKey;
      }

      const response = await fetch(
        `/api/contests/${selectedContestId}/submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: normalizedSubmissionName,
            type: submissionType,
            objectKey: submissionType === "file" ? submissionObjectKey : "",
            url: submissionType === "youtube" ? submissionUrl : "",
          }),
        },
      );
      const data = (await response.json()) as {
        archive?: { submissions?: ContestSubmission[] };
      };

      setSubmissions(data.archive?.submissions ?? []);
      setSubmissionName("");
      setSubmissionType("file");
      setSubmissionObjectKey("");
      setSubmissionFile(null);
      setSubmissionUrl("");
      setSubmissionStatus("저장됨");
    } catch {
      setSubmissionStatus("저장 실패");
    }
  }

  function updateContestForm(
    field: "title" | "deadline" | "prize" | "captureImageObjectKey",
    value: string,
  ) {
    setContestForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function updatePrizeItem(
    index: number,
    field: keyof ContestPrizeItem,
    value: string,
  ) {
    setContestForm((currentForm) => ({
      ...currentForm,
      prizeItems: currentForm.prizeItems.map((prizeItem, prizeItemIndex) =>
        prizeItemIndex === index ? { ...prizeItem, [field]: value } : prizeItem,
      ),
    }));
  }

  function updatePrizeAmount(index: number, value: string) {
    updatePrizeItem(index, "amount", formatPrizeAmountFromDigits(value));
  }

  function updatePrizeCount(index: number, value: string) {
    updatePrizeItem(index, "count", formatPrizeCountFromDigits(value));
  }

  function adjustPrizeAmount(index: number, change: number) {
    const currentAmount = Number(
      getPrizeAmountDigits(contestForm.prizeItems[index]?.amount ?? ""),
    );
    const nextAmount = Math.max(0, Math.min(9999, currentAmount + change));

    updatePrizeItem(index, "amount", nextAmount ? `${nextAmount}만원` : "");
  }

  function adjustPrizeCount(index: number, change: number) {
    const currentCount = Number(
      getPrizeCountDigits(contestForm.prizeItems[index]?.count ?? ""),
    );
    const nextCount = Math.max(0, Math.min(99, currentCount + change));

    updatePrizeItem(index, "count", nextCount ? `${nextCount}명` : "");
  }

  function clearPrizeItem(index: number) {
    setContestForm((currentForm) => ({
      ...currentForm,
      prizeItems: currentForm.prizeItems.map((prizeItem, prizeItemIndex) =>
        prizeItemIndex === index
          ? { ...prizeItem, amount: "", count: "" }
          : prizeItem,
      ),
    }));
  }

  function addPrizeItem() {
    setContestForm((currentForm) => ({
      ...currentForm,
      prizeItems: [
        ...currentForm.prizeItems,
        { title: "", amount: "", count: "" },
      ],
    }));
  }

  function removePrizeItem(index: number) {
    if (index < presetPrizeTitles.length) {
      clearPrizeItem(index);
      return;
    }

    setContestForm((currentForm) => ({
      ...currentForm,
      prizeItems: currentForm.prizeItems.filter(
        (_prizeItem, prizeItemIndex) => prizeItemIndex !== index,
      ),
    }));
  }

  function resetContestForm() {
    setEditingContestId(null);
    setIsCreatingContest(false);
    setContestCaptureFiles([]);
    setContestForm({
      title: "",
      deadline: "",
      prize: "",
      prizeItems: createPresetPrizeItems(),
      captureImageObjectKey: "",
      captureImageObjectKeys: [],
    });
  }

  function startCreatingContest(dateKey: string) {
    setSelectedContestId(null);
    setSelectedDateKey(dateKey);
    setEditingContestId(null);
    setIsCreatingContest(true);
    setContestCaptureFiles([]);
    setContestForm({
      title: "",
      deadline: dateKey,
      prize: "",
      prizeItems: createPresetPrizeItems(),
      captureImageObjectKey: "",
      captureImageObjectKeys: [],
    });
  }

  function startEditingContest(contest: ContestScheduleItem) {
    setEditingContestId(contest.id);
    setIsCreatingContest(false);
    setSelectedDateKey(contest.deadline);
    setContestCaptureFiles([]);
    setContestForm({
      title: contest.title,
      deadline: contest.deadline,
      prize: contest.prize,
      prizeItems: mergePrizeItemsWithPresets(
        contest.prizeItems && contest.prizeItems.length > 0
          ? contest.prizeItems
          : [{ title: "", amount: contest.prize, count: "" }],
      ),
      captureImageObjectKey: contest.captureImageObjectKey,
      captureImageObjectKeys: contest.captureImageObjectKeys ?? [
        contest.captureImageObjectKey,
      ],
    });
  }

  async function uploadContestCaptureIfNeeded() {
    if (contestCaptureFiles.length === 0) {
      return contestForm.captureImageObjectKeys.length > 0
        ? contestForm.captureImageObjectKeys
        : [contestForm.captureImageObjectKey].filter(Boolean);
    }

    setContestListStatus("캡쳐 이미지 업로드 중");
    const uploadedObjectKeys = [];

    for (const contestCaptureFile of contestCaptureFiles) {
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

      uploadedObjectKeys.push(presigned.objectKey);
    }

    return uploadedObjectKeys;
  }

  async function saveContest() {
    const method = editingContestId ? "PUT" : "POST";
    const endpoint = editingContestId
      ? `/api/contests/${editingContestId}`
      : "/api/contests";

    setContestListStatus(editingContestId ? "수정 중" : "등록 중");

    try {
      const captureImageObjectKeys = await uploadContestCaptureIfNeeded();
      const prizeItems = getVisiblePrizeItems(contestForm.prizeItems);

      const saveResponse = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...contestForm,
          prizeItems,
          prize: buildPrizeSummary(prizeItems) || contestForm.prize,
          captureImageObjectKey: captureImageObjectKeys[0] ?? "",
          captureImageObjectKeys,
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
            <p>캡쳐해 둔 공모전 일정과 제출 준비를 이곳에서 확인합니다.</p>
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
                ? (contestEventsByDate.get(calendarDay.dateKey) ?? [])
                : [];
              const hasContestEvents = contestEvents.length > 0;
              const contestCalendarLabel = hasContestEvents
                ? contestEvents.length > 1
                  ? `${contestEvents[0].title} 외 ${contestEvents.length - 1}`
                  : contestEvents[0].title
                : "";
              const contestCalendarAriaLabel = hasContestEvents
                ? contestEvents.map((contestEvent) => contestEvent.title).join(", ")
                : "";
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
                    isSelectedDate || selectedContestIsOnDay
                      ? "is-selected"
                      : "",
                    isToday ? "is-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (calendarDay.dateKey) {
                      setSelectedDateKey(calendarDay.dateKey);
                    }

                    if (contestEvents.length === 1) {
                      resetContestForm();
                      setSelectedContestId(contestEvents[0].id);
                    } else if (contestEvents.length > 1) {
                      resetContestForm();
                      setSelectedContestId(null);
                    } else if (calendarDay.dateKey) {
                      startCreatingContest(calendarDay.dateKey);
                    }
                  }}
                  aria-label={
                    hasContestEvents
                      ? `${calendarDay.day}일, ${contestCalendarAriaLabel} 상세 보기`
                      : isToday
                        ? `${calendarDay.day}일, 오늘, 공모전 등록`
                        : `${calendarDay.day}일, 공모전 등록`
                  }
                  aria-pressed={selectedContestIsOnDay}
                >
                  <span className="contest-calendar-date-number">
                    {calendarDay.day}
                  </span>
                  {isToday ? (
                    <span className="contest-calendar-today-badge">오늘</span>
                  ) : null}
                  {hasContestEvents ? (
                    <span
                      className="contest-calendar-badge"
                      title={contestCalendarAriaLabel}
                    >
                      {contestCalendarLabel}
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

          {selectedDateKey && selectedDateContests.length > 0 ? (
            <article
              className="contest-date-list"
              aria-labelledby="contest-date-list-title"
            >
              <div className="contest-date-list-header">
                <h3 id="contest-date-list-title">
                  {selectedDateKey} 일정
                </h3>
                <button
                  type="button"
                  onClick={() => startCreatingContest(selectedDateKey)}
                >
                  같은 날 공모전 추가
                </button>
              </div>
              <ul>
                {selectedDateContests.map((contestEvent) => (
                  <li key={contestEvent.id}>
                    <button
                      type="button"
                      onClick={() => {
                        resetContestForm();
                        setSelectedContestId(contestEvent.id);
                        setSelectedDateKey(contestEvent.deadline);
                      }}
                    >
                      <strong>{contestEvent.title}</strong>
                      <span>{contestEvent.prize}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {selectedDateKey &&
          (isCreatingContest || editingContestId || selectedDateContests.length === 0) ? (
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
                <fieldset className="contest-prize-editor">
                  <legend>상금</legend>
                  <div className="contest-prize-row contest-prize-heading">
                    <span>상 이름</span>
                    <span>상금</span>
                    <span>인원</span>
                    <span>관리</span>
                  </div>
                  {contestForm.prizeItems.map((prizeItem, prizeItemIndex) => (
                    <div
                      key={`prize-item-${prizeItemIndex}`}
                      className="contest-prize-row"
                    >
                      {prizeItemIndex < presetPrizeTitles.length ? (
                        <strong className="contest-prize-label">
                          {prizeItem.title}
                        </strong>
                      ) : (
                        <input
                          value={prizeItem.title}
                          onChange={(event) =>
                            updatePrizeItem(
                              prizeItemIndex,
                              "title",
                              event.target.value,
                            )
                          }
                          aria-label={`상금 항목 ${prizeItemIndex + 1} 상 이름`}
                          placeholder="직접 입력"
                        />
                      )}
                      <div className="contest-prize-stepper">
                        <button
                          type="button"
                          onClick={() => adjustPrizeAmount(prizeItemIndex, -10)}
                          aria-label={`${prizeItem.title || "상금"} 10만원 내리기`}
                        >
                          -
                        </button>
                        <input
                          value={getPrizeAmountDigits(prizeItem.amount)}
                          onChange={(event) =>
                            updatePrizeAmount(prizeItemIndex, event.target.value)
                          }
                          inputMode="numeric"
                          maxLength={4}
                          aria-label={`상금 항목 ${prizeItemIndex + 1} 금액`}
                          placeholder="0000"
                        />
                        <span>만원</span>
                        <button
                          type="button"
                          onClick={() => adjustPrizeAmount(prizeItemIndex, 10)}
                          aria-label={`${prizeItem.title || "상금"} 10만원 올리기`}
                        >
                          +
                        </button>
                      </div>
                      <div className="contest-prize-stepper">
                        <button
                          type="button"
                          onClick={() => adjustPrizeCount(prizeItemIndex, -1)}
                          aria-label={`${prizeItem.title || "상금"} 인원 줄이기`}
                        >
                          -
                        </button>
                        <input
                          value={getPrizeCountDigits(prizeItem.count)}
                          onChange={(event) =>
                            updatePrizeCount(prizeItemIndex, event.target.value)
                          }
                          inputMode="numeric"
                          maxLength={2}
                          aria-label={`상금 항목 ${prizeItemIndex + 1} 인원`}
                          placeholder="0"
                        />
                        <span>명</span>
                        <button
                          type="button"
                          onClick={() => adjustPrizeCount(prizeItemIndex, 1)}
                          aria-label={`${prizeItem.title || "상금"} 인원 늘리기`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePrizeItem(prizeItemIndex)}
                        aria-label={`상금 항목 ${prizeItemIndex + 1} 삭제`}
                      >
                        {prizeItemIndex < presetPrizeTitles.length
                          ? "비움"
                          : "삭제"}
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addPrizeItem}>
                    추가 입력
                  </button>
                  <p>
                    {buildPrizeSummary(contestForm.prizeItems) ||
                      "상 이름은 준비되어 있습니다. 금액은 만원 단위 숫자만 입력하세요."}
                  </p>
                </fieldset>
                <label htmlFor="contest-capture-file">캡쳐 이미지 파일</label>
                <input
                  id="contest-capture-file"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) =>
                    setContestCaptureFiles(Array.from(event.target.files ?? []))
                  }
                />
                <p className="contest-manager-capture-note">
                  {contestCaptureFiles.length > 0
                    ? `선택한 캡쳐 ${contestCaptureFiles.length}장`
                    : contestForm.captureImageObjectKeys.length > 0
                      ? `현재 캡쳐 ${contestForm.captureImageObjectKeys.length}장`
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
                {contestCaptureImages.length > 0 ? (
                  <div className="contest-calendar-capture-grid">
                    {contestCaptureImages.map((captureImage, imageIndex) => (
                      <button
                        key={captureImage.objectKey}
                        type="button"
                        className="contest-calendar-capture-button"
                        onClick={() => {
                          setActiveCaptureImageIndex(imageIndex);
                          setIsCapturePreviewOpen(true);
                        }}
                        aria-label={`${selectedContest.title} 캡쳐 이미지 ${imageIndex + 1} 크게 보기`}
                      >
                        <img
                          src={captureImage.imageUrl}
                          alt={`${selectedContest.title} 캡쳐 이미지 ${imageIndex + 1}`}
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
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
                  <dd>
                    {selectedContestPrizeItems.length > 0 ? (
                      <div className="contest-prize-panel">
                        <div className="contest-prize-summary">
                          <strong>
                            {getPrizeItemCountLabel(selectedContestPrizeItems)}
                          </strong>
                          <span>
                            {getPrizeSummaryLabel(
                              selectedContestPrizeItems,
                              selectedContest.prize,
                            )}
                          </span>
                        </div>
                        <ul className="contest-prize-list">
                          {selectedContestPrizeItems.map(
                            (prizeItem, prizeItemIndex) => (
                              <li key={`${prizeItem.title}-${prizeItemIndex}`}>
                                <strong>{prizeItem.title || "상금"}</strong>
                                <span>{prizeItem.amount || "금액 미정"}</span>
                                <span>{prizeItem.count || "인원 미정"}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p className="contest-prize-plain">
                        {selectedContest.prize}
                      </p>
                    )}
                  </dd>
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
                        <span className="contest-submission-kind">
                          {submission.type === "youtube" ? "YouTube" : "파일"}
                        </span>
                        {submission.type === "youtube" ? (
                          <a
                            href={submission.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {submission.url}
                          </a>
                        ) : (
                          <code>{submission.objectKey}</code>
                        )}
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
                    placeholder="예: 최종 제출 영상"
                  />
                  <label htmlFor="contest-submission-type">제출물 종류</label>
                  <select
                    id="contest-submission-type"
                    value={submissionType}
                    onChange={(event) =>
                      setSubmissionType(
                        event.target.value === "youtube" ? "youtube" : "file",
                      )
                    }
                  >
                    <option value="file">영상/파일</option>
                    <option value="youtube">YouTube URL</option>
                  </select>
                  {submissionType === "youtube" ? (
                    <>
                      <label htmlFor="contest-submission-url">
                        YouTube URL
                      </label>
                      <input
                        id="contest-submission-url"
                        value={submissionUrl}
                        onChange={(event) =>
                          setSubmissionUrl(event.target.value)
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="contest-submission-file">
                        올릴 사진과 영상
                      </label>
                      <input
                        id="contest-submission-file"
                        type="file"
                        accept="image/*,video/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;

                          setSubmissionFile(file);
                          setSubmissionObjectKey("");
                          if (file && !submissionName.trim()) {
                            setSubmissionName(file.name);
                          }
                        }}
                      />
                      <p>
                        {submissionFile
                          ? `선택된 파일: ${submissionFile.name}`
                          : "모바일 사진함에서 제출할 사진이나 영상을 선택하세요."}
                      </p>
                    </>
                  )}
                  <button type="button" onClick={addSubmission}>
                    제출물 추가
                  </button>
                </div>
              </div>
            </article>
          ) : null}

          {selectedContest &&
          contestCaptureImages[activeCaptureImageIndex] &&
          isCapturePreviewOpen ? (
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
                  src={contestCaptureImages[activeCaptureImageIndex].imageUrl}
                  alt={`${selectedContest.title} 캡쳐 이미지 ${activeCaptureImageIndex + 1} 크게 보기`}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
