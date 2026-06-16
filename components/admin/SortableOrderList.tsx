"use client";

import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState, type ReactNode } from "react";

export type SortableListItem = {
  id: number;
  primary: string;
  meta?: string;
  secondary?: string;
  status?: ReactNode;
  link?: string | null;
  isHighlighted?: boolean;
  actions?: ReactNode;
};

type SortableOrderListProps = {
  items: SortableListItem[];
  onReorder: (items: SortableListItem[]) => void;
  enableDrag?: boolean;
  showQuickMove?: boolean;
  totalItemsCount?: number;
  onMoveToGlobalIndex?: (itemId: number, targetIndex: number) => void;
  globalIndexById?: Record<number, number>;
  showIndexBadge?: boolean;
};

function SortableRow({
  item,
  index,
  total,
  showQuickMove,
  onMoveTop,
  onMoveBottom,
  onMoveTo,
  onMoveToGlobalIndex,
  totalItemsCount,
  globalIndexById,
  showIndexBadge,
  enableDrag,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  item: SortableListItem;
  index: number;
  total: number;
  showQuickMove: boolean;
  onMoveTop: () => void;
  onMoveBottom: () => void;
  onMoveTo: (targetIndex: number) => void;
  onMoveToGlobalIndex?: (itemId: number, targetIndex: number) => void;
  totalItemsCount?: number;
  globalIndexById?: Record<number, number>;
  showIndexBadge: boolean;
  enableDrag: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [targetPosition, setTargetPosition] = useState(String(index + 1));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const globalIndex =
    globalIndexById && typeof globalIndexById[item.id] === "number"
      ? globalIndexById[item.id]
      : index;
  const displayPosition = globalIndex + 1;
  const maxCount = typeof totalItemsCount === "number" ? totalItemsCount : total;
  const isAtGlobalTop = globalIndex <= 0;
  const isAtGlobalBottom = globalIndex >= maxCount - 1;

  useEffect(() => {
    setTargetPosition(String(displayPosition));
  }, [displayPosition]);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`touch-none rounded-lg border p-4 transition ${
        item.isHighlighted
          ? "border-brand-primary bg-brand-secondary/10"
          : "border-divider-softLight bg-white"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {enableDrag ? (
          <button
            type="button"
            className="mt-0.5 h-11 w-11 shrink-0 touch-none cursor-grab rounded-md border border-divider-softLight text-base text-text-secondary active:cursor-grabbing sm:h-10 sm:w-10"
            aria-label="Sürükleyerek sırala"
            {...attributes}
            {...listeners}
          >
            ☰
          </button>
        ) : showIndexBadge ? (
          <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-divider-softLight text-xs font-semibold text-text-secondary sm:h-10 sm:w-10">
            {displayPosition}
          </span>
        ) : (
          <span className="sr-only">{displayPosition}</span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text-primary">
              {item.primary}
            </p>
            {item.status ? item.status : null}
          </div>
          {item.meta ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-text-secondary">
              {item.meta}
            </p>
          ) : null}
          {item.secondary || item.link ? (
            <button
              type="button"
              onClick={() => setShowDetails((current) => !current)}
              className="mt-2 inline-flex text-xs font-semibold text-brand-primary transition hover:text-brand-secondary"
            >
              {showDetails ? "Detayı Gizle" : "Detay"}
            </button>
          ) : null}
          {showDetails ? (
            <>
              {item.secondary ? (
                <p className="mt-1 text-sm text-text-secondary">{item.secondary}</p>
              ) : null}
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex text-sm font-medium text-brand-primary hover:text-brand-secondary"
                >
                  {item.link}
                </a>
              ) : null}
            </>
          ) : null}
        </div>

        {item.actions ? (
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            {item.actions}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex gap-2 sm:hidden">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary disabled:opacity-50"
        >
          Yukarı Taşı
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-sm font-semibold text-text-primary disabled:opacity-50"
        >
          Aşağı Taşı
        </button>
      </div>

      {showQuickMove ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
          <button
            type="button"
            onClick={() => {
              if (onMoveToGlobalIndex) {
                onMoveToGlobalIndex(item.id, 0);
                return;
              }
              onMoveTop();
            }}
            disabled={isAtGlobalTop}
            className="inline-flex h-9 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-xs font-semibold text-text-primary disabled:opacity-50"
          >
            En üste
          </button>
          <button
            type="button"
            onClick={() => {
              if (onMoveToGlobalIndex && typeof totalItemsCount === "number") {
                onMoveToGlobalIndex(item.id, totalItemsCount - 1);
                return;
              }
              onMoveBottom();
            }}
            disabled={isAtGlobalBottom}
            className="inline-flex h-9 items-center justify-center rounded-md border border-divider-softLight bg-surface-pageLight px-3 text-xs font-semibold text-text-primary disabled:opacity-50"
          >
            En alta
          </button>
          <input
            type="number"
            min={1}
            max={maxCount}
            value={targetPosition}
            onChange={(event) => setTargetPosition(event.target.value)}
            className="h-9 w-full rounded-md border border-divider-softLight bg-surface-pageLight px-2 text-xs outline-none focus:border-brand-primary"
            aria-label="Pozisyon numarası"
          />
          <button
            type="button"
            onClick={() => {
              const next = Number(targetPosition);
              if (Number.isNaN(next)) return;
              const clamped = Math.max(1, Math.min(maxCount, next));
              if (onMoveToGlobalIndex) {
                onMoveToGlobalIndex(item.id, clamped - 1);
                return;
              }
              onMoveTo(clamped - 1);
            }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand-primary px-3 text-xs font-semibold text-white"
          >
            Uygula
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function SortableOrderList({
  items,
  onReorder,
  enableDrag = true,
  showQuickMove = false,
  totalItemsCount,
  onMoveToGlobalIndex,
  globalIndexById,
  showIndexBadge = true,
}: SortableOrderListProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 10,
      },
    }),
  );

  function moveItem(oldIndex: number, newIndex: number) {
    if (oldIndex < 0 || newIndex < 0 || oldIndex >= items.length || newIndex >= items.length) {
      return;
    }
    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === Number(active.id));
    const newIndex = items.findIndex((item) => item.id === Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  const list = (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <SortableRow
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          showQuickMove={showQuickMove}
          onMoveTop={() => moveItem(index, 0)}
          onMoveBottom={() => moveItem(index, items.length - 1)}
          onMoveTo={(target) => moveItem(index, target)}
          onMoveToGlobalIndex={onMoveToGlobalIndex}
          totalItemsCount={totalItemsCount}
          globalIndexById={globalIndexById}
          showIndexBadge={showIndexBadge}
          enableDrag={enableDrag}
          canMoveUp={index > 0}
          canMoveDown={index < items.length - 1}
          onMoveUp={() => moveItem(index, index - 1)}
          onMoveDown={() => moveItem(index, index + 1)}
        />
      ))}
    </ul>
  );

  if (!enableDrag) return list;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        {list}
      </SortableContext>
    </DndContext>
  );
}
