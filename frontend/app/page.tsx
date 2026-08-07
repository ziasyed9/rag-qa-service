"use client";

import { FormEvent, useState } from "react";

type Answer = {
  question: string;
  answer: string;
  sources: string[];
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitQuestion(event: FormEvent) {
    event.preventDefault();

    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setAnswer(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            top_k: 3,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("The API request failed.");
      }

      const result: Answer = await response.json();
      setAnswer(result);
    } catch {
      setError(
        "Could not reach the API. Check that the backend URL and CORS settings are correct."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-8 sm:p-16">
      <h1 className="text-3xl font-bold">Document Q&A</h1>

      <p className="mt-2 text-gray-600">
        Ask a question about the documents in the RAG knowledge base.
      </p>

      <form onSubmit={submitQuestion} className="mt-8 space-y-4">
        <label className="block font-medium" htmlFor="question">
          Your question
        </label>

        <textarea
          id="question"
          className="min-h-32 w-full rounded-lg border border-gray-300 p-4"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What experience is required?"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Searching…" : "Ask question"}
        </button>
      </form>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {answer && (
        <section className="mt-8 rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">Answer</h2>
          <p className="mt-3 whitespace-pre-wrap">{answer.answer}</p>

          <h3 className="mt-6 font-semibold">Sources</h3>

          {answer.sources.length > 0 ? (
            <ul className="mt-2 list-disc pl-5">
              {answer.sources.map((source, index) => (
                <li key={`${source}-${index}`}>{source}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-gray-600">No sources returned.</p>
          )}
        </section>
      )}
    </main>
  );
}