"use client";

import Link from "next/link";
import { AlertCircle, Eye, MessageSquare, ArrowRight } from "lucide-react";
import type { DashboardSummary } from "@/types/dashboard";

interface AwaitingReviewProps {
  awaitingReview: DashboardSummary["awaitingReview"];
}

export function AwaitingReview({ awaitingReview }: AwaitingReviewProps) {
  const { reviewCount, needsInputCount, errorCount, tasks } = awaitingReview;
  const totalCount = reviewCount + needsInputCount + errorCount;

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <Eye size={16} color="var(--accent-color)" />
        <span style={labelStyle}>Awaiting Review</span>
        {totalCount > 0 && (
          <span style={countBadgeStyle}>{totalCount}</span>
        )}
      </div>
      {totalCount > 0 ? (
        <>
          {/* Summary line */}
          <div style={summaryStyle}>
            {reviewCount > 0 && (
              <span style={summaryItemStyle}>
                <Eye size={12} /> {reviewCount} in review
              </span>
            )}
            {needsInputCount > 0 && (
              <span style={summaryItemStyle}>
                <MessageSquare size={12} /> {needsInputCount} need{needsInputCount === 1 ? "s" : ""} input
              </span>
            )}
            {errorCount > 0 && (
              <span style={{ ...summaryItemStyle, color: "var(--error)" }}>
                <AlertCircle size={12} /> {errorCount} failed
              </span>
            )}
          </div>

          {/* Task previews */}
          <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {tasks.slice(0, 4).map((task) => (
              <li key={task.id} style={taskItemStyle}>
                <span style={bulletStyle} />
                <span style={taskTextStyle}>{task.title}</span>
              </li>
            ))}
          </ul>

          <Link href="/board?view=tasks" style={viewAllStyle}>
            View all tasks <ArrowRight size={13} />
          </Link>
        </>
      ) : (
        <p style={emptyStyle}>Nothing needs attention. All clear.</p>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-secondary)",
  borderRadius: 12,
  padding: "20px 24px",
  flex: 1,
  minWidth: 0,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--text-secondary)",
};

const countBadgeStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  backgroundColor: "rgba(210, 120, 60, 0.15)",
  color: "var(--warning)",
  borderRadius: 10,
  padding: "1px 7px",
  marginLeft: 4,
};

const summaryStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
};

const summaryItemStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontFamily: "var(--font-inter), Inter, sans-serif",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text-secondary)",
};

const taskItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
};

const bulletStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: "var(--warning)",
  flexShrink: 0,
  marginTop: 7,
};

const taskTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, sans-serif",
  fontSize: 13,
  color: "var(--text-primary)",
  lineHeight: 1.5,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const viewAllStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  marginTop: 14,
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--accent-color)",
  textDecoration: "none",
};

const emptyStyle: React.CSSProperties = {
  fontFamily: "var(--font-inter), Inter, sans-serif",
  fontSize: 14,
  color: "var(--text-tertiary)",
  margin: 0,
};
