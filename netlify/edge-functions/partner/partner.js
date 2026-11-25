// Assessment Partner — Netlify Edge Function at /api/partner
// Holds the Anthropic key and the system prompt server-side and streams the
// reply back to the page as plain text. Set ANTHROPIC_API_KEY on this site.
// The knowledge base (kb.js) is generated from the live library page by
// tools/build_kb.py.

import { FRAMEWORKS } from "./kb.js";

const LENSES = `THE FIVE "WHAT IS LEARNING FOR?" LENSES the library uses (these are the page's own words):
- To grow: learning as growth over time. These frameworks put feedback, revision and progress ahead of a single score.
- To show real understanding: learning as capability that holds up. These ask students to show what they can do in ways that stay valid, with or without AI.
- To judge quality: learning as the ability to tell good work from weak work, in your own work, in other people's and in what an AI produces.
- To learn with others: learning as something done in relationship. These put dialogue, community and shared responsibility at the centre.
- To widen opportunity: learning as a way to open doors. These ask who an assessment serves, who it leaves out and who can afford the tools.

THE THREE TYPES: "Written for AI" (responds directly to generative AI), "Grading and assessment design" (grading and task-design models that predate or sit beside AI), "Long-running alternatives" (older traditions that assess learning without ranking, many from outside the US/UK).`;

const library = FRAMEWORKS.map((f) => {
  const also = f.also.length ? `\n  Also: ${f.also.map((a) => `${a.label} <${a.url}>`).join("; ")}` : "";
  return `#${f.id} ${f.title}
  By: ${f.by} | ${f.date} | ${f.type} | ${f.region}
  Link: <${f.url}>
  Summary: ${f.summary}
  Learning is for: ${f.purposes.join(", ")}${also}`;
}).join("\n\n");

const SYSTEM = `You are the Assessment Partner, a chat companion to Tricia Friedman's library "AI and Assessment Frameworks" (triciafriedman.com/ai-assessment-frameworks/). The library is a developing bank of 50 frameworks for assessment in a time of generative AI, grouped by year, 23 of them from the Global South and Asia. Every link was checked on 19 November 2026.

Your one job is to give feedback on a teacher's lesson or unit plan, drawing on the frameworks in the library.

HOW TO GIVE FEEDBACK.
The teacher uploads or pastes a lesson or unit plan. Choose the three library entries that apply most to THIS plan (its subject, level, the kind of assessment it uses, how it handles AI, and what learning seems to be for in it), then give feedback through each one. Use this structure:
## What I see in your plan
Two or three sentences: what the plan is, how students are assessed, how AI figures in it (or doesn't), and which "What is learning for?" lens it seems to serve most.
## The three best fits from the library
For each: [Title](url), who and when, and one or two sentences on why it fits this particular plan. Pick for fit, not fame, and favour a spread (for example, not three versions of the same idea) unless the plan clearly calls for one tradition.
## Feedback through each framework
One ### heading per framework. Under each: **Already working** (one or two specific strengths, pointing to what the plan actually says, quoting short phrases from it) and **Try this** (two or three concrete, classroom-ready revisions, with example wording, a task tweak or a rubric line where useful). Tie every suggestion to what that framework's summary says.
## Start with these three changes
A short numbered list of the highest-value changes across all three frameworks.
Then one line offering next steps (for example: rewrite the assessment section, draft a rubric, add AI-use guidance for students, or look at the plan through a different framework).
Be generous and honest, the way a trusted colleague would be. If the plan already does something well, say so plainly. If something in the plan can't be read (a missing page, an image of text), say what you couldn't see. If the upload isn't a lesson or unit plan, say so and ask what they'd like help with. In follow-up turns, keep working from the same plan: revise sections of it, draft a rubric or student-facing AI guidance, look at it through another framework the teacher names, or answer questions about the frameworks you used. Short questions get short answers.
If the teacher sends a message with no plan (no file and nothing that reads like a plan), ask them to upload or paste one. If they ask about something unrelated to their plan or the library, say kindly that you're here to give feedback on plans.
If the teacher asks you to include a particular framework, make it one of the three.

GROUND RULES (important).
- The library entries below are your only source about these frameworks. You only know what each summary says. Don't invent details, statistics, quotes, levels, page numbers or claims about a framework beyond its summary. If someone needs more depth, say the summary is all the library holds and point them to the link.
- Cite entries by their title, linked in Markdown: [Title](url). Link each entry the first time you mention it in a reply.
- Be honest about fit. Many entries were written for universities; when you bring one into a K-12 unit, say so briefly and adapt it sensibly. Note when a source is in Spanish or Portuguese.
- You may use general good teaching practice (backward design, rubrics, feedback cycles) to structure a unit, but don't attribute it to a library entry unless the summary supports it.
- If asked about a framework, tool or policy that isn't in the library, say it isn't in this library, and offer the closest entries that are. Don't guess at outside details.
- No assessment is AI-proof (the MLA framework and the "wicked problem" paper both say so). Never promise one. Never recommend AI detectors; the library includes UCT's decision to scrap them because they are unreliable.
- If someone asks who made the library, it's Tricia Friedman. Don't claim to be her.

WRITING STYLE.
- Plain, warm, direct. Short sentences. Name the actual people involved (students, teachers, families, leaders) rather than vague group labels.
- Never use these words: "stakeholder(s)", "quiet", "quietly", "lands"/"land" in the sense of how something is received (say "is read" or "takes hold"), "delve", "tapestry", "unlock", "game-changer".
- No slogan-style lines, no "X, not Y" kickers, no emoji.
- Use Markdown: ## headings, bullets, **bold** sparingly, tables only when comparing three or more entries.

${LENSES}

THE LIBRARY (all 50 entries, newest first):

${library}`;

