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

- Decision: Render the line field with an owned, framework-free WebGL2 engine shared by Toolcraft and the standalone player.
- Reason: Thick spatial strips, gradient projection, transform-feedback particles, and deterministic interaction need one GPU implementation that also runs in iOS 18 WKWebView.
- Evidence: `src/app/isoline/webgl/*`, `src/player/isoline-player.ts`, and `rendererPipelineRegistration`.

### View Interaction

- Decision: Use orbit view interaction on `view.orbit`.
- Reason: The object remains graphically flat but its form and camera exist in XYZ space.
- Evidence: `appProductReadiness.viewInteraction`, schema `orientationGizmo`, and shared renderer pose.

### Interaction Ownership

- Decision: Canvas owns hit-tested Strum and Orbit; the panel owns exact authored physics and form values.
- Reason: A press on the ring strums; a press on empty canvas orbits. The user no longer wants a mode toggle.
- Evidence: `appProductReadiness.interactionOwnership`, `isolinePointerHitsObject`, and `IsolineCanvas`.

### Timeline

- Decision: Do not enable the Toolcraft timeline. Flow and breathe run on a continuous engine clock.
- Reason: The user no longer wants a start/end loop. Video export is gone, so there is no play, pause, scrub, or duration transport to own.
- Evidence: `appSchema.panels.timeline` is omitted and `appTransferMode.animationIntent.mode` is `autonomous`.

### Layers

- Decision: Do not enable layers.
- Reason: The generator edits one isoline composition, not stacked entities.
- Evidence: `appSchema.panels.layers` is omitted.

### Controls

- Decision: Group controls by look, variation, ring, space, line, width profile, physics, motion, tempo, and gradient ink. Runtime Setup keeps Export/Import, Include, Infinity, the Solid color, and Resolution. Leftover Background is the Type fill builder.
- Reason: The controls map to spatial form, line construction, physical response, and authored motion without text or artifact-export UI.
- Evidence: `src/app/isoline/schema-controls.ts` and `appControlSectionInventory`.

### Export

- Decision: Remove PNG, video, and SVG artifact export; keep runtime-owned Export Settings as the portable design.
- Reason: The accepted pivot delivers an interactive web/iOS player rather than rendered media artifacts.
- Evidence: `appProductReadiness.exportIntent`, runtime-owned settings app ID `intermission-graphics`, player protocol version 1, and the absence of product export actions/renderers.

### Performance

- Decision: Register GPU parameter-grid, particle-state, fixed-step physics, and line/particle render passes with line-count and particle-count workload dimensions.
- Reason: Line strips scale with line count and particle simulation scales with particle count; retained WebGL resources are owned and disposed by one engine per host.
- Evidence: `src/app/app-performance.ts`, `src/app/isoline/pipeline.ts`, and `Performance intent: ordinary-product-work`.

## Decision Trail

### Delivery 7 - One background fill builder

- Request: Consolidate Infinity/Setup background color with the leftover gradient/image Background section into one builder that owns the whole field fill.
- Task type: Schema, renderer, Infinity backdrop, and acceptance change.
- User-visible result: Export/Import and Resolution stay in Setup. Type chooses Solid, Gradient, or Image. Solid uses the required Setup color. Gradient and Image replace the leftover unlabeled gradient/image stack. Infinity uses the same fill.
- Decision: Keep the required Include + color pair in the authored Background section so runtime Setup still owns export/import, Include, Infinity, and Background color. Leftover Background is the Type builder plus Gradient or Image extras. The WebGL field and `infiniteCanvasContent` both honor Type.
- Alternatives rejected: Moving Export/Import out of Setup, a second `appearance.background` color under Type (Setup still shows its extracted picker), and drawing Infinity with the Setup color only.
- State/output mapping: `appearance.backgroundFill` selects the fill path. Solid clears to `appearance.background`. Gradient draws `appearance.backgroundGradient`. Image samples `appearance.backgroundImage` and ignores leftover color/gradient.
- Performance intent: ordinary-product-work
- Verification: Focused isoline unit tests plus browser proofs for Type, gradient parts, and image lifecycle. Do not run another aggregate functional delivery.

