import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, Paperclip, CheckSquare, Clock } from 'lucide-react';
import './KanbanCard.css';

interface CardProps {
  card: any;
}

export default function KanbanCard({ card }: CardProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'Card', card }
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="card-drag-placeholder" />;
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="card-container"
    >
      {/* Optional Top Color Tag */}
      {card.color && <div className="card-color-strip" style={{ backgroundColor: card.color }}></div>}
      
      <div className="card-content">
        <h4 className="card-title">{card.title}</h4>
        
        <div className="card-meta">
          <div className="meta-icons">
            {card.hasChecklist && (
              <span className="meta-badge">
                <CheckSquare size={14} /> 2/4
              </span>
            )}
            {card.hasComments && <MessageSquare size={14} className="icon-subtle" />}
            {card.hasAttachments && <Paperclip size={14} className="icon-subtle" />}
            {card.dueDate && <Clock size={14} className="icon-subtle" />}
          </div>
          
          <div className="card-assignees">
            <div className="assignee-avatar">A</div>
          </div>
        </div>
      </div>
    </div>
  );
}
