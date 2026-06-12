import { useState } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanCard from './KanbanCard';
import { MoreHorizontal, Plus } from 'lucide-react';
import './KanbanColumn.css';

interface ColumnProps {
  column: any;
  cards: any[];
  onAddCard: (columnId: string, title: string) => void;
  onCardClick: (card: any) => void;
}

export default function KanbanColumn({ column, cards, onAddCard, onCardClick }: ColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'Column', column }
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="column-drag-placeholder glass" />;
  }

  const isOverLimit = column.wipLimit && cards.length > column.wipLimit;

  return (
    <div ref={setNodeRef} style={style} className="column-container glass">
      <div 
        {...attributes} 
        {...listeners} 
        className={`column-header ${isOverLimit ? 'over-limit' : ''}`}
      >
        <div className="column-title-container">
          <h3 className="column-title">{column.title}</h3>
          <span className="column-count">
            {cards.length} {column.wipLimit ? `/ ${column.wipLimit}` : ''}
          </span>
        </div>
        <div className="column-actions">
          <button className="btn-icon" onClick={() => setIsAddingCard(true)}><Plus size={18} /></button>
          <button className="btn-icon"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      <div className="column-body">
        {isAddingCard && (
          <div className="add-card-inline">
            <input 
              autoFocus
              type="text" 
              className="input-field" 
              placeholder="What needs to be done?"
              value={newCardTitle}
              onChange={e => setNewCardTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newCardTitle.trim() !== '') {
                  onAddCard(column.id, newCardTitle.trim());
                  setNewCardTitle('');
                  setIsAddingCard(false);
                } else if (e.key === 'Escape') {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }
              }}
              onBlur={() => {
                setIsAddingCard(false);
                setNewCardTitle('');
              }}
            />
          </div>
        )}
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCard key={card.id} card={card} onCardClick={onCardClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
