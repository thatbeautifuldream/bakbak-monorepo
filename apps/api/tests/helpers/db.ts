import { vi } from "vitest";

let selectRows: unknown[] = [];
let updateRows: unknown[] = [];
let insertRows: unknown[] = [];
let deleteRows: unknown[] = [];

const selectWhere = vi.fn(async () => selectRows);
const selectOrderBy = vi.fn(async () => selectRows);
const selectFrom = vi.fn(() => ({ where: selectWhere, orderBy: selectOrderBy }));

const updateReturning = vi.fn(async () => updateRows);
const updateWhere = vi.fn(() => ({ returning: updateReturning }));
const updateSet = vi.fn(() => ({ where: updateWhere }));

const insertReturning = vi.fn(async () => insertRows);
const insertValues = vi.fn(() => ({ returning: insertReturning }));

const deleteReturning = vi.fn(async () => deleteRows);
const deleteWhere = vi.fn(() => ({ returning: deleteReturning }));

export const db = {
  select: vi.fn(() => ({ from: selectFrom })),
  update: vi.fn(() => ({ set: updateSet })),
  insert: vi.fn(() => ({ values: insertValues })),
  delete: vi.fn(() => ({ where: deleteWhere })),
};

export const dbMocks = {
  selectWhere,
  selectOrderBy,
  selectFrom,
  updateReturning,
  updateWhere,
  updateSet,
  insertReturning,
  insertValues,
  deleteReturning,
  deleteWhere,
};

export const mockDbSelectRows = (rows: unknown[]) => {
  selectRows = rows;
};

export const mockDbUpdateRows = (rows: unknown[]) => {
  updateRows = rows;
};

export const mockDbInsertRows = (rows: unknown[]) => {
  insertRows = rows;
};

export const mockDbDeleteRows = (rows: unknown[]) => {
  deleteRows = rows;
};

export const resetDbMocks = () => {
  selectRows = [];
  updateRows = [];
  insertRows = [];
  deleteRows = [];
};
