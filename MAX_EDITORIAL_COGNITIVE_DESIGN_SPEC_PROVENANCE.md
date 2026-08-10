# MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_PROVENANCE

Recovery record for the canonical V0.2 rev1 specification. Small provenance record only; not a design document.

| Field | Value |
|---|---|
| Canonical path | `C:\Users\gbx12\projects\max-editorial\MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT.md` |
| Version | V0.2 rev1 |
| Recovery case | **A** — genuine rev1 artifact found (in Reasonix agent workspace), copied to canonical path; content not rewritten |
| Source file(s) used | `C:\Users\gbx12\AppData\Roaming\reasonix\global-workspace\MAX_EDITORIAL_COGNITIVE_DESIGN_SPEC_DRAFT.md` (61,142 bytes, written 2026-08-10, same session that produced the rev1 changeset) |
| Reconstruction date | 2026-08-10 |
| SHA-256 of final canonical spec | `86D118F4B5190ECBCBB8C55F2B06FC9813CE33B151DDB0CBFE653700B40EAD2B` |
| Content reconstructed? | No — full rev1 changeset was present in the source file and verified against the A–J checklist before copy |
| Sections modified during recovery | (1) Top-of-file PROVENANCE HEADER block (required by recovery Step 4); (2) §7.5: numeric proxies (≤1 screen / 5 screens) explicitly annotated as EDITORIAL/TEST HEURISTICS — must not become renderer auto-reorder rules (recovery Step 2-H requirement); (3) §13.4: EVIDENCE layout wording aligned with claim_id referential integrity (displayed claim text comes from the claim_id relation, not copied text — Step 6 consistency fix matching approved patch A-9). No design content changed |
| Production code modified? | No. No renderer/parser/CSS/frontend code was touched |

## Verification performed before copy (checklist A–J)

- A. Governance split (§17-A EPISTEMIC SAFETY INVARIANTS + §17-B EDITORIAL CONSTRAINTS + §18 DEFAULTS): PASS; old flat 15-item invariant list absent
- B. METRIC two-axis model (ORIGIN × DISPLAY FUNCTION; INSPECTION_SPECIMEN eligibility; ambiguous defaults DOWN): PASS
- C. Heuristic enforcement contract (MUST NOT mutate AST / auto-select CSS / autofix / change exit status; explicit suppress/override path): PASS
- D. Five-question layering (MACHINE-CHECKABLE / EDITORIAL PROMPTS / REVIEWER QUESTION; reframed licensed-inference question): PASS
- E. VERIFIED substantiation (verified_by / verification_method / verification_scope / verification_date): PASS
- F. Self-test three states (DESIGN-COVERED / IMPLEMENTATION-UNVERIFIED / EMPIRICALLY-VALIDATED; Q10 inspect-vs-believe stays UNVERIFIED): PASS
- G. Referential integrity (Evidence.supports → claim_id; Counterpoint.challenges → claim_id; stale detection; laundering risk named): PASS
- H. Epistemic adjacency exists AND numeric proxies kept as heuristics (annotated during recovery): PASS
- I. Grammar comprehension testing (epistemic role identification accuracy) in P2: PASS
- J. Grammar identity vs salience intensity distinguished (§6.2): PASS

## Search scope (recovery Step 1)

Searched: `C:\Users\gbx12\projects\` (all subdirectories incl. max-editorial, C--Users-gbx12, snapshots, _specs, archives, worktrees), full recursive search under `C:\Users\gbx12` for the spec filename, and the Reasonix agent workspace. Result: the only copy of the rev1 spec was in the agent workspace; the max-editorial repo contained the Claude Code implementation contract but no spec. No other candidate copies existed.

## Notes

- The Claude Code file `MAX_EDITORIAL_V02_IMPLEMENTATION_CONTRACT.md` was NOT modified (recovery Step 7). It was written without access to the canonical rev1 and is to be reconciled by Claude Code separately.
- No empirical/behavioral validation is claimed anywhere in the canonical spec; the provenance header and this record state BEHAVIORALLY-UNVALIDATED.
