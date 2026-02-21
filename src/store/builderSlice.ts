import type { HoleTemplate, Segment, SegmentSpecId } from "../types/template";
import { computeChainPositions } from "../utils/chainCompute";

// Type for the builder state portion
export type BuilderState = {
	holeTemplates: Record<string, HoleTemplate>;
	builderDraft: HoleTemplate | null;
	builderMode: boolean;
	editingTemplateId: string | null;
	builderUndoStack: HoleTemplate[];
	builderRedoStack: HoleTemplate[];
};

export type BuilderActions = {
	enterBuilder: (templateId?: string) => void;
	exitBuilder: () => void;
	saveTemplate: () => void;
	deleteTemplate: (id: string) => void;
	duplicateTemplate: (id: string) => void;
	appendSegment: (specId: SegmentSpecId) => void;
	removeLastSegment: () => void;
	replaceSegment: (segmentId: string, newSpecId: SegmentSpecId) => void;
	setDraftName: (name: string) => void;
	setDraftPar: (par: number) => void;
	setDraftFeltWidth: (feltWidth: number) => void;
	setDraftColor: (color: string) => void;
	builderUndo: () => void;
	builderRedo: () => void;
};

/** Deep-clone a template via JSON round-trip. */
function cloneTemplate(t: HoleTemplate): HoleTemplate {
	return JSON.parse(JSON.stringify(t)) as HoleTemplate;
}

/** Update entry/exit connection links after chain recompute. */
function updateConnections(segments: Segment[]): void {
	for (let i = 0; i < segments.length; i++) {
		segments[i].connections.entry.segmentId = i > 0 ? segments[i - 1].id : null;
		segments[i].connections.exit.segmentId =
			i < segments.length - 1 ? segments[i + 1].id : null;
	}
}

export const BUILDER_INITIAL_STATE: BuilderState = {
	holeTemplates: {},
	builderDraft: null,
	builderMode: false,
	editingTemplateId: null,
	builderUndoStack: [],
	builderRedoStack: [],
};

// The set/get types are intentionally broad here because the builder slice is
// merged into the main store which has many unrelated fields. Using `any` is
// justified — this is a slice factory receiving store internals.
// biome-ignore lint/suspicious/noExplicitAny: slice factory receives store internals
type SetFn = (fn: (state: any) => Partial<any>) => void;
// biome-ignore lint/suspicious/noExplicitAny: slice factory receives store internals
type GetFn = () => any;

