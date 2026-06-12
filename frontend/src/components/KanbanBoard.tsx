import { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

interface BoardProps {
  initialColumns: any[];
  initialCards: any[];
}

export default function KanbanBoard({ initialColumns, initialCards }: BoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [cards, setCards] = useState(initialCards);
  const [activeColumn, setActiveColumn] = useState<any | null>(null);
  const [activeCard, setActiveCard] = useState<any | null>(null);

  const persistReorder = async (updatedCards: any[]) => {
    try {
      const items = updatedCards.map((c, index) => ({ id: c.id, columnId: c.columnId, order: index }));
      const token = localStorage.getItem('token');
      await fetch('/api/cards/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
    } catch (e) {
      console.error('Failed to persist reorder', e);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Column') {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === 'Card') {
      setActiveCard(event.active.data.current.card);
      return;
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === 'Card';
    const isOverACard = over.data.current?.type === 'Card';
    const isOverAColumn = over.data.current?.type === 'Column';

    if (!isActiveACard) return;

    // Dropping a Card over another Card
    if (isActiveACard && isOverACard) {
      setCards((cards) => {
        const activeIndex = cards.findIndex((t) => t.id === activeId);
        const overIndex = cards.findIndex((t) => t.id === overId);
        
        let updatedCards = [...cards];
        if (cards[activeIndex].columnId !== cards[overIndex].columnId) {
          updatedCards[activeIndex].columnId = cards[overIndex].columnId;
        }
        
        updatedCards = arrayMove(updatedCards, activeIndex, overIndex);
        persistReorder(updatedCards);
        return updatedCards;
      });
    }

    // Dropping a Card over a Column
    if (isActiveACard && isOverAColumn) {
      setCards((cards) => {
        const activeIndex = cards.findIndex((t) => t.id === activeId);
        let updatedCards = [...cards];
        updatedCards[activeIndex].columnId = overId as string;
        updatedCards = arrayMove(updatedCards, activeIndex, activeIndex);
        persistReorder(updatedCards);
        return updatedCards;
      });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === 'Column';
    if (isActiveAColumn) {
      setColumns((columns) => {
        const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
        const overColumnIndex = columns.findIndex((col) => col.id === overId);
        return arrayMove(columns, activeColumnIndex, overColumnIndex);
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="columns-container">
        <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          {columns.map(col => (
            <KanbanColumn 
              key={col.id} 
              column={col} 
              cards={cards.filter(c => c.columnId === col.id)} 
            />
          ))}
        </SortableContext>
      </div>

      {/* Drag Overlay for smooth animations while holding an item */}
      <DragOverlay>
        {activeColumn && (
          <KanbanColumn column={activeColumn} cards={cards.filter(c => c.columnId === activeColumn.id)} />
        )}
        {activeCard && <KanbanCard card={activeCard} />}
      </DragOverlay>
    </DndContext>
  );
}
