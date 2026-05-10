"use client";

import { useState } from "react";

import { ContestArchive } from "@/components/contest-archive";
import { ContestCalendar } from "@/components/contest-calendar";

type ContestWorkspaceTab = "calendar" | "archive";

export function ContestWorkspace() {
  const [activeTab, setActiveTab] = useState<ContestWorkspaceTab>("calendar");

  return (
    <div className="contest-workspace">
      <div
        className="content-shell contest-workspace-tabs"
        role="tablist"
        aria-label="공모전 보기 전환"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "calendar"}
          className={activeTab === "calendar" ? "is-active" : ""}
          onClick={() => setActiveTab("calendar")}
        >
          달력
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "archive"}
          className={activeTab === "archive" ? "is-active" : ""}
          onClick={() => setActiveTab("archive")}
        >
          아카이브
        </button>
      </div>

      {activeTab === "calendar" ? <ContestCalendar /> : <ContestArchive />}
    </div>
  );
}
