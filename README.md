# AI Financial Research Agent

A financial research application that combines **SEC EDGAR filings**, deterministic financial analytics, and evidence retrieval to build a traceable foundation for a future LLM-powered research agent.

**Current approach:** Build and validate the non-LLM research engine first; integrate LLM tool calling after the data and citation pipeline is reliable.

## Features

- **Company financial analytics:** Retrieve SEC XBRL Company Facts and calculate annual revenue, year-over-year (YoY) revenue growth, and historical trends.
- **Growth insights:** Classify recent YoY growth as accelerating, decelerating, or stable using deterministic rules.
- **Financial dashboard:** Explore revenue and growth history with interactive charts.
- **SEC filing discovery:** Find the latest available Form 10-K for supported companies.
- **MD&A extraction:** Download a Form 10-K and extract Item 7, *Management's Discussion and Analysis of Financial Condition and Results of Operations*.
- **Evidence retrieval:** Rank extracted MD&A paragraphs by query-term coverage and return relevant passages alongside filing-level source metadata.
- **Unit tests:** Test financial calculations, growth insights, citation creation, MD&A extraction, and evidence retrieval.

> **Scope:** This is a research prototype, not an investment recommendation system. The current retrieval score measures lexical overlap, not semantic understanding or evidence reliability.

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Recharts
- **Backend:** Next.js Route Handlers
- **Data:** SEC EDGAR Company Facts API, Submissions API, and archived Form 10-K HTML
- **HTML processing:** Cheerio
- **Testing:** Vitest
- **LLM integration:** Planned; not required for the current research engine

## Architecture

```text
                         Ticker / Research Query
                                   |
                    +--------------+--------------+
                    |                             |
             Company Facts API             SEC Submissions API
                    |                             |
          Revenue & Growth Metrics             Latest Form 10-K
                    |                             |
          Rule-Based Growth Insights        Filing HTML Download
                    |                             |
                    |                       MD&A Extraction
                    |                             |
                    |                     Paragraph Segmentation
                    |                             |
                    |                     Lexical Relevance Ranking
                    |                             |
                    +--------------+--------------+
                                   |
                         Research Data + Citations
                                   |
                        Future LLM Tool Calling
```

## Relevance Score Algorithm

The initial evidence retriever uses **query-term coverage**: the fraction of distinct, non-stop-word query tokens that appear in a candidate paragraph.

For query `q` and paragraph `p`:

```math
\operatorname{Relevance}(p,q) =
\begin{cases}
\dfrac{|T(p) \cap T(q)|}{|T(q)|}, & |T(q)| > 0 \\
0, & |T(q)| = 0
\end{cases}
```

Where:

- `T(q)` is the **set** of distinct tokens in the query after lowercasing, tokenization, and stop-word removal.
- `T(p)` is the corresponding token set for a paragraph.
- `|T(p) ∩ T(q)|` counts how many distinct query terms occur in that paragraph.
- `|T(q)|` is the number of distinct query terms.

### Example

**Query:** `revenue growth in FY2026`

After preprocessing (with `in` removed as a stop word):

```text
T(q) = {revenue, growth, fy2026}
```

If a paragraph contains `revenue` and `growth`, but not `fy2026`:

```text
T(p) ∩ T(q) = {revenue, growth}
Relevance(p, q) = 2 / 3 = 0.667
```

A paragraph containing all three distinct query terms scores `1.0`; a paragraph containing none scores `0.0`.

### Retrieval Procedure

1. Split extracted MD&A text on blank lines into candidate paragraphs.
2. Discard candidates shorter than 80 characters.
3. Lowercase each paragraph and query; tokenize using `[a-z0-9]+` and remove a predefined English stop-word list.
4. Convert tokens into sets so repeated words do not inflate the score.
5. Calculate query-term coverage for each candidate paragraph.
6. Exclude paragraphs with score `0`, sort remaining paragraphs by descending score, and return the top `K`.

The current implementation assigns paragraph identifiers such as `mda-p-12` based on paragraph order. These identifiers are **not stable across changes to text extraction or segmentation**.

### Reference Implementation

