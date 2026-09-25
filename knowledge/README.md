# Scratch Wiki Knowledge Base

This directory is the source-controlled knowledge layer for the agent.

The model is not expected to memorize the entire wiki.

Instead:

1. Scratch Wiki pages are synchronized from the MediaWiki API.
2. Pages are normalized into structured documents.
3. An index is generated from titles, headings, categories and page text.
4. Agent generation retrieves relevant pages before producing a Scratch plan.
5. The generated plan is validated independently.

## Scope

The synchronization target is the English Scratch Wiki main/article namespace.

The initial sync intentionally excludes:

- User pages
- User talk pages
- Talk pages
- Files
- Templates as primary documents
- Categories as primary documents
- Special pages

Those namespaces can be indexed later when they provide useful implementation knowledge.

## Source

https://en.scratch-wiki.info/

The repository stores source URLs and retrieval timestamps with each page.

Licensing and attribution should be preserved when synchronized content is redistributed. The exact license metadata exposed by the source should be checked during synchronization rather than hard-coded here.
