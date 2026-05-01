# DevOps Agent Demo — Jira via Okta Brokered Consent

**Demo user:** `oktaforai@atko.email`
**Target app:** Atlassian Jira
**Flow shown:** Okta OAuth-STS (RFC 8693) Brokered Consent for AI Agents
**Approx. runtime:** 6–8 minutes (with Okta admin deep-dive), 5–7 without

---

## 0 · Scene-setting (before you hit record)

- [ ] Browser: fresh incognito window, zoom 110–125% so the UI reads on video.
- [ ] Two tabs ready: (1) `http://localhost:3000` (DevOps Agent), (2) Jira instance for `oktaforai@atko.email`.
- [ ] Backend up: `uvicorn api.main:app --reload --port 8000`.
- [ ] Frontend up: `npm run dev` (port 3000).
- [ ] Revoke any cached Jira consent for `oktaforai@atko.email` so the `interaction_required` flow fires live. (Hit `POST /api/revoke` or clear in Okta admin.)
- [ ] Right panel sized ~60% (detail pane > chat pane). Collapse all step cards so they open dramatically on click.
- [ ] Close Slack / DMs / notifications. Silence phone.
- [ ] Okta admin console signed in (separate browser profile or window) with these tabs pre-loaded:
  - **Applications → DevOps Agent** (the AI Agent OAuth client)
  - **Applications → Jira Managed Connection**
  - **Reports → System Log**, filtered to `actor.alternateId eq "oktaforai@atko.email"`, last 10 minutes
  - **Directory → People → oktaforai@atko.email → Applications** tab
- [ ] In System Log, pin the filter so a refresh picks up the fresh events after the live run.

---

## 1 · Opening tone (0:00 – 0:30)

> "AI agents are moving from cool demos to real work — reading your tickets, filing PRs, updating issues on your behalf. But the moment an agent touches **your** Jira with **your** permissions, a hard question shows up:
>
> *Who is actually authorizing that access, and how do you prove it?*
>
> Static API keys don't cut it. Service accounts break audit trails. What we need is an agent that gets **delegated, scoped, user-consented** access — the same way a human would log in — but built for machines.
>
> That's what I'm going to show you. A DevOps agent, signed in as human identity oktaforai@atko.email, asking Jira to do real work on my behalf, using **Okta Brokered Consent** over OAuth-STS."

*(Pause. Switch to the browser.)*

---

## 2 · The setup (0:30 – 1:00)

**On screen:** DevOps Agent landing page, signed in as `oktaforai@atko.email`.

> "I'm signed in here as `oktaforai@atko.email` — that login happened against Okta, and Okta issued me an **ID Token**. You can see my identity up here on the right.
>
> I've flipped the target service toggle to **Jira** — so every request I make in this chat is going to flow through Okta, get exchanged for a Jira-scoped token, and hit the Atlassian API.
>
> The panel on the right is the star of this demo. Every token, every exchange, every consent step — you'll see it in real time."

*(Hover over: User Identity card, Jira toggle, right panel.)*

---

## 3 · First ask — triggering consent (1:00 – 2:15)

**Type in chat:**
> `Show me open issues assigned to me in Jira`

*(Hit enter. Let the agent think for a second.)*

> "Watch the right side. Two things are about to happen.
>
> First — the agent builds a **client assertion**: a short-lived JWT, signed with its own RSA private key. This is how the agent proves to Okta *I am who I say I am* — not a password, not a shared secret, a cryptographic identity.
>
> Second — the agent calls Okta's token endpoint with a **token-exchange grant**. It hands over my ID Token (so Okta knows *who* this is for) and the client assertion (so Okta knows *which agent* is asking), and it asks for a scoped Jira token."

**On screen:** Consent popup / interaction_required banner appears.

> "And here's the Brokered Consent moment. Because this is my first time letting the DevOps Agent touch Jira, Okta doesn't just hand out a token — it says `interaction_required`, and it sends me to Atlassian to grant consent.
>
> This is **the user being in the loop**. The agent cannot silently upgrade its own privileges. It needs *me* to say yes."

*(Click through consent. Approve the scopes.)*

---

## 4 · After consent — the scoped token (2:15 – 3:00)

**On screen:** Back in the app, the agent finishes and shows Jira issues.

