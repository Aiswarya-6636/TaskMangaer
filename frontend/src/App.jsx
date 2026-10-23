
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api/tasks";

function Layout({ tasks, refresh }) {
  const completed = tasks.filter((t) => t.status === "Done").length;
  const percent = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  return (
    <div className="app">
      <nav className="navbar">
        <Link className="brand" to="/">TaskFlow</Link>
        <div className="navlinks">
          <Link to="/">Dashboard</Link>
          <Link to="/add">Add Task</Link>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                tasks={tasks}
                refresh={refresh}
                completed={completed}
                percent={percent}
              />
            }
          />
          <Route
            path="/add"
            element={<TaskForm refresh={refresh} />}
          />
          <Route
            path="/edit/:id"
            element={<TaskForm tasks={tasks} refresh={refresh} />}
          />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard({ tasks, refresh, completed, percent }) {
  const [filter, setFilter] = useState("All");

  async function toggleStatus(task) {
    try {
      await axios.put(`${API}/${task._id}`, {
        status: task.status === "Done" ? "Pending" : "Done",
      });
      refresh();
    } catch {
      alert("Could not update task status.");
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Delete this task?")) return;

    try {
      await axios.delete(`${API}/${id}`);
      refresh();
    } catch {
      alert("Could not delete task.");
    }
  }

  const visibleTasks = tasks.filter((task) =>
    filter === "All" ? true : task.status === filter
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Task Dashboard</h1>
          <p className="muted">Plan your work. Finish what matters.</p>
        </div>
        <Link className="primary-btn" to="/add">+ Add Task</Link>
      </div>

      <div className="stats">
        <div className="stat-card">
          <span>Total Tasks</span>
          <strong>{tasks.length}</strong>
        </div>
        <div className="stat-card">
          <span>Pending</span>
          <strong>{tasks.filter(t => t.status === "Pending").length}</strong>
        </div>
        <div className="stat-card">
          <span>Completed</span>
          <strong>{completed}</strong>
        </div>
      </div>

      <section className="progress-card">
        <div className="progress-title">
          <h3>Overall Progress</h3>
          <strong>{percent}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="muted">{completed} of {tasks.length} tasks completed</p>
      </section>

      <div className="list-heading">
        <h2>Your Tasks</h2>
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="All">All Tasks</option>
          <option value="Pending">Pending</option>
          <option value="Done">Completed</option>
        </select>
      </div>

      <div className="task-list">
        {visibleTasks.length === 0 ? (
          <div className="empty">
            <h3>No tasks found</h3>
            <p>Add a task to get started.</p>
            <Link to="/add" className="primary-btn">Create Task</Link>
          </div>
        ) : (
          visibleTasks.map(task => (
            <article className="task-card" key={task._id}>
              <div className="task-main">
                <h3 className={task.status === "Done" ? "done" : ""}>
                  {task.title}
                </h3>
                <p>{task.description || "No description"}</p>
                <div className="task-meta">
                  <span className={`priority ${task.priority.toLowerCase()}`}>
                    {task.priority} Priority
                  </span>
                  <span>
                    Due: {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "Not set"}
                  </span>
                  <span className={`status ${task.status.toLowerCase()}`}>
                    {task.status}
                  </span>
                </div>
              </div>

              <div className="task-actions">
                <button className="secondary-btn"
                  onClick={() => toggleStatus(task)}>
                  {task.status === "Done" ? "Mark Pending" : "Mark Done"}
                </button>
                <Link className="secondary-btn" to={`/edit/${task._id}`}>
                  Edit
                </Link>
                <button className="delete-btn"
                  onClick={() => deleteTask(task._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}

function TaskForm({ tasks = [], refresh }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const existing = tasks.find(t => t._id === id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Pending");
  const [error, setError] = useState("");

  useEffect(() => {
    if (existing) {
      setTitle(existing.title || "");
      setDescription(existing.description || "");
      setPriority(existing.priority || "Medium");
      setDueDate(existing.dueDate
        ? new Date(existing.dueDate).toISOString().slice(0, 10)
        : "");
      setStatus(existing.status || "Pending");
    }
  }, [existing]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const payload = {
      title: title.trim(),
      description,
      priority,
      dueDate: dueDate || null,
      status,
    };

    try {
      if (editing) {
        await axios.put(`${API}/${id}`, payload);
      } else {
        await axios.post(API, payload);
      }

      await refresh();
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save task.");
    }
  }

  if (editing && !existing) {
    return (
      <section className="form-card">
        <h2>Loading task...</h2>
        <p>If the task does not appear, return to the dashboard.</p>
        <Link to="/">Back to Dashboard</Link>
      </section>
    );
  }

  return (
    <section className="form-card">
      <p className="eyebrow">{editing ? "UPDATE YOUR WORK" : "PLAN YOUR WORK"}</p>
      <h1>{editing ? "Edit Task" : "Create a Task"}</h1>
      <p className="muted">Enter the details below.</p>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Task Title *</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Complete project report"
          required
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What needs to be done?"
          rows="4"
        />

        <div className="form-row">
          <div>
            <label>Priority</label>
            <select value={priority}
              onChange={e => setPriority(e.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <label>Due Date</label>
            <input type="date" value={dueDate}
              onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        {editing && (
          <>
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              <option>Pending</option>
              <option>Done</option>
            </select>
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="primary-btn">
            {editing ? "Save Changes" : "Create Task"}
          </button>
          <button type="button" className="secondary-btn"
            onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loadError, setLoadError] = useState("");

  async function refresh() {
    try {
      const response = await axios.get(API);
      setTasks(response.data);
      setLoadError("");
    } catch {
      setLoadError("Cannot connect to the backend. Check that the server is running.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <BrowserRouter>
      {loadError && (
        <div className="error-banner">
          {loadError}
          <button onClick={refresh}>Retry</button>
        </div>
      )}
      <Layout tasks={tasks} refresh={refresh} />
    </BrowserRouter>
  );
}

export default App;
