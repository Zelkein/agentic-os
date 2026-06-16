"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb, Thermometer, Lock, Plug, Power,
  Droplets, Wind, Speaker, Tv, Fan, Sun,
  AlertCircle, RefreshCw, Home,
} from "lucide-react";

const sp = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-inter), Inter, sans-serif",
  ...s,
});

const sg = (s: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
  ...s,
});

interface HAEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

interface HAData {
  entities: HAEntity[];
  byArea: Record<string, HAEntity[]>;
  total: number;
  config: { url: string };
}

const DOMAIN_ICONS: Record<string, typeof Lightbulb> = {
  light: Lightbulb,
  switch: Power,
  sensor: Thermometer,
  binary_sensor: AlertCircle,
  lock: Lock,
  cover: Sun,
  climate: Thermometer,
  fan: Fan,
  media_player: Tv,
  speaker: Speaker,
  humidifier: Droplets,
  vacuum: Wind,
};

const DOMAIN_COLORS: Record<string, string> = {
  light: "#EAB308",
  switch: "#22C55E",
  sensor: "#06B6D4",
  binary_sensor: "#F97316",
  lock: "#EF4444",
  cover: "#A855F7",
  climate: "#EC4899",
  fan: "#6366f1",
  media_player: "#8B5CF6",
};

function getDomain(entityId: string): string {
  return entityId.split(".")[0];
}

function getFriendlyName(entity: HAEntity): string {
  return entity.attributes.friendly_name || entity.entity_id;
}

function formatState(entity: HAEntity): string {
  const domain = getDomain(entity.entity_id);
  if (domain === "light" || domain === "switch") {
    return entity.state === "on" ? "On" : "Off";
  }
  if (entity.attributes.unit_of_measurement) {
    return `${entity.state} ${entity.attributes.unit_of_measurement}`;
  }
  return entity.state;
}

export function HaView() {
  const [data, setData] = useState<HAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ha");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const d = await res.json();
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const toggleEntity = useCallback(async (entityId: string) => {
    const domain = getDomain(entityId);
    const currentState = data?.entities.find((e) => e.entity_id === entityId)?.state;
    const service = currentState === "on" ? "turn_off" : "turn_on";

    setToggling((prev) => new Set(prev).add(entityId));
    try {
      const res = await fetch("/api/ha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, service, entity_id: entityId }),
      });
      if (res.ok) {
        // Optimistic update
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            entities: prev.entities.map((e) =>
              e.entity_id === entityId
                ? { ...e, state: service === "turn_on" ? "on" : "off" }
                : e
            ),
          };
        });
      }
    } catch {
      // ignore
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(entityId);
        return next;
      });
    }
  }, [data]);

  if (loading) {
    return (
      <div style={{ padding: "24px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 80,
                borderRadius: 12,
                backgroundColor: "var(--bg-tertiary)",
                animation: "pulse-opacity 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "40px 24px",
          textAlign: "center",
          backgroundColor: "var(--bg-tertiary)",
          borderRadius: 12,
          border: "1px solid var(--border-color-secondary)",
        }}
      >
        <AlertCircle size={32} style={{ color: "var(--error)", marginBottom: 12 }} />
        <h3 style={sg({ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px" })}>
          Home Assistant Not Reachable
        </h3>
        <p style={sp({ fontSize: 13, color: "var(--text-tertiary)", margin: "0 0 16px", maxWidth: 400, margin: "0 auto 16px" })}>
          {error}
        </p>
        <p style={sp({ fontSize: 12, color: "var(--text-tertiary)", margin: "0 0 16px" })}>
          Set <code style={{ backgroundColor: "var(--bg-elevated)", padding: "1px 4px", borderRadius: 3 }}>HA_URL</code> and{" "}
          <code style={{ backgroundColor: "var(--bg-elevated)", padding: "1px 4px", borderRadius: 3 }}>HA_TOKEN</code> in your .env file.
        </p>
        <button
          onClick={fetchEntities}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.entities.length === 0) {
    return (
      <div
        style={{
          padding: "40px 24px",
          textAlign: "center",
          backgroundColor: "var(--bg-tertiary)",
          borderRadius: 12,
          border: "1px solid var(--border-color-secondary)",
        }}
      >
        <Home size={32} style={{ color: "var(--text-tertiary)", marginBottom: 12 }} />
        <p style={sp({ fontSize: 13, color: "var(--text-tertiary)" })}>
          No entities found. Make sure Home Assistant is running and has entities configured.
        </p>
      </div>
    );
  }

  const areaNames = Object.keys(data.byArea).sort();

  return (
    <div style={{ padding: "24px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Home size={18} style={{ color: "var(--accent-color)" }} />
          <h2 style={sg({ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 })}>
            Home
          </h2>
          <span style={sp({ fontSize: 12, color: "var(--text-tertiary)", marginLeft: 4 })}>
            {data.total} entities
          </span>
        </div>
        <button
          onClick={fetchEntities}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "5px 10px",
            borderRadius: 6,
            border: "1px solid var(--border-color-tertiary)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            fontSize: 11,
            fontFamily: "var(--font-inter), Inter, sans-serif",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Areas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {areaNames.map((area) => {
          const entities = data.byArea[area];
          return (
            <div
              key={area}
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border-color-secondary)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--border-color-tertiary)",
                  backgroundColor: "var(--bg-secondary)",
                }}
              >
                <h3 style={sg({ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0, textTransform: "capitalize" })}>
                  {area.replace(/_/g, " ")}
                </h3>
              </div>
              <div style={{ padding: 8 }}>
                {entities.map((entity) => {
                  const domain = getDomain(entity.entity_id);
                  const Icon = DOMAIN_ICONS[domain] || Power;
                  const color = DOMAIN_COLORS[domain] || "var(--text-secondary)";
                  const isOn = entity.state === "on";
                  const isToggleable = ["light", "switch", "fan"].includes(domain);
                  const isLoading = toggling.has(entity.entity_id);

                  return (
                    <div
                      key={entity.entity_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 8px",
                        borderRadius: 8,
                        transition: "background 120ms ease",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isOn ? `${color}20` : "var(--bg-elevated)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 200ms ease",
                        }}
                      >
                        <Icon
                          size={15}
                          style={{
                            color: isOn ? color : "var(--text-tertiary)",
                            transition: "color 200ms ease",
                          }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={sp({
                            fontSize: 13,
                            color: "var(--text-primary)",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          })}
                        >
                          {getFriendlyName(entity)}
                        </div>
                        <div
                          style={sp({
                            fontSize: 11,
                            color: isOn ? color : "var(--text-tertiary)",
                            marginTop: 1,
                          })}
                        >
                          {formatState(entity)}
                        </div>
                      </div>

                      {isToggleable && (
                        <button
                          onClick={() => toggleEntity(entity.entity_id)}
                          disabled={isLoading}
                          style={{
                            padding: "4px 12px",
                            borderRadius: 6,
                            border: `1px solid ${isOn ? color : "var(--border-color-tertiary)"}`,
                            background: isOn ? `${color}18` : "transparent",
                            color: isOn ? color : "var(--text-secondary)",
                            fontSize: 11,
                            fontFamily: "var(--font-inter), Inter, sans-serif",
                            fontWeight: 500,
                            cursor: isLoading ? "wait" : "pointer",
                            transition: "all 120ms ease",
                            opacity: isLoading ? 0.6 : 1,
                          }}
                        >
                          {isLoading ? "..." : isOn ? "Off" : "On"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}