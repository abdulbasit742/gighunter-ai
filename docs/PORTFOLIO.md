# Portfolio-aware proposals

A proposal that says "I can do this" loses to one that says "I built exactly this before, here it is." GigHunter now does the second automatically.

## Setup
```bash
cp config/portfolio.example.json config/portfolio.json
```
Edit it with your real projects:
```json
{
  "samples": [
    {
      "title": "Project name",
      "tags": ["node.js", "saas", "stripe"],
      "summary": "One or two sentences on what you built and the outcome.",
      "url": "https://link-to-repo-or-demo"
    }
  ]
}
```

## How it works
When drafting a proposal, GigHunter scores every portfolio sample against the gig (tag + keyword overlap), picks the **1-2 most relevant**, and feeds them to the LLM as proof. The model weaves ONE in naturally, never as a dumped list, and never invents fake metrics.

The drafted proposal records which samples it cited (`citedSamples`), so you can see what proof it leaned on.

## Why it wins more
Concrete, relevant proof is the single biggest lever on proposal reply rates. This makes every draft specific to *your* track record without you copy-pasting links each time.
