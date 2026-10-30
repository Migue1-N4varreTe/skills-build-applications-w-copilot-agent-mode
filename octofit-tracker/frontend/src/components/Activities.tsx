import { CapabilityCard } from "./CapabilityCard.js";
export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      endpoint="/api/activities"
      collection="activities"
      emptyMessage="No activities yet."
      renderItem={(activity) => (
        <>
          <strong>{String(activity.type)}</strong> · {String(activity.minutes)}{" "}
          min · {String(activity.points)} points
        </>
      )}
    />
  );
}