> "Consent granted. Okta now mints a Jira-scoped access token and gives it to the agent — **just to the agent, just for this session, just for the scopes I approved**. And the agent uses that token to call the Atlassian API and pull back my issues.
>
> These are real issues in my Jira instance."

*(Point at returned issue list.)*

---

## 5 · The workflow walkthrough (3:00 – 5:00)

**Scroll right panel to the "Step-by-Step Workflow" card.**

> "Now let me show you the part the security and identity folks in the room are going to love. Every token in that exchange — we've decoded and laid out step by step."

**Click Step 1: "User authenticated to Okta for Chat Bot interface"**

> "Step one. I signed into Okta, Okta issued me an ID Token. Here it is — encoded on one tab, fully decoded on the other."

*(Click the `Decoded` pill.)*

> "You can see the header — RS256, the key ID. The payload — my subject, the audience, when it was issued, when it expires, my email, my name. This is the user identity, signed by Okta, that the agent is going to act on behalf of."

**Click Step 2: "AI Agent proves its identity to Okta"**

> "Step two. The agent's own credential — the client assertion JWT. Different key, different subject. The subject here is the *agent's* ID, not mine. This is what proves the agent is a legitimate registered client at Okta."

**Click Step 3: "Agent requests delegated access on user's behalf"**

> "Step three. The actual request to Okta's token endpoint. `grant_type = token-exchange`. `subject_token` is my ID token. `client_assertion` is the agent's JWT. `resource` tells Okta *which* downstream service we want — in this case, our Jira managed connection.
>
> This is RFC 8693 — OAuth 2.0 Token Exchange — doing exactly what it was designed for."

**Click Step 4: "User grants consent at Jira"**

> "Step four is the moment we just lived through — the Brokered Consent redirect. Okta returned `interaction_required`, I got bounced to Atlassian, I approved the scopes."

**Click Step 5: "Okta issues scoped access for Jira"**

> "Step five. Here's the Jira access token Okta minted. Look at the `scp` claim — **these are the exact scopes I consented to, and nothing more**. The agent cannot ask Jira for anything outside this list. If tomorrow we want to add write access, we go back through consent — the agent cannot silently escalate."

**Click Step 6: "AI Agent acts on user's behalf in Jira"**

> "Step six — the agent calls the Atlassian API with `Authorization: Bearer <that token>`. Atlassian sees a scoped, user-consented, auditable request — not a password, not a shared service account."

---

## 6 · Second ask — warm path (5:00 – 5:45)

**Type in chat:**
> `Comment on JIRA-123: "Thanks, will review by Friday."`

*(Send.)*

> "Second request — same session. Notice there's **no consent prompt this time**. Okta already has the consent on file, the agent already has a live token, so the comment goes straight through.
>
> That's the experience we want: friction the first time — a real human decision — and then a smooth, auditable, time-bound token after that. Just like OAuth for humans, but for agents."

*(Show the new comment on the Jira ticket in the second tab.)*

---

## 6.5 · The Okta side — proof, not just claims (5:00 – 6:15)

