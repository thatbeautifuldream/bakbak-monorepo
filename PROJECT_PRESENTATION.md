# Bakbak

## Project description

Bakbak is a browser extension that lets people talk to any webpage. Instead of leaving a page to search for help or explain what they are reading, users can ask questions out loud and get answers based on the page already open in front of them.

## Key features

- Speak naturally to ask for explanations, summaries, or specific details from the current webpage.
- Uses the page's content, headings, links, metadata, selected text, and accessible controls to understand context.
- Returns spoken answers in real time and shows the latest response in the extension.
- Lets users scroll, open links, go back, click safe controls, and fill text fields through voice.
- Does not submit forms by voice.
- Microphone access begins only when the user selects **Start talking** and can be stopped at any time.
- Uses the existing signed-in web-app session, so the extension does not require a separate login.

## Links and demo

| Item | Details |
| --- | --- |
| GitHub repository | [github.com/thatbeautifuldream/bakbak-monorepo](https://github.com/thatbeautifuldream/bakbak-monorepo) |
| Live deployment | https://bakbak.milind.fyi/ |
| Demo video (max. 3 minutes) | https://www.youtube.com/watch?v=8B5bvayecUE  |
| Project presentation (PPT/PDF) | https://docs.google.com/presentation/d/17kgML2jneAO4WNiy7rYoZtj7M64NwryWkKyrr4y_oNM/edit?usp=sharing |

---

## Presentation outline

### 1. The problem

Reading online can break a person's flow. Finding a quick explanation, checking a detail, or understanding a difficult paragraph often means switching tabs, searching, and then trying to return to the original thought.

### 2. The idea

Bakbak keeps help on the page. It gives users a small voice companion they can open whenever a webpage makes them pause.

### 3. How it works

1. The user opens Bakbak on a webpage and starts a conversation.
2. Bakbak securely receives useful context from the current page.
3. The user asks a question by voice.
4. Bakbak responds in voice and can help with simple browser actions when needed.

### 4. What makes it useful

- No need to copy and paste page content into another tool.
- The conversation starts with the page context already available.
- Voice makes it easy to ask a quick question without interrupting reading.
- It can make content more accessible across India: for example, a Tamil speaker can listen to and understand Gujarati news without knowing Gujarati.
- Users stay in control of when the microphone is active and what actions are taken.

### 5. Tech overview

- Browser extension: WXT and React
- Web application: Next.js
- Backend: Express and PostgreSQL
- Authentication: Better Auth
- Voice agent: Sarvam Conversational AI

### 6. Demo flow

1. Open a long article or documentation page.
2. Start Bakbak from the extension.
3. Ask for a summary or an explanation of a selected section.
4. Ask Bakbak to find a detail or scroll to continue reading.
5. Stop the conversation.

### 7. Closing

Bakbak makes the web easier to talk through: less searching, fewer tab switches, and more time spent understanding what is already in front of you.

