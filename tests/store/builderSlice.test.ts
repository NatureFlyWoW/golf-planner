import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../../src/store/store";
import type { HoleTemplate } from "../../src/types/template";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTemplate(overrides?: Partial<HoleTemplate>): HoleTemplate {
	return {
		id: "tpl-1",
		version: 1,
		name: "Test Hole",
		feltWidth: 0.6,
		segments: [],
		obstacles: [],
		defaultPar: 3,
		color: "#4ade80",
		createdAt: "2026-01-01T00:00:00.000Z",
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
	useStore.setState({
		holes: {},
		holeOrder: [],
		holeTemplates: {},
		builderDraft: null,
		builderMode: false,
		editingTemplateId: null,
		builderUndoStack: [],
		builderRedoStack: [],
	});
});

// ---------------------------------------------------------------------------
// enterBuilder
// ---------------------------------------------------------------------------

describe("enterBuilder", () => {
	it("creates empty draft with correct defaults when called without templateId", () => {
		useStore.getState().enterBuilder();
		const { builderDraft } = useStore.getState();
		expect(builderDraft).not.toBeNull();
		expect(builderDraft?.name).toBe("New Hole");
		expect(builderDraft?.feltWidth).toBe(0.6);
		expect(builderDraft?.defaultPar).toBe(3);
		expect(builderDraft?.segments).toEqual([]);
		expect(builderDraft?.obstacles).toEqual([]);
		expect(builderDraft?.color).toBe("#4ade80");
		expect(builderDraft?.version).toBe(1);
	});

	it("sets builderMode to true", () => {
		useStore.getState().enterBuilder();
		expect(useStore.getState().builderMode).toBe(true);
	});

	it("clears undo and redo stacks on enter", () => {
		// Pre-populate stacks
		useStore.setState({
			builderUndoStack: [makeTemplate()],
			builderRedoStack: [makeTemplate()],
		});
		useStore.getState().enterBuilder();
		expect(useStore.getState().builderUndoStack).toEqual([]);
		expect(useStore.getState().builderRedoStack).toEqual([]);
	});

	it("loads and deep-clones existing template when templateId provided", () => {
		const original = makeTemplate({
			id: "tpl-abc",
			name: "My Template",
			feltWidth: 0.9,
			defaultPar: 4,
		});
		useStore.setState({ holeTemplates: { "tpl-abc": original } });
		useStore.getState().enterBuilder("tpl-abc");

		const { builderDraft, editingTemplateId } = useStore.getState();
		expect(builderDraft).not.toBeNull();
		expect(builderDraft?.id).toBe("tpl-abc");
		expect(builderDraft?.name).toBe("My Template");
		expect(builderDraft?.feltWidth).toBe(0.9);
		expect(editingTemplateId).toBe("tpl-abc");

		// Verify it is a deep clone — modifying draft should not affect original
		useStore.getState().setDraftName("Modified");
		expect(useStore.getState().holeTemplates["tpl-abc"].name).toBe(
			"My Template",
		);
	});

	it("creates new draft when templateId does not exist", () => {
		useStore.getState().enterBuilder("nonexistent-id");
		const { builderDraft, editingTemplateId } = useStore.getState();
		expect(builderDraft?.name).toBe("New Hole");
		expect(editingTemplateId).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// exitBuilder
// ---------------------------------------------------------------------------

describe("exitBuilder", () => {
	it("clears all builder state", () => {
		useStore.getState().enterBuilder();
		useStore.getState().exitBuilder();

		const s = useStore.getState();
		expect(s.builderMode).toBe(false);
		expect(s.builderDraft).toBeNull();
		expect(s.editingTemplateId).toBeNull();
		expect(s.builderUndoStack).toEqual([]);
		expect(s.builderRedoStack).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// appendSegment
// ---------------------------------------------------------------------------

describe("appendSegment", () => {
	it("adds a segment to the draft", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		const { builderDraft } = useStore.getState();
		expect(builderDraft?.segments).toHaveLength(1);
		expect(builderDraft?.segments[0].specId).toBe("straight_1m");
	});

	it("recomputes chain and updates connections after append", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		const draft = useStore.getState().builderDraft;
		const seg0 = draft?.segments[0];

		// First segment is at origin
		expect(seg0?.position).toEqual({ x: 0, z: 0 });
		expect(seg0?.rotation).toBe(0);
		// No entry connection for first segment
		expect(seg0?.connections.entry.segmentId).toBeNull();
		// No exit connection (only one segment)
		expect(seg0?.connections.exit.segmentId).toBeNull();
	});

	it("chains two segments correctly: second not at origin", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_2m");
		useStore.getState().appendSegment("straight_1m");

		const draft = useStore.getState().builderDraft;
		expect(draft?.segments).toHaveLength(2);

		const seg0 = draft?.segments[0];
		const seg1 = draft?.segments[1];

		// First at origin
		expect(seg0?.position).toEqual({ x: 0, z: 0 });
		// Second not at origin (straight_2m exits at z=2)
		expect(seg1?.position.z).not.toBe(0);

		// Connections
		expect(seg0?.connections.exit.segmentId).toBe(seg1?.id);
		expect(seg1?.connections.entry.segmentId).toBe(seg0?.id);
		expect(seg1?.connections.exit.segmentId).toBeNull();
	});

	it("pushes undo snapshot and clears redo", () => {
		useStore.getState().enterBuilder();
		// Populate redo stack to verify it is cleared
		useStore.setState({ builderRedoStack: [makeTemplate()] });
		useStore.getState().appendSegment("straight_1m");

		const s = useStore.getState();
		expect(s.builderUndoStack).toHaveLength(1);
		expect(s.builderRedoStack).toEqual([]);
	});

	it("does nothing when no draft exists", () => {
		// No enterBuilder called
		useStore.getState().appendSegment("straight_1m");
		expect(useStore.getState().builderDraft).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// removeLastSegment
// ---------------------------------------------------------------------------

describe("removeLastSegment", () => {
	it("removes the last segment and recomputes chain", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_2m");
		useStore.getState().appendSegment("straight_1m");
		useStore.getState().removeLastSegment();

		const draft = useStore.getState().builderDraft;
		expect(draft?.segments).toHaveLength(1);
		expect(draft?.segments[0].specId).toBe("straight_2m");
	});

	it("pushes undo snapshot and clears redo", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		// Clear the undo from append, then verify removeLastSegment adds one
		useStore.setState({
			builderUndoStack: [],
			builderRedoStack: [makeTemplate()],
		});
		useStore.getState().removeLastSegment();

		const s = useStore.getState();
		expect(s.builderUndoStack).toHaveLength(1);
		expect(s.builderRedoStack).toEqual([]);
	});

	it("does nothing when segments are empty", () => {
		useStore.getState().enterBuilder();
		expect(useStore.getState().builderDraft?.segments).toHaveLength(0);
		useStore.getState().removeLastSegment();
		expect(useStore.getState().builderDraft?.segments).toHaveLength(0);
		// No undo snapshot pushed
		expect(useStore.getState().builderUndoStack).toHaveLength(0);
	});

	it("does nothing when no draft", () => {
		useStore.getState().removeLastSegment();
		expect(useStore.getState().builderDraft).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// replaceSegment
// ---------------------------------------------------------------------------

describe("replaceSegment", () => {
	it("swaps specId and recomputes chain", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		const segId = useStore.getState().builderDraft?.segments[0].id ?? "";

		useStore.getState().replaceSegment(segId, "straight_3m");
		const draft = useStore.getState().builderDraft;
		expect(draft?.segments[0].specId).toBe("straight_3m");
	});

	it("pushes undo snapshot and clears redo", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		const segId = useStore.getState().builderDraft?.segments[0].id ?? "";
		useStore.setState({
			builderUndoStack: [],
			builderRedoStack: [makeTemplate()],
		});

		useStore.getState().replaceSegment(segId, "straight_2m");
		const s = useStore.getState();
		expect(s.builderUndoStack).toHaveLength(1);
		expect(s.builderRedoStack).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// builderUndo / builderRedo
// ---------------------------------------------------------------------------

describe("builderUndo and builderRedo", () => {
	it("undo restores previous draft state", () => {
		useStore.getState().enterBuilder();
		// Draft starts empty
		const emptyDraft = useStore.getState().builderDraft;
		expect(emptyDraft?.segments).toHaveLength(0);

		useStore.getState().appendSegment("straight_1m");
		expect(useStore.getState().builderDraft?.segments).toHaveLength(1);

		// Undo should restore empty draft
		useStore.getState().builderUndo();
		expect(useStore.getState().builderDraft?.segments).toHaveLength(0);
	});

	it("redo re-applies undone change", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_2m");
		useStore.getState().builderUndo();
		expect(useStore.getState().builderDraft?.segments).toHaveLength(0);

		useStore.getState().builderRedo();
		expect(useStore.getState().builderDraft?.segments).toHaveLength(1);
		expect(useStore.getState().builderDraft?.segments[0].specId).toBe(
			"straight_2m",
		);
	});

	it("undo pushes current draft to redo stack", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		useStore.getState().builderUndo();

		expect(useStore.getState().builderRedoStack).toHaveLength(1);
	});

	it("redo pushes current draft to undo stack", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		useStore.getState().builderUndo();
		// After undo, undo stack is empty, redo stack has 1
		useStore.getState().builderRedo();

		expect(useStore.getState().builderUndoStack).toHaveLength(1);
	});

	it("undo does nothing when undo stack is empty", () => {
		useStore.getState().enterBuilder();
		const draftBefore = useStore.getState().builderDraft;
		useStore.getState().builderUndo();
		expect(useStore.getState().builderDraft?.id).toBe(draftBefore?.id);
	});

	it("redo does nothing when redo stack is empty", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		// No undo performed, so redo stack is empty
		const draftBefore = useStore.getState().builderDraft;
		useStore.getState().builderRedo();
		expect(useStore.getState().builderDraft?.segments).toHaveLength(
			draftBefore?.segments.length ?? -1,
		);
	});
});

// ---------------------------------------------------------------------------
// saveTemplate
// ---------------------------------------------------------------------------

describe("saveTemplate", () => {
	it("stores template and exits builder when >= 2 segments", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		useStore.getState().appendSegment("straight_2m");

		const draftId = useStore.getState().builderDraft?.id ?? "";
		useStore.getState().saveTemplate();

		const s = useStore.getState();
		expect(s.holeTemplates[draftId]).toBeDefined();
		expect(s.builderMode).toBe(false);
		expect(s.builderDraft).toBeNull();
	});

	it("does nothing when < 2 segments", () => {
		useStore.getState().enterBuilder();
		useStore.getState().appendSegment("straight_1m");
		useStore.getState().saveTemplate();

		const s = useStore.getState();
		// Still in builder mode — save was a no-op
		expect(s.builderMode).toBe(true);
		expect(s.builderDraft).not.toBeNull();
		expect(Object.keys(s.holeTemplates)).toHaveLength(0);
	});

	it("does nothing when draft is null", () => {
		// No enterBuilder
		useStore.getState().saveTemplate();
		expect(Object.keys(useStore.getState().holeTemplates)).toHaveLength(0);
	});

	it("updates existing template when editingTemplateId is set", () => {
		const original = makeTemplate({ id: "tpl-edit", name: "Original" });
		useStore.setState({ holeTemplates: { "tpl-edit": original } });
		useStore.getState().enterBuilder("tpl-edit");
		useStore.getState().appendSegment("straight_1m");
		useStore.getState().appendSegment("straight_2m");
		useStore.getState().setDraftName("Updated");
		useStore.getState().saveTemplate();

		const saved = useStore.getState().holeTemplates["tpl-edit"];
		expect(saved?.name).toBe("Updated");
		// Should still be only one template
		expect(Object.keys(useStore.getState().holeTemplates)).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// deleteTemplate
// ---------------------------------------------------------------------------

describe("deleteTemplate", () => {
	it("removes template from holeTemplates", () => {
		const tpl = makeTemplate({ id: "tpl-del" });
		useStore.setState({ holeTemplates: { "tpl-del": tpl } });
		useStore.getState().deleteTemplate("tpl-del");
		expect(useStore.getState().holeTemplates["tpl-del"]).toBeUndefined();
	});

	it("removes placed holes referencing the deleted templateId", () => {
		const tpl = makeTemplate({ id: "tpl-del" });
		useStore.setState({
			holeTemplates: { "tpl-del": tpl },
			holes: {
				"hole-1": {
					id: "hole-1",
					type: "straight",
					position: { x: 0, z: 0 },
					rotation: 0,
					name: "Hole 1",
					par: 3,
					templateId: "tpl-del",
				},
				"hole-2": {
					id: "hole-2",
					type: "straight",
					position: { x: 2, z: 0 },
					rotation: 0,
					name: "Hole 2",
					par: 3,
					// No templateId
				},
			},
			holeOrder: ["hole-1", "hole-2"],
		});

		useStore.getState().deleteTemplate("tpl-del");

		const s = useStore.getState();
		expect(s.holes["hole-1"]).toBeUndefined();
		expect(s.holes["hole-2"]).toBeDefined();
		expect(s.holeOrder).toEqual(["hole-2"]);
	});
});

// ---------------------------------------------------------------------------
// duplicateTemplate
// ---------------------------------------------------------------------------

describe("duplicateTemplate", () => {
	it("creates a copy with a new ID and '(Copy)' suffix", () => {
		const tpl = makeTemplate({ id: "tpl-orig", name: "My Hole" });
		useStore.setState({ holeTemplates: { "tpl-orig": tpl } });
		useStore.getState().duplicateTemplate("tpl-orig");

		const templates = useStore.getState().holeTemplates;
		const ids = Object.keys(templates);
		expect(ids).toHaveLength(2);

		const copy = Object.values(templates).find((t) => t.id !== "tpl-orig");
		expect(copy).toBeDefined();
		expect(copy?.name).toBe("My Hole (Copy)");
		expect(copy?.id).not.toBe("tpl-orig");
	});

	it("does nothing when templateId does not exist", () => {
		useStore.getState().duplicateTemplate("nonexistent");
		expect(Object.keys(useStore.getState().holeTemplates)).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// setDraftName / setDraftPar / setDraftFeltWidth / setDraftColor
// ---------------------------------------------------------------------------

describe("draft property setters", () => {
	it("setDraftName updates name without pushing undo", () => {
		useStore.getState().enterBuilder();
		useStore.getState().setDraftName("Custom Name");
		expect(useStore.getState().builderDraft?.name).toBe("Custom Name");
		// Name change does NOT push undo
		expect(useStore.getState().builderUndoStack).toHaveLength(0);
	});

	it("setDraftPar updates defaultPar and pushes undo", () => {
		useStore.getState().enterBuilder();
		useStore.getState().setDraftPar(5);
		expect(useStore.getState().builderDraft?.defaultPar).toBe(5);
		expect(useStore.getState().builderUndoStack).toHaveLength(1);
	});

	it("setDraftFeltWidth updates feltWidth and pushes undo", () => {
		useStore.getState().enterBuilder();
		useStore.getState().setDraftFeltWidth(0.8);
		expect(useStore.getState().builderDraft?.feltWidth).toBe(0.8);
		expect(useStore.getState().builderUndoStack).toHaveLength(1);
	});

	it("setDraftColor updates color and pushes undo", () => {
		useStore.getState().enterBuilder();
		useStore.getState().setDraftColor("#ff0000");
		expect(useStore.getState().builderDraft?.color).toBe("#ff0000");
		expect(useStore.getState().builderUndoStack).toHaveLength(1);
	});

	it("setters do nothing when draft is null", () => {
		// No enterBuilder — draft is null
		useStore.getState().setDraftName("X");
		useStore.getState().setDraftPar(4);
		useStore.getState().setDraftFeltWidth(1.0);
		useStore.getState().setDraftColor("#000000");

		expect(useStore.getState().builderDraft).toBeNull();
		expect(useStore.getState().builderUndoStack).toHaveLength(0);
	});
});