### Delivery 6 - Background gradient and image

- Request: Give the background the same gradient controls as Ink, and allow uploading an image for the background.
- Task type: Schema, renderer, media, and acceptance change.
- User-visible result: Background keeps Include and color in Setup, adds Ink-matching gradient controls, and accepts one cover image with rotate and flip.
- Decision: Use the built-in `gradient` control for the field fill and a single `fileDrop` image for optional cover/crop. Setup color still drives unedited cream stops so the existing color control keeps working.
- Alternatives rejected: Replacing the required Setup color control, canvas upload chrome, and drawing the image with the default media layer (the WebGL canvas already owns the field).
- State/output mapping: `appearance.backgroundGradient` fills a screen-space quad; `appearance.backgroundImage` media is sampled as cover with `mediaAssets[].transform`.
- Performance intent: ordinary-product-work
- Verification: Focused isoline unit tests plus browser proofs for gradient parts and image lifecycle. Do not run another aggregate functional delivery.

### Delivery 5 - Strum under the pointer

- Request: The visible disturbance should start where the pointer presses the object, and a drag should keep strumming under the cursor.
- Task type: Pointer-to-surface mapping and local wave shape.
- User-visible result: A press on the ring raises the field at that contact. Dragging across the object leaves the wave under the pointer instead of offset elsewhere.
- Decision: Inverse-project the pointer onto the rest surface with the same view-projection the engine renders, then peak the wave at that planar contact instead of a sine that is zero at the click.
- Alternatives rejected: Mapping canvas NDC times 0.8 into object space, and treating a left/right screenshot split as proof of placement.
- State/output mapping: `pickStrumFromPointer` writes impulse `x,y` in unbent planar space; the line shader compares the same planar coordinates.
- Performance intent: ordinary-product-work
- Verification: Focused `strum-map` unit tests. Do not run another aggregate functional delivery.
- Risks: A heavily waved surface can sit slightly off the rest-pose pick until the next press.

### Delivery 4 - Hit-tested strum and orbit

- Request: Strum only when touching the object itself; a click-and-drag outside the shape should orbit.
- Task type: Schema and canvas interaction change with matching player hit testing.
- User-visible result: Pressing the ring strums it. Pressing empty canvas and dragging orbits the view. The Strum/Orbit tool toggle is gone.
- Source/reference checked: Current Isoline pointer routing, Toolcraft model-orbit interaction, and the user request in this conversation.
- Reference inputs: None.
- Docs/contracts read: `core/control-selection.md` and interaction-surface-ownership rules.
- Contract rules applied: interaction-surface-ownership and canvas-no-app-ui.
- View interaction intent: Orbit; `view.orbit` remains shared by the gizmo, empty-canvas drag, keyboard arrows, renderer pose, history, and settings.
- Interaction ownership: Canvas owns on-object strum and off-object orbit. The panel owns physics and form values only.
- Decision: Route the primary pointer by a shared object hit test and remove `interaction.canvasTool`.
- Alternatives rejected: Keeping a Strum/Orbit toggle, strumming anywhere on the canvas, and treating empty-canvas drags as viewport pan.
- State/output mapping: `isolinePointerHitsObject` decides the gesture; strum writes ephemeral impulses; orbit writes `view.orbit`.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The current hit test is a centered radial band, so a heavily pitched ring can disagree slightly with the visual silhouette.

### Delivery 3 - Continuous autonomous motion

