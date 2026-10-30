import { CapabilityCard } from "./CapabilityCard.js";
export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      collection="teams"
      emptyMessage="No teams yet."
      renderItem={(team) => (
        <>
          <strong>{String(team.name)}</strong> · {String(team.mascot)} ·{" "}
          {Array.isArray(team.members) ? team.members.length : 0} members
        </>
      )}
    />
  );
}