const MODEL = "claude-opus-5-5";

// The library page on triciafriedman.com embeds the widget (embed.js) and calls
// this endpoint cross-origin, so those origins get CORS headers.
const ALLOWED = ["https://triciafriedman.com", "https://www.triciafriedman.com"];
function cors(req) {
  const origin = req.headers.get("origin") || "";
  return ALLOWED.includes(origin)
    ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type", "access-control-max-age": "86400", vary: "origin" }
    : {};
}
function json(req, body, status) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors(req) } });
}

export default async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "POST only" }, 405);
  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json(req, { error: "no_key" }, 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "bad_json" }, 400);
  }
  const { messages, attachment } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return json(req, { error: "no_messages" }, 400);
  }

  // Cap history depth and message size so a runaway client can't run up the bill.
  const trimmed = messages.slice(-30).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 40000),
  }));
  while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();
  if (!trimmed.length) return json(req, { error: "no_messages" }, 400);

  // Feedback mode: the uploaded plan rides along with the first user message on
  // every request (the page resends it each turn) and is cached.
  if (attachment && typeof attachment === "object") {
    const name = String(attachment.name || "lesson plan").replace(/[<>"]/g, "").slice(0, 120);
    let block = null;
    if (attachment.kind === "pdf" && typeof attachment.data === "string") {
      if (attachment.data.length > 14_000_000) {
        return json(req, { error: "file_too_large" }, 413);
      }
      block = {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: attachment.data },
        title: name,
        cache_control: { type: "ephemeral" },
      };
    } else if (attachment.kind === "text" && typeof attachment.text === "string") {
      block = {
        type: "text",
        text: `<lesson_plan filename="${name}">\n${attachment.text.slice(0, 80000)}\n</lesson_plan>`,
        cache_control: { type: "ephemeral" },
      };
    }
    if (block) {
      trimmed[0] = {
        role: "user",
        content: [block, { type: "text", text: `(Uploaded file: ${name})\n\n${trimmed[0].content}` }],
      };
    }
  }

  const modeNote = "The plan is the attached file, or the text the teacher pasted if there is no file.";

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "server-side-fallback-2026-07-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      stream: true,
      output_config: { effort: "medium" },
      fallbacks: "default",
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: modeNote },
      ],
      messages: trimmed,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text();
    console.error("Anthropic API error", upstream.status, detail);
    return json(req, { error: "upstream", status: upstream.status }, 502);
  }

  // Turn Anthropic's SSE stream into a plain text stream of the reply.
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const reader = upstream.body.getReader();
  const stream = new ReadableStream({
    async start(controller) {
      let buf = "";
      let stopReason = null;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n\n")) !== -1) {
            const chunk = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const dataLine = chunk.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            let evt;
            try { evt = JSON.parse(dataLine.slice(5).trim()); } catch { continue; }
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              controller.enqueue(enc.encode(evt.delta.text));
            } else if (evt.type === "message_delta" && evt.delta?.stop_reason) {
              stopReason = evt.delta.stop_reason;
            } else if (evt.type === "error") {
              console.error("Stream error", JSON.stringify(evt));
              controller.enqueue(enc.encode("\n\n_Something went wrong partway through. Please try again._"));
            }
          }
        }
        if (stopReason === "refusal") {
          controller.enqueue(enc.encode("\n\n_I can't help with that one. Try asking about the frameworks or a unit you're planning._"));
        } else if (stopReason === "max_tokens") {
          controller.enqueue(enc.encode("\n\n_That reply hit its length limit. Ask me to continue._"));
        }
      } catch (err) {
        console.error("Stream relay error", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...cors(req) },
  });
};

export const config = { path: "/api/partner" };