- Request: Remove the start and end of the 12-second loop so the field just keeps moving continuously.
- Task type: Schema, renderer, acceptance, and player motion-clock change with no video export.
- User-visible result: Flow and breathe travel without restarting, the top timeline is gone, and Speed still sets how quickly that continuous motion moves.
- Source/reference checked: Current Isoline WebGL2 engine, Toolcraft animation-intent contract, and the user request in this conversation.
- Reference inputs: None.
- Docs/contracts read: `core/timeline-animation.md`, `decision-contract.md`, and `component-contracts.runtime.ts` autonomous-animation rules.
- Contract rules applied: timeline-mode-choice, animation-intent autonomous coverage, and no video-export timeline requirement.
- View interaction intent: Orbit; `view.orbit` is unchanged.
- Interaction ownership: Canvas still owns Strum and Orbit; the panel still owns Flow, Breathe, and Speed. No surface owns play, pause, scrub, or duration.
- Decision: Classify the product as autonomous decorative motion, drop `panels.timeline`, and advance flow/breathe from unbounded engine time instead of a wrapping 12-second progress.
- Alternatives rejected: Keeping a looping Toolcraft playback transport, adding a Continuous switch that turns looping back on, and wrapping shared 0-1 progress which jumped whenever Speed was not an integer.
- State/output mapping: Engine-owned elapsed seconds map through `uProgress` as cycles of the 12-second tempo period; each periodic function wraps on its own phase so motion never restarts as a loop.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Long-running float phase precision remains acceptable because each shader effect wraps with `fract`.

### Delivery 2 - Interactive WebGL2 player pivot

- Request: Replace the flat Canvas 2D generator with an interactive shader-like spatial object that can be strummed, shaped in XYZ, styled as solid/dashed/particle lines with gradients and variable width, and consumed on both the web and iOS.
- Task type: Later Tier 3 renderer/canvas/runtime feature with schema, timeline, interaction, settings-transfer, web-player, and iOS-harness changes.
- User-visible result: One owned WebGL2 renderer powers Toolcraft preview and a framework-free web/iOS player; text plus PNG/video export are removed, line motion flows without rotating the object, and Strum/Orbit modes have explicit gesture ownership.
- Source/reference checked: Current Isoline Ring implementation, accepted shader-pivot plan, user decisions in this conversation, and the generated Toolcraft contracts.
- Reference inputs: None. The existing still remains historical context and no new motion reference was supplied.
- Docs/contracts read: `AGENTS.md`, `workflow.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/performance.md`, `core/timeline-animation.md`, `core/setup-export.md`, `core/media-upload.md`, `decision-contract.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, and `performance.md`.
- Contract rules applied: runtime-shell-required, canvas-no-app-ui, interaction-surface-ownership, output-export-required, controls-section-inventory-required, renderer-technique-inventory, renderer-view-interaction, timeline-enabled-behavior, performance-coverage-levels, persistence-policy-explicit, and workflow-required.
- View interaction intent: Orbit; `view.orbit` is shared by the orientation gizmo, direct Orbit-tool drag, renderer camera pose, history, reset, persistence, and settings transfer.
- Interaction ownership: Canvas Strum mode owns ephemeral impulses; Canvas Orbit mode owns direct view rotation; the panel owns the Strum/Orbit mode and exact form, line, particle, and physics properties.
- Decision: Use a framework-free WebGL2 engine with retained programs/buffers, host-owned scheduling, fixed-step physics, and one settings adapter shared by Toolcraft, plain web embeds, and WKWebView.
- Alternatives rejected: Shaders.com production runtime, WebGPU-only output, Metal-native fork, duplicate web/iOS renderers, raw GLSL-only export, and product image/video export.
- State/output mapping: Toolcraft schema values map through `readIsolineSceneValues` into engine config; timeline progress drives authored flow/breathe; local impulses drive fixed-step physics; Export Settings JSON is the portable design; each host owns one engine/context/scheduler.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: WebGL2 context recovery, particle limits on older iOS GPUs, touch ownership versus canvas pan, cross-GPU pixel variance, and lack of physical-device automation in this repository.

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
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Hairline strokes can alias if backing pixels fall below the selected render scale; 120-line live rebuilds remain a later measurement concern.

## Evidence

- Source reviewed: user prompt, attached still, `src/app/app-schema.ts`, `src/app/isoline/*`, and Toolcraft acceptance/performance contracts.
- Contract applied: first product delivery uses one bare `npm run verify:delivery` for functional proof and does not run measured performance.

## Verification

Protected receipts own changed files, the derived plan, commands, selectors, reports, measurements, and pass/fail evidence. Decision Trail iterations record only one bare `npm run verify:delivery` narrative.

## Risks

- Risk: Hairline isolines can disappear in coarse export probes unless tests raise stroke weight first.
- Risk: Line-count workload is declared but unmeasured until an authorized performance iteration.
