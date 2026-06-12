import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import KanbanBoard from '../components/KanbanBoard';
import './BoardPage.css';

const BoardPage = () => {
  const { token } = useAuthStore();
  const [boardId, setBoardId] = useState<string | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await fetch('/api/boards', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const boards = await res.json();
          if (boards.length > 0) {
            const activeBoard = boards[0];
            setBoardId(activeBoard.id);
            
            // Flatten columns and cards
            const flatColumns: any[] = [];
            const flatCards: any[] = [];
            
            activeBoard.columns.forEach((col: any) => {
              flatColumns.push({ id: col.id, title: col.title, wipLimit: col.wipLimit });
              col.cards.forEach((card: any) => {
                flatCards.push({ 
                  id: card.id, 
                  columnId: col.id, 
                  title: card.title, 
                  description: card.description,
                  color: card.color,
                  dueDate: card.dueDate,
                  checklists: card.checklists
                });
              });
            });
            
            setColumns(flatColumns);
            setCards(flatCards);
          }
        }
      } catch (error) {
        console.error("Failed to fetch boards", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchBoards();
  }, [token]);

  if (isLoading) {
    return <div className="board-loading flex-center">Loading your workspace...</div>;
  }

  return (
    <div className="board-page">
      <header className="board-header">
        <h1 className="board-title">My Workspace</h1>
      </header>
      
      <div className="board-canvas">
        {boardId ? (
          <KanbanBoard 
            boardId={boardId} 
            initialColumns={columns} 
            initialCards={cards} 
          />
        ) : (
          <div className="empty-state">
            <p>No boards found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardPage;
