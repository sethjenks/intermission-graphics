# Implementation Worklog

This file records product decisions and the evidence behind them. Keep it short, factual, and current. Update it after schema, renderer, timeline, layer, export, performance, or acceptance decisions.

## Status

Mode: product

Isoline Ring is the first product on this generated Toolcraft app. One bare `npm run verify:delivery` is the initial functional proof. Measured performance is not authorized.

## Automatic Delivery Lifecycle

Keep this worklog human-shaped. For the first product delivery, record the request, decisions, state/output mapping, reference evidence, rejected alternatives, and known risks; one bare `npm run verify:delivery` derives complete contract proof, one build, full functional acceptance, and no measured performance. For later ordinary edits, record new intent and material decisions, the exact unit/component test, and acceptance IDs passed to `npm run test:feature`; selector expansion is automatic, while explicit `--all` records why the edit could not be bounded. Do not claim or run another aggregate functional delivery.

Classifier output establishes complaint authority only and never path localization. A localized performance complaint adds the domain authority below, then one bare `npm run verify:delivery` runs one targeted iteration. If localization remains unresolved regardless of classifier result, ask one user-facing question naming visible operations and offering targeted diagnosis or a complete review; record neither `performance-iteration` intent nor canonical path authority until the answer supplies exact localization evidence. Never ask the user to choose internal path IDs. A broad or honestly unlocalizable problem may present that single choice with a recommendation for complete review, but the user still chooses. A direct complete-review request needs no further clarification. The full audit remains separate and requires an explicit operator request or accepted offer before `npm run verify:perf` may run. Protected receipts own changed files, plans, checks, reports, measurements, and pass/fail evidence.

When `canvas.renderScale` is enabled, record the renderer decision to preserve selected backing quality and map it to functional `renderScaleCoverage` for interaction and steady state, plus playback when timeline is enabled. The worklog may name the protected `canvas-render-scale-backing` recipe, but it cannot claim its evidence or turn a quality failure into performance authority.

## Performance Iteration Entry Contract

For high-confidence ordinary work, record `Performance intent: ordinary-product-work`. For unresolved localization, whether classification returned high-confidence `performance-iteration` or `needs-agent-judgment`, record the unresolved visible operation but no `Performance intent: performance-iteration` field or `Performance paths` until the user's one clarification provides exact localization. For a localized performance complaint or post-clarification targeted choice, record exactly these domain fields in the latest iteration:

```md
- Performance intent: performance-iteration
- Performance request evidence: "<verbatim exact Request quote>"
- Performance paths: ["performance-path:%5B...%5D"]
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
```

The quoted evidence must be an exact nontrivial raw substring of `Request` with identical whitespace and Unicode code units. `Performance paths` must be a non-empty unique JSON array of canonical path IDs. Do not record command arguments, changed-file inventory, executed checks, reports, or measurements; the protected planner and receipt own that machine evidence. Each localized complaint or post-clarification targeted choice authorizes one bounded iteration; after it passes, return the app and wait for user evaluation. Classifier output or complaint evidence alone never supplies path localization or authorizes full certification. The separate operator command is permitted only after the user explicitly requests a complete audit or explicitly accepts the agent's offer; the user does not need to name the command.

## Decisions

### Renderer

- Decision: Draw the topographic torus as Canvas 2D hairline strokes from a blended pair of closed paths.
- Reason: The reference is line art, not a shader blob, and preview plus image/video export need one live stroke pass.
- Evidence: `src/app/isoline/draw.ts`, `src/app/isoline/geometry.ts`, `src/app/isoline/isoline-canvas.tsx`, and `rendererPipelineRegistration`.

### View Interaction

- Decision: Use non-spatial view interaction.
- Reason: The product is a flat isoline drawing with no three-dimensional scene or model.
- Evidence: `appProductReadiness.viewInteraction.mode` is `non-spatial`.

### Interaction Ownership

- Decision: Keep ephemeral pointer press on the product canvas and keep authored values on panel controls.
- Reason: Dragging the ring is a local topographic offset that eases back and never writes a durable control target.
- Evidence: `appProductReadiness.interactionOwnership` is empty; `IsolineCanvas` owns pointer press locally.

### Timeline