/** Create builder actions to be merged into the main store. */
export function createBuilderActions(set: SetFn, get: GetFn): BuilderActions {
	return {
		enterBuilder: (templateId?: string) => {
			const state = get() as BuilderState;
			let draft: HoleTemplate;
			let editingId: string | null = null;

			if (templateId && state.holeTemplates[templateId]) {
				draft = cloneTemplate(state.holeTemplates[templateId]);
				editingId = templateId;
			} else {
				draft = {
					id: crypto.randomUUID(),
					version: 1,
					name: "New Hole",
					feltWidth: 0.6,
					segments: [],
					obstacles: [],
					defaultPar: 3,
					color: "#4ade80",
					createdAt: new Date().toISOString(),
				};
			}

			set(() => ({
				builderMode: true,
				builderDraft: draft,
				editingTemplateId: editingId,
				builderUndoStack: [],
				builderRedoStack: [],
			}));
		},

		exitBuilder: () => {
			set(() => ({
				builderMode: false,
				builderDraft: null,
				editingTemplateId: null,
				builderUndoStack: [],
				builderRedoStack: [],
			}));
		},

		saveTemplate: () => {
			const state = get() as BuilderState & { exitBuilder: () => void };
			const { builderDraft, editingTemplateId } = state;

			if (!builderDraft || builderDraft.segments.length < 2) {
				return;
			}

			if (editingTemplateId) {
				set((s) => ({
					holeTemplates: {
						...s.holeTemplates,
						[editingTemplateId]: cloneTemplate(builderDraft),
					},
				}));
			} else {
				set((s) => ({
					holeTemplates: {
						...s.holeTemplates,
						[builderDraft.id]: cloneTemplate(builderDraft),
					},
				}));
			}

			state.exitBuilder();
		},

		deleteTemplate: (id: string) => {
			set((s) => {
				const { [id]: _, ...remainingTemplates } = s.holeTemplates as Record<
					string,
					HoleTemplate
				>;

				// Remove placed holes referencing this templateId
				const newHoles: Record<string, unknown> = {};
				const newHoleOrder: string[] = [];
				for (const hid of s.holeOrder as string[]) {
					const hole = (s.holes as Record<string, { templateId?: string }>)[
						hid
					];
					if (hole && hole.templateId === id) {
						// skip — delete it
					} else {
						newHoles[hid] = hole;
						newHoleOrder.push(hid);
					}
				}

				return {
					holeTemplates: remainingTemplates,
					holes: newHoles,
					holeOrder: newHoleOrder,
				};
			});
		},

		duplicateTemplate: (id: string) => {
			const state = get() as BuilderState;
			const original = state.holeTemplates[id];
			if (!original) return;

			const copy = cloneTemplate(original);
			copy.id = crypto.randomUUID();
			copy.name = `${original.name} (Copy)`;
			copy.createdAt = new Date().toISOString();

			set((s) => ({
				holeTemplates: {
					...s.holeTemplates,
					[copy.id]: copy,
				},
			}));
		},

		appendSegment: (specId: SegmentSpecId) => {
			const state = get() as BuilderState;
			if (!state.builderDraft) return;

			// Push undo snapshot
			const snapshot = cloneTemplate(state.builderDraft);

			const newSegment: Segment = {
				id: crypto.randomUUID(),
				specId,
				position: { x: 0, z: 0 },
				rotation: 0,
				connections: {
					entry: { segmentId: null },
					exit: { segmentId: null },
				},
			};

			const updatedSegments = [...state.builderDraft.segments, newSegment];
			const recomputed = computeChainPositions(updatedSegments);
			updateConnections(recomputed);

			set((s) => ({
				builderDraft: { ...s.builderDraft, segments: recomputed },
				builderUndoStack: [...s.builderUndoStack, snapshot],
				builderRedoStack: [],
			}));
		},

		removeLastSegment: () => {
			const state = get() as BuilderState;
			if (!state.builderDraft || state.builderDraft.segments.length === 0) {
				return;
			}

			const snapshot = cloneTemplate(state.builderDraft);
			const updatedSegments = state.builderDraft.segments.slice(0, -1);
			const recomputed = computeChainPositions(updatedSegments);
			updateConnections(recomputed);

			set((s) => ({
				builderDraft: { ...s.builderDraft, segments: recomputed },
				builderUndoStack: [...s.builderUndoStack, snapshot],
				builderRedoStack: [],
			}));
		},

		replaceSegment: (segmentId: string, newSpecId: SegmentSpecId) => {
			const state = get() as BuilderState;
			if (!state.builderDraft) return;

			const snapshot = cloneTemplate(state.builderDraft);
			const updatedSegments = state.builderDraft.segments.map((seg) =>
				seg.id === segmentId ? { ...seg, specId: newSpecId } : seg,
			);
			const recomputed = computeChainPositions(updatedSegments);
			updateConnections(recomputed);

			set((s) => ({
				builderDraft: { ...s.builderDraft, segments: recomputed },
				builderUndoStack: [...s.builderUndoStack, snapshot],
				builderRedoStack: [],
			}));
		},

		setDraftName: (name: string) => {
			set((s) => {
				if (!s.builderDraft) return s;
				return { builderDraft: { ...s.builderDraft, name } };
			});
		},

		setDraftPar: (par: number) => {
			const state = get() as BuilderState;
			if (!state.builderDraft) return;

			const snapshot = cloneTemplate(state.builderDraft);
			set((s) => ({
				builderDraft: { ...s.builderDraft, defaultPar: par },
				builderUndoStack: [...s.builderUndoStack, snapshot],
				builderRedoStack: [],
			}));
		},

		setDraftFeltWidth: (feltWidth: number) => {
			const state = get() as BuilderState;
			if (!state.builderDraft) return;

			const snapshot = cloneTemplate(state.builderDraft);
			set((s) => ({
				builderDraft: { ...s.builderDraft, feltWidth },
				builderUndoStack: [...s.builderUndoStack, snapshot],
				builderRedoStack: [],
			}));
		},

		setDraftColor: (color: string) => {
			const state = get() as BuilderState;
			if (!state.builderDraft) return;

			const snapshot = cloneTemplate(state.builderDraft);
			set((s) => ({
				builderDraft: { ...s.builderDraft, color },
				builderUndoStack: [...s.builderUndoStack, snapshot],
				builderRedoStack: [],
			}));
		},

		builderUndo: () => {
			const state = get() as BuilderState;
			const { builderUndoStack, builderDraft } = state;
			if (builderUndoStack.length === 0 || !builderDraft) return;

			const prev = builderUndoStack[builderUndoStack.length - 1];
			const newUndoStack = builderUndoStack.slice(0, -1);

			set((s) => ({
				builderDraft: cloneTemplate(prev),
				builderUndoStack: newUndoStack,
				builderRedoStack: [...s.builderRedoStack, cloneTemplate(builderDraft)],
			}));
		},

		builderRedo: () => {
			const state = get() as BuilderState;
			const { builderRedoStack, builderDraft } = state;
			if (builderRedoStack.length === 0 || !builderDraft) return;

			const next = builderRedoStack[builderRedoStack.length - 1];
			const newRedoStack = builderRedoStack.slice(0, -1);

			set((s) => ({
				builderDraft: cloneTemplate(next),
				builderRedoStack: newRedoStack,
				builderUndoStack: [...s.builderUndoStack, cloneTemplate(builderDraft)],
			}));
		},
	};
}
