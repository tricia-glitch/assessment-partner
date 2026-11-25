# Assessment Partner

Upload a lesson or unit plan and get feedback from the three frameworks that fit it best, drawn from a library of 50 frameworks for assessment in a time of generative AI.

- **Use it on the library page:** https://triciafriedman.com/ai-assessment-frameworks/
- **Standalone version:** https://ai-assessment-partner.netlify.app

Built by Tricia Friedman. Licensed [CC BY-NC 4.0](LICENSE.md): free for schools, teachers and nonprofits to use and adapt with credit, but not for commercial use.

## What it does

1. A teacher uploads a plan (Word .docx, PDF or a text file) or pastes it in, with an optional note such as "focus on how I handle AI".
2. The partner reads the plan and picks the three library entries that fit it best, favouring a spread of ideas.
3. It gives feedback in a set shape:
   - **What I see in your plan:** how students are assessed, where AI comes in, and which "What is learning for?" lens the plan seems to serve
   - **The three best fits**, linked, with why each suits this plan
   - **Already working** and **Try this** through each framework, with example wording
   - **Start with these three changes**
4. The teacher can keep going: rewrite a section, draft a rubric, or look at the plan through another framework.

On the library page, every framework card also gets an "Include in my feedback" button.

## Ground rules the partner follows

- It knows each framework only through the library's one-sentence summary, and never invents details beyond it. It links every framework so teachers can read the source.
- It says when a framework was written for universities and adapts it for K-12.
- It never promises an "AI-proof" assessment and never recommends AI detectors.
- Uploaded plans are not stored. A plan is sent to the AI model only to produce the feedback.

## How it's built

| File | What it is |
|---|---|
| `index.html` | The standalone page: upload box, chat and a library browser |
| `embed.js` | The same feedback tool as a widget that fills `<section id="tfap">` on another page |
| `frameworks.json` | The 50 library entries (title, link, author, date, region, type, summary, lenses) |
| `netlify/edge-functions/partner/partner.js` | The server side: holds the system prompt and the API key, calls Claude and streams the reply |
| `netlify/edge-functions/partner/kb.js` | The library entries, generated for the server |
| `tools/build_kb.py` | Rebuilds both data files from `tools/source-page-text.txt` (text saved from the library page) |
| `test-plans/` | Two made-up lesson plans (Word and PDF) for testing |

Word files are read in the browser with a small built-in unzip, so no outside libraries are needed. PDFs are sent to the model as documents. The uploaded plan is resent on each turn of the conversation and cached on the model side.

The model is Claude Opus 5.5 (`claude-opus-5-5`), called through a Netlify Edge Function that streams the reply.

## Run your own version

You'll need a free [Netlify](https://www.netlify.com/) account and an [Anthropic API key](https://console.anthropic.com/).

1. Copy or fork this repository.
2. Create a Netlify site from it. There is no build step, and the publish folder is the repository root.
3. In Netlify, add an environment variable named `ANTHROPIC_API_KEY` with your key, then redeploy. The site only picks up a new key on the next deploy.
4. **Set a monthly spending limit** in the Anthropic console (Settings, Limits). The endpoint is public, so a limit caps what anyone can spend on your key.

To use your own library:

1. Save the text of your library page to `tools/source-page-text.txt`, or edit `tools/build_kb.py` to read your own data.
2. Run `python3 tools/build_kb.py`.
3. Update the library description and lenses at the top of `partner.js`.

To embed the widget on another site, add `<section id="tfap"></section>` and `<script src="https://YOUR-SITE.netlify.app/embed.js" defer></script>` to the page. Then change `API` in `embed.js` and the `ALLOWED` origins in `partner.js` to match.

## Credit

If you adapt this, please credit: "Based on Assessment Partner by Tricia Friedman (triciafriedman.com), CC BY-NC 4.0."
