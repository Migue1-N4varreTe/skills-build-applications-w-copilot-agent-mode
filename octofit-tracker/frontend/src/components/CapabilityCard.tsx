import { useEffect, useState, type ReactNode } from "react";
import { getJson } from "../api/client.js";

type Props = { title: string; description: string };
type ApiRecord = Record<string, unknown>;
type ApiProps = Props & {
  endpoint: string;
  collection: string;
  emptyMessage: string;
  renderItem: (item: ApiRecord) => ReactNode;
};

export function CapabilityCard({
  title,
  description,
  endpoint,
  collection,
  emptyMessage,
  renderItem,
}: ApiProps) {
  const [items, setItems] = useState<ApiRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<Record<string, unknown>>(endpoint)
      .then((data) => {
        const result = data[collection];
        if (!Array.isArray(result))
          throw new Error("The server returned an invalid response.");
        if (active)
          setItems(
            result.filter(
              (item): item is ApiRecord =>
                typeof item === "object" &&
                item !== null &&
                !Array.isArray(item),
            ),
          );
      })
      .catch((requestError: unknown) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unexpected error",
          );
      });
    return () => {
      active = false;
    };
  }, [endpoint, collection]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error ? (
          <p role="alert">
            Unable to load {title}: {error}
          </p>
        ) : items === null ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p role="status">{emptyMessage}</p>
        ) : (
          <ul className="list-group list-group-flush" aria-label={title}>
            {items.map((item, index) => (
              <li
                className="list-group-item px-0"
                key={String(item._id ?? index)}
              >
                {renderItem(item)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
