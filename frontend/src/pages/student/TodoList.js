import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, Star, Trash2, Calendar, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImportant, setNewImportant] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchTodos(); }, []);

  const fetchTodos = async () => {
    try {
      const { data } = await api.get('/todos');
      setTodos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addTodo = async () => {
    if (!newTitle.trim()) return;
    try {
      const { data } = await api.post('/todos', { title: newTitle, description: newDesc, is_important: newImportant });
      setTodos(prev => [data, ...prev]);
      setNewTitle(''); setNewDesc(''); setNewImportant(false); setShowAdd(false);
      toast.success('Task added!');
    } catch (err) { toast.error('Failed to add task'); }
  };

  const toggleComplete = async (todo) => {
    try {
      const newCompleted = !todo.is_completed;
      await api.patch(`/todos/${todo.id}`, { is_completed: newCompleted, status: newCompleted ? 'done' : 'todo' });
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, is_completed: newCompleted, status: newCompleted ? 'done' : 'todo' } : t));
      if (newCompleted) toast.success('+5 XP earned!');
    } catch (err) { toast.error('Failed to update'); }
  };

  const toggleImportant = async (todo) => {
    try {
      await api.patch(`/todos/${todo.id}`, { is_important: !todo.is_important });
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, is_important: !t.is_important } : t));
    } catch (err) { toast.error('Failed to update'); }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      setTodos(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch (err) { toast.error('Failed to delete'); }
  };

  const filtered = filter === 'all' ? todos :
    filter === 'active' ? todos.filter(t => !t.is_completed) :
    filter === 'completed' ? todos.filter(t => t.is_completed) :
    filter === 'important' ? todos.filter(t => t.is_important) : todos;

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="glass-card h-16 shimmer-bg rounded-xl" />)}</div>;
  }

  return (
    <motion.div
      data-testid="todo-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">Todo List</h1>
          <p className="text-white/40 text-sm mt-1">{todos.filter(t => !t.is_completed).length} tasks remaining</p>
        </div>
        <button
          data-testid="add-todo-btn"
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center gap-2  transition-all"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 overflow-hidden"
          >
            <input
              data-testid="todo-title-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 mb-3"
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            />
            <textarea
              data-testid="todo-desc-input"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 mb-3 resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-white/50">
                <input
                  type="checkbox"
                  checked={newImportant}
                  onChange={(e) => setNewImportant(e.target.checked)}
                  className="rounded border-white/20"
                />
                <Star className="w-4 h-4 text-amber-400" /> Mark as important
              </label>
              <div className="flex gap-2">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-white/[0.04] text-sm text-white/50 hover:text-white transition-all">Cancel</button>
                <button
                  data-testid="save-todo-btn"
                  onClick={addTodo}
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-[#818cf8] disabled:opacity-50 transition-all"
                >
                  Add Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'active', 'completed', 'important'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`filter-${f}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.04] text-white/40 hover:text-white/60 border border-transparent'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Todo List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CheckSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map(todo => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`glass-card p-4 flex items-center gap-3 group ${
                  todo.is_important && !todo.is_completed ? 'border-l-2 border-amber-500' : ''
                }`}
                data-testid={`todo-item-${todo.id}`}
              >
                <button
                  onClick={() => toggleComplete(todo)}
                  data-testid={`toggle-todo-${todo.id}`}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    todo.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-indigo-400'
                  }`}
                >
                  {todo.is_completed && <CheckSquare className="w-3 h-3 text-white" />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${todo.is_completed ? 'line-through text-white/30' : ''}`}>
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="text-xs text-white/30 truncate">{todo.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleImportant(todo)}
                    className={`p-1.5 rounded transition-colors ${todo.is_important ? 'text-amber-400' : 'text-white/20 hover:text-amber-400'}`}
                  >
                    <Star className="w-4 h-4" fill={todo.is_important ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    data-testid={`delete-todo-${todo.id}`}
                    className="p-1.5 rounded text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
