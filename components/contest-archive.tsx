"use client";

import { useEffect, useMemo, useState } from "react";

type ContestScheduleItem = {
  id: string;
  title: string;
  deadline: string;
  prize: string;
};

type ContestSubmission = {
  id: string;
  name: string;
  objectKey: string;
  submittedAt: string;
};

type ContestArchiveRow = {
  contest: ContestScheduleItem;
  submissions: ContestSubmission[];
  updatedAt: string | null;
};

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function ContestArchive() {
  const [rows, setRows] = useState<ContestArchiveRow[]>([]);
  const [status, setStatus] = useState("불러오기 전");

  useEffect(() => {
    let ignore = false;

    async function loadArchive() {
      setStatus("불러오는 중");

      try {
        const contestsResponse = await fetch("/api/contests");
        const contestsData = (await contestsResponse.json()) as {
          contests?: ContestScheduleItem[];
        };
        const contests = contestsData.contests ?? [];
        const archiveRows = await Promise.all(
          contests.map(async (contest) => {
            const response = await fetch(
              `/api/contests/${contest.id}/submissions`,
            );
            const data = (await response.json()) as {
              archive?: {
                submissions?: ContestSubmission[];
                updatedAt?: string | null;
              };
            };

            return {
              contest,
              submissions: data.archive?.submissions ?? [],
              updatedAt: data.archive?.updatedAt ?? null,
            };
          }),
        );

        if (!ignore) {
          setRows(archiveRows);
          setStatus("불러옴");
        }
      } catch {
        if (!ignore) {
          setRows([]);
          setStatus("불러오기 실패");
        }
      }
    }

    loadArchive();

    return () => {
      ignore = true;
    };
  }, []);

  const submissionCount = useMemo(
    () =>
      rows.reduce((count, row) => count + row.submissions.length, 0),
    [rows],
  );

  return (
    <section
      className="content-shell contest-archive-section"
      aria-labelledby="contest-archive-title"
    >
      <div className="card contest-archive-card">
        <div className="contest-archive-header">
          <div>
            <span className="eyebrow">Contest Archive</span>
            <h2 id="contest-archive-title">공모전 아카이브</h2>
            <p>공모전별 제출물과 최근 등록 상태를 리스트로 확인합니다.</p>
          </div>
          <span aria-live="polite">{status}</span>
        </div>

        <div className="contest-archive-summary">
          <strong>{rows.length}개 공모전</strong>
          <span>제출물 {submissionCount}개</span>
        </div>

        {rows.length > 0 ? (
          <div className="contest-archive-list">
            {rows.map((row) => (
              <article key={row.contest.id} className="contest-archive-row">
                <div>
                  <h3>{row.contest.title}</h3>
                  <p>마감일 {row.contest.deadline}</p>
                </div>
                <div className="contest-archive-row-meta">
                  <strong>제출물 {row.submissions.length}개</strong>
                  <span>
                    {row.updatedAt
                      ? `최근 등록 ${formatSubmittedAt(row.updatedAt)}`
                      : "아직 제출물 없음"}
                  </span>
                </div>
                {row.submissions.length > 0 ? (
                  <ul>
                    {row.submissions.map((submission) => (
                      <li key={submission.id}>
                        <strong>{submission.name}</strong>
                        <code>{submission.objectKey}</code>
                        <span>{formatSubmittedAt(submission.submittedAt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="contest-archive-empty">
                    등록된 제출물이 없습니다.
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="contest-archive-empty">
            아직 아카이브에 표시할 공모전이 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