```typescript
function tokenize(text: string): string[] {
  return (
    text.toLowerCase().match(/[a-z0-9]+/g)?.filter(
      (word) => !STOP_WORDS.has(word)
    ) ?? []
  );
}

const queryTokens = new Set(tokenize(query));
const paragraphTokens = new Set(tokenize(paragraph));

const matches = [...queryTokens].filter((token) =>
  paragraphTokens.has(token)
).length;

const score = queryTokens.size > 0
  ? matches / queryTokens.size
  : 0;
```

`STOP_WORDS` is the predefined set in `lib/evidence.ts`.

### Complexity

Let `P` be the number of candidate paragraphs, `N` the total number of tokens across all paragraphs, and `Q` the number of query tokens.

- Tokenization and set construction: **O(N + Q)** expected time.
- Query-term overlap across paragraphs: **O(P × Q)** expected time using hash-set membership.
- Sorting all scored paragraphs: **O(P log P)** time.
- Overall: **O(N + P × Q + P log P + Q)** expected time, excluding network and HTML processing.

### Limitations

- **Exact lexical matching only:** `grow` does not match `growth`; `sales` does not match `revenue`.
- **No semantic reasoning:** A high score does not establish that a passage answers the user's question.
- **No term weighting:** Common financial terms and distinctive terms contribute equally.
- **No frequency or length normalization:** Repeated terms do not raise the score, and long paragraphs can match more distinct query terms.
- **Segmentation quality matters:** SEC HTML formatting can merge words or split paragraphs incorrectly.
- **Citation granularity:** Current source metadata points to the filing as a whole, not a verified HTML anchor or exact paragraph offset.
- **Boundary extraction is heuristic:** MD&A start/end detection must be validated across different issuers and filing formats.

**Planned improvements:** BM25 baseline, synonym/lemmatization handling, stable passage IDs, section-boundary tests, passage-level citation anchors, retrieval evaluation (e.g., Precision@K and Recall@K), and eventually embedding-based or hybrid retrieval.

## API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/company?ticker=NVDA` | Revenue, growth history, and rule-based insights |
| `GET /api/filings?ticker=NVDA` | Latest available 10-K metadata and filing citation |
| `GET /api/mda?ticker=NVDA` | Extracted MD&A preview and filing citation |
| `GET /api/evidence?ticker=NVDA&query=revenue%20growth` | Top-ranked MD&A evidence passages |

The evidence endpoint returns passage text and relevance scores, plus **filing-level** citation metadata. Its scores should not be interpreted as probabilities or factual confidence.

## Getting Started

**Prerequisites:** Node.js and npm.

```bash
npm install
```

Create a local `.env.local` file containing an identifiable SEC User-Agent:

```env
SEC_USER_AGENT="AI Financial Research Agent contact@example.com"
```

Replace the example address with a valid contact email. Do not commit `.env.local` to version control.

Run the development server:

```bash
npm run dev
```

Test the APIs:

```bash
curl -s "http://localhost:3000/api/company?ticker=NVDA"
curl -s "http://localhost:3000/api/filings?ticker=NVDA"
curl -s "http://localhost:3000/api/mda?ticker=NVDA"
curl -sG "http://localhost:3000/api/evidence" \
  --data-urlencode "ticker=NVDA" \
  --data-urlencode "query=revenue growth"
```

Run validation:

```bash
npx tsc --noEmit
npx vitest run
```

## Data Sources and Responsible Use

- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [SEC Accessing EDGAR Data](https://www.sec.gov/os/accessing-edgar-data)

SEC EDGAR provides public filings, but automated access must respect SEC fair-access guidance. Large filing responses may exceed Next.js's fetch-cache item limit; caching and request throttling should be handled deliberately rather than relying on repeated unrestricted downloads.

## Roadmap

- [x] Annual revenue and YoY growth analytics
- [x] Interactive financial dashboard
- [x] Rule-based growth insights
- [x] SEC 10-K discovery and filing-level citations
- [x] Initial MD&A extraction
- [x] Initial lexical evidence ranking
- [ ] Robust MD&A boundary and text-quality validation
- [ ] Paragraph-level citation provenance and stable passage identifiers
- [ ] Retrieval quality evaluation and improved ranking
- [ ] Deterministic, evidence-backed research report
- [ ] LLM integration, tool calling, and grounded report generation

## Disclaimer

For educational and research purposes only. Financial metrics, extracted passages, and research outputs should be verified against original SEC filings. Nothing in this project constitutes financial or investment advice.
