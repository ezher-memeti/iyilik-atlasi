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
import { type ReactNode } from "react";

export type SortableListItem = {
  id: number;
  primary: string;
  secondary?: string;
  link?: string | null;
  isHighlighted?: boolean;
  actions?: ReactNode;
};

type SortableOrderListProps = {
  items: SortableListItem[];
  onReorder: (items: SortableListItem[]) => void;
};

function SortableRow({
  item,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  item: SortableListItem;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
        <button
          type="button"
          className="mt-0.5 h-11 w-11 shrink-0 touch-none cursor-grab rounded-md border border-divider-softLight text-base text-text-secondary active:cursor-grabbing sm:h-10 sm:w-10"
          aria-label="Sürükleyerek sırala"
          {...attributes}
          {...listeners}
        >
          ☰
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">
            {item.primary}
          </p>
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
    </li>
  );
}

export function SortableOrderList({ items, onReorder }: SortableOrderListProps) {
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

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              item={item}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onMoveUp={() => moveItem(index, index - 1)}
              onMoveDown={() => moveItem(index, index + 1)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
