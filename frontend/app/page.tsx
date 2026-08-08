"use client";
import { FormEvent, useEffect, useState } from "react";

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
  const [mounted, setMounted] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function submitQuestion(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer(null);
    setResultVisible(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, top_k: 3 }),
      });

      if (!response.ok) {
        throw new Error("The API request failed.");
      }

      const result: Answer = await response.json();
      setAnswer(result);
      requestAnimationFrame(() => setResultVisible(true));
    } catch {
      setError(
        "Couldn't reach the API. Check that the backend is running and CORS is configured."
      );
    } finally {
      setLoading(false);
    }
  }

  const uniqueSources = answer ? Array.from(new Set(answer.sources)) : [];

  return (
    <main className="min-h-screen bg-[#F7F5F0] px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div
          className={`transition-all duration-700 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-[#2F5D8A]">
            Grounded document search
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-[#14171C] sm:text-5xl">
            Ask the documents.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#56606E]">
            Every answer is pulled directly from the source postings below it.
            No source, no answer.
          </p>
        </div>

        {/* Question form */}
        <form
          onSubmit={submitQuestion}
          className={`mt-10 rounded-2xl border border-[#E1DACB] bg-white p-6 shadow-[0_1px_2px_rgba(20,23,28,0.04)] transition-all duration-700 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <label
            className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-[#56606E]"
            htmlFor="question"
          >
            Your question
          </label>
          <textarea
            id="question"
            className="mt-3 min-h-28 w-full resize-none rounded-lg border border-[#E1DACB] bg-[#FCFBF8] p-4 text-[15px] text-[#14171C] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#2F5D8A] focus-visible:ring-2 focus-visible:ring-[#2F5D8A]/30"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What experience is required for the DevOps role?"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#14171C] px-5 py-2.5 text-sm font-medium text-[#F7F5F0] transition-colors hover:bg-[#2F5D8A] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F5D8A]"
          >
            {loading ? (
              <>
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                </span>
                Searching
              </>
            ) : (
              "Ask question"
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg border-l-2 border-[#B3462C] bg-[#B3462C]/[0.06] px-4 py-3">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[#B3462C]">
              Note
            </p>
            <p className="mt-1 text-sm text-[#14171C]">{error}</p>
          </div>
        )}

        {/* Answer */}
        {answer && (
          <section
            className={`mt-6 rounded-2xl border border-[#E1DACB] bg-white p-6 transition-all duration-500 ease-out ${
              resultVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            <p className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-[#56606E]">
              Answer
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-[#14171C]">
              {answer.answer}
            </p>

            <div className="mt-6 border-t border-[#E1DACB] pt-5">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-[#56606E]">
                Sources
              </p>
              {uniqueSources.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {uniqueSources.map((source, index) => (
                    <li
                      key={source}
                      className={`flex items-center gap-1.5 rounded-full border border-[#E1DACB] bg-[#FCFBF8] px-3 py-1.5 transition-all duration-400 ease-out ${
                        resultVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                      }`}
                      style={{ transitionDelay: `${150 + index * 90}ms` }}
                    >
                      <span className="font-mono text-[11px] font-semibold text-[#C98A2B]">
                        {index + 1}
                      </span>
                      <span className="font-mono text-[12px] text-[#14171C]">
                        {source}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#56606E]">
                  No sources returned.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}