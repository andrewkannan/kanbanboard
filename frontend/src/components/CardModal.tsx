import { useState, useEffect } from 'react';
import { X, Trash2, Tag, Calendar, AlignLeft, CheckSquare } from 'lucide-react';
import './CardModal.css';

interface CardModalProps {
  card: any;
  onClose: () => void;
  onUpdate: (updatedCard: any) => void;
  onDelete: (id: string) => void;
}

const COLORS = ['#84cc16', '#06b6d4', '#eab308', '#d946ef', '#ef4444', '#3b82f6'];

export default function CardModal({ card, onClose, onUpdate, onDelete }: CardModalProps) {
  const [title, setTitle] = useState(card.title || '');
  const [description, setDescription] = useState(card.description || '');
  const [color, setColor] = useState(card.color || '');
  const [isSaving, setIsSaving] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, description, color })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cards/${card.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onDelete(card.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <input 
            type="text" 
            className="modal-title-input" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-main">
            <div className="modal-section">
              <div className="section-header">
                <AlignLeft size={16} /> <h3>Description</h3>
              </div>
              <textarea 
                className="input-field description-input" 
                placeholder="Add a more detailed description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-sidebar">
            <div className="sidebar-module">
              <h4>Actions</h4>
              <button className="btn-sidebar danger" onClick={handleDelete}>
                <Trash2 size={14} /> Delete Card
              </button>
            </div>

            <div className="sidebar-module">
              <h4>Color Tag</h4>
              <div className="color-picker">
                <div 
                  className={`color-swatch ${color === '' ? 'selected' : ''}`}
                  onClick={() => setColor('')}
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--text-secondary)' }}
                />
                {COLORS.map(c => (
                  <div 
                    key={c}
                    className={`color-swatch ${color === c ? 'selected' : ''}`}
                    onClick={() => setColor(c)}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