- Decision: Enable Toolcraft playback timeline with a 12-second product-derived loop.
- Reason: Orbit and breathe must loop on one shared transport, with play/pause on the top timeline rather than the panel.
- Evidence: `appSchema.panels.timeline.mode` is `playback` and `appTransferMode.animationIntent.loopDuration.seconds` is 12.

### Layers

- Decision: Do not enable layers.
- Reason: The generator edits one isoline composition, not stacked entities.
- Evidence: `appSchema.panels.layers` is omitted.

### Controls

- Decision: Group controls by look, seed, ring, motion, tempo, ink, type, show, style, and export settings, and author the Background pair for runtime Setup relocation.
- Reason: Each visible control maps to one isoline or delivery outcome, and Setup must own Background plus Infinity.
- Evidence: `src/app/isoline/schema-controls.ts` and `appControlSectionInventory`.

### Export

- Decision: Export PNG and video through the Toolcraft artifact pipeline, with SVG not requested.
- Reason: The user asked for a square still of at least 2000px and a looping video of the idle motion.
- Evidence: `isolineExportRenderer`, sticky `actions.output`, and `appProductReadiness.exportIntent`.

### Performance

- Decision: Register a Canvas 2D pipeline whose workload dimension is line count, and keep first delivery functional only.
- Reason: Line count scales stroked paths on every live slider and timeline frame; measurement stays unauthorized until a later localized request.
- Evidence: `src/app/app-performance.ts`, `src/app/isoline/pipeline.ts`, and `Performance intent: ordinary-product-work`.

## Decision Trail

### Delivery 1 - Isoline ring generator

- Request: Build a procedural isoline ring generator that matches the attached still as the default look, then adds motion, panel controls, presets, seed, and PNG plus looping video export.
- Task type: Schema, renderer, timeline, export, acceptance, and performance contract for first product delivery.
- User-visible result: A hollow topographic torus of cobalt hairlines on a cream field, with editable captions, live sliders, pointer press, orbit and breathe on the Toolcraft timeline, and square PNG plus video export.
- Source/reference checked: User prompt and the attached album-cover still `illustration-1.jpg`.
- Reference inputs: None. The still is a visual default, not a registered motion-reference study.
- Docs/contracts read: workflow.md, assembly-workflow.md, runtime-boundary.md, control-selection.md, layout.md, performance.md, timeline-animation.md, setup-export.md, acceptance-testing.md, and renderer-technique.md.
- Contract rules applied: runtime-shell-required, controls-product-coverage, output-export-required, acceptance-product-observable, performance-coverage-levels, and workflow-required.
- View interaction intent: non-spatial; the product has no visible three-dimensional scene or model.
- Interaction ownership: Panel controls own authored isoline values. The product canvas owns ephemeral press. The timeline owns play, pause, scrub, and duration.
- Decision: Blend inner and outer closed paths with a few angular harmonics, stroke them as Canvas 2D isolines, drive orbit and breathe from timeline progress, and export through the runtime artifact renderer without painting background in export frames.
- Alternatives rejected: SVG live patching at 120 isolines, a WebGL shader blob, play/pause in the panel, layers, and SVG export.
- State/output mapping: Schema values feed `readIsolineSceneValues`; geometry builds closed paths; preview and export stroke the same scene; `sceneBoundsProvider` publishes one stable 1400 by 1800 envelope for Infinity crop.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` derived the first product delivery receipt.
- Risks: Hairline strokes can alias if backing pixels fall below the selected render scale; 120-line live rebuilds remain a later measurement concern.

## Evidence

- Source reviewed: user prompt, attached still, `src/app/app-schema.ts`, `src/app/isoline/*`, and Toolcraft acceptance/performance contracts.
- Contract applied: first product delivery uses one bare `npm run verify:delivery` for functional proof and does not run measured performance.

## Verification

Protected receipts own changed files, the derived plan, commands, selectors, reports, measurements, and pass/fail evidence. Decision Trail iterations record only one bare `npm run verify:delivery` narrative.

## Risks

- Risk: Hairline isolines can disappear in coarse export probes unless tests raise stroke weight first.
- Risk: Line-count workload is declared but unmeasured until an authorized performance iteration.
