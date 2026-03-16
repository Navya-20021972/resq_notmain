// components/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const statusLower = (status || 'pending').toLowerCase();
  
  const styles = {
    pending: {
      background: "rgba(234,179,8,0.2)",
      color: "#fbbf24",
      text: "Pending"
    },
    processing: {
      background: "rgba(147,51,234,0.2)",
      color: "#a78bfa",
      text: "Processing"
    },
    found: {
      background: "rgba(16,185,129,0.2)",
      color: "#34d399",
      text: "Found"
    },
    completed: {
      background: "rgba(59,130,246,0.2)",
      color: "#60a5fa",
      text: "Completed"
    }
  };

  let style = styles.pending;
  if (statusLower.includes('processing')) style = styles.processing;
  else if (statusLower.includes('found') || statusLower.includes('detected')) style = styles.found;
  else if (statusLower.includes('completed')) style = styles.completed;

  return (
    <span style={{
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "700",
      background: style.background,
      color: style.color
    }}>
      {style.text}
    </span>
  );
}