*(Optional but recommended. Cut this if you need to stay under 6 minutes — otherwise it's the segment that converts skeptics.)*

**Switch tab to the Okta admin console for the demo org.** Have these four views pre-loaded in separate browser tabs so you can jump fast:

1. **Applications → DevOps Agent (AI Agent / OAuth client)**
2. **Applications → Jira Managed Connection**
3. **Reports → System Log** (filtered to last 10 minutes, actor = `oktaforai@atko.email`)
4. **Directory → People → oktaforai@atko.email → Applications tab** (to show granted consent)

---

**View 1 — The AI Agent as a first-class identity**

*(Open the DevOps Agent app in Okta admin.)*

> "This is the DevOps Agent, registered in Okta as its own OAuth client. Look at the authentication method — **private key JWT**. No client secret. The agent has a published JWK, and Okta has the matching public key. That's the cryptographic identity we saw the agent prove in step two.
>
> And look at the grant types enabled — `token-exchange` is explicitly allowed. This agent is *authorized* to do delegated work. That's a deliberate admin decision, not something the agent can grant itself."

*(Point at: signing keys / JWKS URI, allowed grant types, client ID matching what appeared in the client assertion's `sub` claim.)*

---

**View 2 — The Managed Connection to Jira**

*(Open the Jira Managed Connection.)*

> "This is the bridge. Okta's Managed Connection to Atlassian. The **resource indicator** here — this exact URI — is what the agent put in the `resource` parameter of its token exchange. That's how Okta knows the agent is asking for Jira specifically, not GitHub, not Slack, not anything else.
>
> The scopes you see listed here are the **only** scopes the agent is ever allowed to ask for. Everything downstream is gated by this config — not by the agent's code."

*(Point at: resource indicator, allowed scopes, downstream app mapping.)*

---

**View 3 — System Log: the token exchange, live**

*(Open System Log, filter actor = `oktaforai@atko.email`, last 10 minutes.)*

> "Now the part auditors want. Every single thing that just happened in our demo is here. Let me walk the last few entries from bottom to top."

*(Scroll to the oldest relevant event and walk up.)*

> "Here — **`user.session.start`**. That's me signing in at the beginning.
>
> Here — **`app.oauth2.token.grant`** with grant type `token-exchange`. That's the agent's request to Okta's token endpoint. Notice the actor is the DevOps Agent, and the target user is `oktaforai@atko.email`. Okta knows exactly who acted on whose behalf.
>
> Here — **`user.consent.grant`**. That's the moment I clicked 'Allow' at Atlassian. This event is tied to my user, the agent client, and the Jira connection. **If the security team ever asks 'who authorized this agent to touch Jira?'** — the answer is right here, with a timestamp and an IP.
>
> And finally — **`app.oauth2.token.grant`** again, this time succeeding, issuing the scoped Jira access token."

*(Click into one event — ideally the consent grant — to show the full detail blade: actor, target, client, scopes, IP, user agent, transaction ID.)*

> "Every token I showed you in the right-hand panel has a matching record here. The agent can't issue itself a token without Okta logging it, and Okta can't issue a token without a consented user session backing it. **That's the audit story.**"

---

**View 4 — The user's perspective in Okta**

*(Directory → People → `oktaforai@atko.email` → Applications tab — or wherever your Okta tenant exposes user-granted consents.)*

> "And this is the view I, as the end user, would see. The DevOps Agent shows up in my app list with the consent I granted, when I granted it, and the scopes it's allowed. If I ever change my mind —"

*(Hover over the revoke / remove option — don't actually click it mid-demo unless you want to reset state.)*

> "— one click and the agent loses Jira access. The human is always in control."

---

*(Flip back to the DevOps Agent app tab for the closing.)*

---

## 7 · Closing (5:45 – 6:30)

> "So, recap. What you just watched:
>
> 1. An AI agent with its **own cryptographic identity** — no shared secrets.
> 2. **Delegated** access — the agent acts *on behalf of* a real user, not as itself.
> 3. **Brokered consent** — the user is explicitly in the loop the first time, and only the first time.
> 4. **Scoped tokens** — the agent can only do what the user said yes to.
> 5. **Full auditability** — every token, every exchange, visible, decodable, attributable.
>
> This is Okta Brokered Consent for AI agents. It's the pattern that lets you put agents into production without giving up the identity guarantees you already have for your humans.
>
> Thanks for watching — happy to dig into any step in detail."

*(Stop recording.)*

---

## Troubleshooting cheat-sheet (keep off-camera)

| Symptom | Fix |
|---|---|
| No consent prompt fires | Call `POST /api/revoke` or clear the user's Jira app consent in Okta admin |
| Agent returns demo-mode tokens | `OKTA_AI_AGENT_ID` / `OKTA_AI_AGENT_PRIVATE_KEY` / `OKTA_JIRA_RESOURCE_INDICATOR` not set |
| `interaction_required` but no URI | Check `dataHandle` is being returned; fallback URL is built in `okta_sts.py` |
| Decoded tab is empty | Token is opaque (not a JWT) — expected for some providers; switch to Encoded tab |
| Step cards don't update | Refresh — a stale session may be pinned to old `token_details` |

## Recording tips

- **Cursor highlight** on (macOS: use a tool like Cursor Pro / Mouseposé).
- **Mic check** before you start — the workflow walkthrough is the longest continuous talking stretch.
- **Don't over-narrate the JSON** — let viewers read. Point at *one* claim per token (e.g. `scp` in Step 5) and move on.
- If a step card fails to open on click, it means there's no data for it yet — keep talking, don't backtrack on camera.
