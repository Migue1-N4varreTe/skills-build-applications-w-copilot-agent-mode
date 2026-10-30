import { CapabilityCard } from "./CapabilityCard.js";
export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      collection="leaderboard"
      emptyMessage="No rankings yet."
      renderItem={(entry) => (
        <>
          <strong>
            #{String(entry.rank)} {String(entry.teamName)}
          </strong>{" "}
          · {String(entry.totalPoints)} points
        </>
      )}
    />
  );
}
