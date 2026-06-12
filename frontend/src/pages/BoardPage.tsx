import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import KanbanBoard from '../components/KanbanBoard';
import './BoardPage.css';

// Mock data for the wow factor before DB connection
const mockColumns = [
  { id: 'todo', title: 'To-do', wipLimit: null },
  { id: 'this-week', title: 'This week', wipLimit: null },
  { id: 'in-progress', title: 'In progress', wipLimit: 3 },
  { id: 'done', title: 'Done', wipLimit: null },
];

const mockCards = [
  { id: 'c1', columnId: 'todo', title: 'Design marketing campaign', color: '#84cc16' },
  { id: 'c2', columnId: 'todo', title: 'Experiment with AR/VR in app', color: '#06b6d4' },
  { id: 'c3', columnId: 'this-week', title: 'Research market trends', hasComments: true, hasAttachments: true, color: '#84cc16' },
  { id: 'c4', columnId: 'in-progress', title: 'Review data pipelines for AI model training', color: '#eab308' },
  { id: 'c5', columnId: 'in-progress', title: 'Plan exhibition for upcoming trade show', hasChecklist: true, color: '#84cc16' },
  { id: 'c6', columnId: 'done', title: 'Evaluate sales tools', color: '#d946ef' },
];

const BoardPage = () => {
  const { token } = useAuthStore();
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this fetches from the backend
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
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
        <KanbanBoard initialColumns={mockColumns} initialCards={mockCards} />
      </div>
    </div>
  );
};

export default BoardPage;
