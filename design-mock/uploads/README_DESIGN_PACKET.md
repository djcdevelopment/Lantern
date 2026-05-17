# Campfire / GAD Design Packet v2

This packet updates the previous design brief after implementation reality clarified the platform boundaries.

## Important Direction Change

The existing GOATs After Dark website ("Hearth") already exists and should NOT be redesigned from scratch.

The existing builds already solved:
- parsing
- replay rendering
- movement smoothing / lerping
- encounter playback
- local LLM integration
- replay visualization

The next design effort should focus on:

# The GAD App / Workbench

A player-first local raid review and exploration experience.

The new design work should:
- preserve the existing advanced RaidUI/replay surface,
- preserve the existing Hearth chronicle website,
- and redesign the app shell and experience around player-centric workflows.

The core shift is:

FROM:
team-centric replay UI as the first experience

TO:
player-centric exploration and reflection first,
with advanced replay views available when needed.

---

Recommended reading order:

1. 01_PRODUCT_BOUNDARIES.md
2. 02_GAD_APP_WORKBENCH_SPEC.md
3. 03_EXISTING_SYSTEMS_TO_PRESERVE.md
4. 04_PLAYER_FIRST_UX_MODEL.md
5. 05_COMPONENT_AND_FLOW_INVENTORY.md
6. 06_SAMPLE_DATA_FOR_PROTOTYPE.md
7. 07_DESIGN_AGENT_PROMPT.md
