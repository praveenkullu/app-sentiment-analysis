import React, { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial", maxWidth: 600, margin: "2rem auto" }}>
      <h1>Sentiment Analysis (gRPC Demo)</h1>
      <textarea
        rows="6"
        style={{ width: "100%" }}
        placeholder="Type some text..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={analyze} disabled={loading || !text.trim()}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {result && (
        <pre style={{ background: "#f7f7f7", padding: "10px", marginTop: "1rem" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
