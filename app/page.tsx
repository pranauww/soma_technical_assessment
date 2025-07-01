"use client"
import { useState, useEffect } from 'react';

interface Todo {
  id: number;
  title: string;
  dueDate: Date | string | null;
  imageUrl: string | null;
  createdAt: Date | string;
  dependencies: Todo[];
}

interface TaskAnalysis {
  id: number;
  title: string;
  earliestStartDate: string | null;
  duration: number;
  criticalPath: boolean;
  dependencies: number[];
  dependents: number[];
}

export default function Home() {
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedDependencies, setSelectedDependencies] = useState<number[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [taskAnalysis, setTaskAnalysis] = useState<TaskAnalysis[]>([]);
  const [loadingTodos, setLoadingTodos] = useState<Set<number>>(new Set());
  const [showDependencySelector, setShowDependencySelector] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      setTodos(data);
      
      // Also fetch analysis data
      const analysisRes = await fetch('/api/todos/analysis');
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setTaskAnalysis(analysisData.analysis);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    
    // Add loading state for the new todo
    const tempId = Date.now();
    setLoadingTodos(prev => new Set(prev).add(tempId));
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newTodo,
          dueDate: dueDate || null,
          dependencyIds: selectedDependencies
        }),
      });
      
      if (response.ok) {
        setNewTodo('');
        setDueDate('');
        setSelectedDependencies([]);
        setShowDependencySelector(false);
        fetchTodos();
      }
    } catch (error) {
      console.error('Failed to add todo:', error);
    } finally {
      setLoadingTodos(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleDependencyToggle = (todoId: number) => {
    setSelectedDependencies(prev => 
      prev.includes(todoId) 
        ? prev.filter(id => id !== todoId)
        : [...prev, todoId]
    );
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Ensure we're working with the local date by creating a new date object
    const localDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    return localDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate: Date | string) => {
    const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    // Ensure we're working with the local date by creating a new date object
    const localDueDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const today = new Date();
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return localDueDate < localToday;
  };

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const ImagePlaceholder = ({ title }: { title: string }) => (
    <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
      <div className="text-center">
        <div className="text-gray-500 text-sm mb-1">📷</div>
        <div className="text-gray-400 text-xs">No image available</div>
      </div>
    </div>
  );

  const DependencyGraph = () => {
    if (todos.length === 0) return null;

    return (
      <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dependency Graph</h3>
        <div className="space-y-3">
          {todos.map((todo) => {
            const analysis = taskAnalysis.find(a => a.id === todo.id);
            return (
              <div key={todo.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${analysis?.criticalPath ? 'text-red-600' : 'text-gray-800'}`}>
                    {todo.title}
                    {analysis?.criticalPath && ' 🔥'}
                  </span>
                  {analysis?.earliestStartDate && (
                    <span className="text-sm text-gray-600">
                      Start: {formatDate(analysis.earliestStartDate)}
                    </span>
                  )}
                </div>
                
                {todo.dependencies && todo.dependencies.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span>Depends on: </span>
                    {todo.dependencies.map((dep, index) => (
                      <span key={dep.id}>
                        {index > 0 && ', '}
                        <span className="text-blue-600">{dep.title}</span>
                      </span>
                    ))}
                  </div>
                )}
                
                {analysis?.criticalPath && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Critical Path
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center text-white mb-8">Things To Do App</h1>
        
        {/* Analysis Toggle */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="bg-white text-indigo-600 px-6 py-2 rounded-full hover:bg-gray-100 transition duration-300 font-medium"
          >
            {showAnalysis ? 'Hide' : 'Show'} Project Analysis
          </button>
        </div>

        {/* Project Analysis */}
        {showAnalysis && <DependencyGraph />}
        
        {/* Todo Creation Form */}
        <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-lg mb-6">
          <div className="flex mb-4">
            <input
              type="text"
              className="flex-grow p-3 rounded-l-full focus:outline-none text-gray-700"
              placeholder="Add a new todo"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
            />
            <input 
              type="date" 
              className="p-3 border-l border-gray-300 focus:outline-none text-gray-700"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={getTodayString()}
            />
            <button
              onClick={handleAddTodo}
              className="bg-indigo-600 text-white p-3 rounded-r-full hover:bg-indigo-700 transition duration-300"
            >
              Add
            </button>
          </div>
          
          {/* Dependency Selector */}
          <div className="mb-4">
            <button
              onClick={() => setShowDependencySelector(!showDependencySelector)}
              className="text-sm text-indigo-600 hover:text-indigo-800 transition duration-300"
            >
              {showDependencySelector ? 'Hide' : 'Add'} Dependencies ({selectedDependencies.length})
            </button>
            
            {showDependencySelector && todos.length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Select dependencies:</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {todos.map((todo) => (
                    <label key={todo.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDependencies.includes(todo.id)}
                        onChange={() => handleDependencyToggle(todo.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{todo.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Todo List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {todos.map((todo: Todo) => {
            const analysis = taskAnalysis.find(a => a.id === todo.id);
            return (
              <li
                key={todo.id}
                className="flex justify-between items-start bg-white bg-opacity-90 p-4 rounded-lg shadow-lg list-none"
              >
                <div className="flex flex-col flex-grow mr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-medium ${analysis?.criticalPath ? 'text-red-600' : 'text-gray-800'}`}>
                      {todo.title}
                    </span>
                    {analysis?.criticalPath && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Critical
                      </span>
                    )}
                  </div>
                  
                  {/* Dependencies Display */}
                  {todo.dependencies && todo.dependencies.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Depends on:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {todo.dependencies.map((dep) => (
                          <span
                            key={dep.id}
                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {dep.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Earliest Start Date */}
                  {analysis?.earliestStartDate && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-500">Earliest start: </span>
                      <span className="text-xs text-green-600 font-medium">
                        {formatDate(analysis.earliestStartDate)}
                      </span>
                    </div>
                  )}
                  
                  {todo.dueDate && (
                    <span 
                      className={`text-sm mt-1 ${
                        isOverdue(todo.dueDate) 
                          ? 'text-red-600 font-semibold' 
                          : 'text-gray-600'
                      }`}
                    >
                      Due: {formatDate(todo.dueDate)}
                      {isOverdue(todo.dueDate) && ' (Overdue)'}
                    </span>
                  )}
                  
                  {/* Image Display */}
                  <div className="mt-3">
                    {todo.imageUrl ? (
                      <img 
                        src={todo.imageUrl} 
                        alt={`Visualization for: ${todo.title}`}
                        className="w-full h-32 object-contain rounded-lg shadow-sm bg-gray-50"
                        onError={(e) => {
                          // Replace with placeholder if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    {!todo.imageUrl && (
                      <ImagePlaceholder title={todo.title} />
                    )}
                  </div>
                  
                  {/* Loading state for images */}
                  {loadingTodos.has(todo.id) && (
                    <div className="mt-3">
                      <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
                        <div className="text-gray-500 text-sm">Loading image...</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 transition duration-300 flex-shrink-0"
                >
                  {/* Delete Icon */}
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            );
          })}
        </div>
      </div>
    </div>
  );
}
