"use client";

import {
  DndContext,
  PointerSensor,
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

function SortableRow({ item }: { item: SortableListItem }) {
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
      className={`rounded-lg border p-4 transition ${
        item.isHighlighted
          ? "border-brand-primary bg-brand-secondary/10"
          : "border-divider-softLight bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab rounded-md border border-divider-softLight px-2 py-1 text-sm text-text-secondary active:cursor-grabbing"
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

        {item.actions ? <div className="flex shrink-0 items-center gap-2">{item.actions}</div> : null}
      </div>
    </li>
  );
}

export function SortableOrderList({ items, onReorder }: SortableOrderListProps) {
  const sensors = useSensors(useSensor(PointerSensor));

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
          {items.map((item) => (
            <SortableRow key={item.id} item={item} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
