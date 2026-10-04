import type { Column } from "./types";

/** Resolve from the configured columns, before visibility and order preferences apply. */
export function getTitleColumn<T>(
    columns: Column<T>[],
    titleColumnId?: string,
): Column<T> | undefined {
    if (titleColumnId !== undefined) return columns.find((column) => column.id === titleColumnId);
    const fields = columns.filter((column) => column.id !== "__select");
    return (
        fields.find((column) => column.cardRole === "title") ??
        fields.find((column) => /^(title|name|claim_text|label)$/.test(column.id)) ??
        fields.find((column) => !column.tight && (column.width ?? 100) > 48)
    );
}
