"use client";
import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

type Notification = {
  title: string;
  body: string;
  timestamp: string;
};

export default function NotificationBell() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [livePopups, setLivePopups] = useState<Notification[]>([]);

  // Load history whenever popout opens
  useEffect(() => {
    if (!showNotifications) return;

    async function fetchHistory() {
      try {
        const res = await fetch(
          "https://backend.ellinet13.com/api/notifications/history"
        );
        const data = await res.json();
        const normalized: Notification[] = data.map((n: any) => ({
          title: n.title ?? "",
          body: n.body ?? "",
          timestamp: n.timestamp ?? n.createdAt ?? new Date().toISOString(),
        }));
        setNotifications(normalized);
      } catch (err) {
        console.error("Failed to load notifications history:", err);
      }
    }

    fetchHistory();
  }, [showNotifications]);

  // SSE for real-time notifications
  useEffect(() => {
    const evtSource = new EventSource(
      "https://backend.ellinet13.com/api/notifications/stream"
    );

    const handleMessage = (event: MessageEvent) => {
      // Ignore empty or ping messages
      if (!event.data || event.data.trim().startsWith(":")) return;

      try {
        const data = JSON.parse(event.data);
        if (!data.title || !data.body) return;

        const newNotif: Notification = {
          title: data.title,
          body: data.body,
          timestamp: data.timestamp ?? new Date().toISOString(),
        };

        // Add to history
        setNotifications((prev) => [newNotif, ...prev]);

        // Add live popup
        setLivePopups((prev) => {
          const exists = prev.find(
            (n) => n.timestamp === newNotif.timestamp && n.title === newNotif.title
          );
          if (exists) return prev;

          setTimeout(() => {
            setLivePopups((prev) =>
              prev.filter(
                (n) => !(n.timestamp === newNotif.timestamp && n.title === newNotif.title)
              )
            );
          }, 5000);

          return [...prev, newNotif];
        });
      } catch (e) {
        console.error("Invalid SSE data:", event.data);
      }
    };

    evtSource.addEventListener("message", handleMessage);

    evtSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      evtSource.close();
    };

    return () => {
      evtSource.removeEventListener("message", handleMessage);
      evtSource.close();
    };
  }, []);

  return (
    <>
      <div style={{ position: "relative" }}>
        <Bell
          size={24}
          style={{ cursor: "pointer" }}
          onClick={() => setShowNotifications((s) => !s)}
          className="hover:text-blue-400"
        />

        {showNotifications && (
          <div
            style={{
              position: "absolute",
              top: "40px",
              right: "0",
              width: "320px",
              maxHeight: "320px",
              overflowY: "auto",
              backgroundColor: "#1e1e1e",
              color: "white",
              border: "1px solid #4d4d4d",
              borderRadius: "8px",
              padding: "0.5rem",
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              zIndex: 100,
            }}
          >
            <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
              Notifications
            </h3>

            {notifications.length === 0 ? (
              <div style={{ padding: "0.5rem", color: "#aaa" }}>
                No notifications yet.
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {notifications.map((n, i) => (
                  <li
                    key={`${n.timestamp}-${i}`}
                    style={{
                      borderBottom: "1px solid #333",
                      padding: "0.5rem 0",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                      {n.body}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#aaa" }}>
                      {new Date(n.timestamp).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Live popups */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 9999,
        }}
      >
        {livePopups.map((notif) => (
          <div
            key={`${notif.timestamp}-${notif.title}`}
            style={{
              backgroundColor: "#1e1e1e",
              color: "white",
              border: "1px solid #444",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              minWidth: "250px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            <div>
              <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                {notif.title}
              </div>
              <div style={{ fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                {notif.body}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#aaa" }}>
                {new Date(notif.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <X
              size={16}
              style={{ cursor: "pointer", marginLeft: "0.5rem" }}
              onClick={() =>
                setLivePopups((prev) =>
                  prev.filter(
                    (n) => !(n.timestamp === notif.timestamp && n.title === notif.title)
                  )
                )
              }
            />
          </div>
        ))}
      </div>
    </>
  );
}
