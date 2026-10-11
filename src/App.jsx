
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:8080/api/expenses'

const categories = [
  'Food',
  'Transport',
  'Shopping',
  'Education',
  'Entertainment',
  'Health',
  'Other',
]

function App() {
  const [expenses, setExpenses] = useState([])
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  async function loadExpenses() {
    try {
      setErrorMessage('')
      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Failed to load expenses')
      }

      const data = await response.json()
      setExpenses(data)
    } catch (error) {
      console.error('Could not load expenses:', error)
      setErrorMessage(
        'Could not load expenses. Check that Spring Boot is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  // Calculate totals from all expenses
  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  )

  // Apply search and category filtering
  const filteredExpenses = [...expenses]
    .filter((expense) =>
      expense.title
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase())
    )
    .filter(
      (expense) =>
        filterCategory === 'All' ||
        expense.category === filterCategory
    )
    .reverse()

  function resetForm() {
    setTitle('')
    setAmount('')
    setCategory('Food')
    setDate(new Date().toISOString().split('T')[0])
    setEditingId(null)
    setErrorMessage('')
  }

  function clearFilters() {
    setSearchTerm('')
    setFilterCategory('All')
  }

  function startEditing(expense) {
    setEditingId(expense.id)
    setTitle(expense.title)
    setAmount(String(expense.amount))
    setCategory(expense.category)
    setDate(expense.date)
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveExpense(event) {
    event.preventDefault()

    if (!title.trim() || !amount || Number(amount) <= 0) {
      setErrorMessage('Enter an expense name and a valid amount.')
      return
    }

    const expenseData = {
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
    }

    setSaving(true)
    setErrorMessage('')

    try {
      const isEditing = editingId !== null
      const url = isEditing
        ? `${API_URL}/${editingId}`
        : API_URL

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      })

      if (!response.ok) {
        throw new Error('Failed to save expense')
      }

      const savedExpense =
        response.status === 204 ? null : await response.json()

      if (isEditing) {
        if (savedExpense) {
          setExpenses((previous) =>
            previous.map((item) =>
              item.id === editingId ? savedExpense : item
            )
          )
        } else {
          await loadExpenses()
        }
      } else {
        setExpenses((previous) => [...previous, savedExpense])
      }

      resetForm()
      alert(
        isEditing
          ? 'Expense updated successfully!'
          : 'Expense added successfully!'
      )
    } catch (error) {
      console.error('Could not save expense:', error)
      setErrorMessage(
        'Could not save the expense. Check the backend and try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteExpense(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this expense? This cannot be undone.'
    )

    if (!confirmed) return

    setDeletingId(id)
    setErrorMessage('')

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      setExpenses((previous) =>
        previous.filter((expense) => expense.id !== id)
      )

      if (editingId === id) {
        resetForm()
      }

      alert('Expense deleted successfully!')
    } catch (error) {
      console.error('Could not delete expense:', error)
      setErrorMessage(
        'Could not delete the expense. Check the backend and try again.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  function categoryIcon(value) {
    const icons = {
      Food: '🍽️',
      Transport: '🚌',
      Shopping: '🛍️',
      Education: '📚',
      Entertainment: '🎬',
      Health: '💊',
      Other: '₹',
    }

    return icons[value] || '₹'
  }

  return (
    <main className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">₹</span>
          <span>
            Expense<span className="brand-accent">Track</span>
          </span>
        </div>

        <span className="status">
          <span className="status-dot"></span>
          Personal Finance
        </span>
      </header>

      <section className="welcome">
        <p className="eyebrow">YOUR MONEY, IN CONTROL</p>
        <h1>
          Track your spending.
          <br />
          <span>Own your goals.</span>
        </h1>
        <p className="subtitle">
          A simple space to understand where your money goes.
        </p>
      </section>

      <section className="summary">
        <div className="summary-card">
          <p>Total expenses</p>
          <h2>
            ₹{total.toLocaleString('en-IN', {
              maximumFractionDigits: 2,
            })}
          </h2>
          <span>Expenses recorded in your account</span>
        </div>

        <div className="summary-card">
          <p>Transactions</p>
          <h2>{expenses.length}</h2>
          <span>Recorded expenses</span>
        </div>
      </section>

      <section className="content">
        <form className="expense-form" onSubmit={saveExpense}>
          <h2>
            {editingId !== null ? 'Edit expense' : 'Add an expense'}
          </h2>

          <p className="section-description">
            {editingId !== null
              ? 'Update the details and save your changes.'
              : 'Record a purchase to keep your budget on track.'}
          </p>

          {errorMessage && (
            <p role="alert" style={{ color: '#c62828' }}>
              {errorMessage}
            </p>
          )}

          <label htmlFor="title">Expense name</label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Lunch, bus ticket"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />

          <label htmlFor="amount">Amount (₹)</label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />

          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />

          <button
            className="submit-button"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editingId !== null
                ? 'Save changes'
                : '+ Add expense'}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              style={{ marginTop: '10px' }}
            >
              Cancel editing
            </button>
          )}
        </form>

        <section className="expense-list">
          <div className="list-heading">
            <div>
              <h2>Recent expenses</h2>
              <p className="section-description">
                Search and filter your expenses below.
              </p>
            </div>
            <span className="count-badge">
              {filteredExpenses.length}
            </span>
          </div>

          {/* Search and category filters */}
          <div className="expense-filters">
            <input
              type="search"
              aria-label="Search expenses by name"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              aria-label="Filter expenses by category"
              value={filterCategory}
              onChange={(event) =>
                setFilterCategory(event.target.value)
              }
            >
              <option value="All">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">₹</div>
              <h3>
                {expenses.length === 0
                  ? 'No expenses yet'
                  : 'No matching expenses'}
              </h3>
              <p>
                {expenses.length === 0
                  ? 'Add your first expense using the form above.'
                  : 'Try another search or category, or clear your filters.'}
              </p>
            </div>
          ) : (
            <div className="expense-items">
              {filteredExpenses.map((expense) => (
                <article className="expense-item" key={expense.id}>
                  <div className="expense-category-icon">
                    {categoryIcon(expense.category)}
                  </div>

                  <div className="expense-details">
                    <h3>{expense.title}</h3>
                    <p>
                      {expense.category} · {expense.date}
                    </p>
                  </div>

                  <strong>
                    −₹{Number(expense.amount).toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                    })}
                  </strong>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginLeft: '12px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => startEditing(expense)}
                      aria-label={`Edit ${expense.title}`}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteExpense(expense.id)}
                      disabled={deletingId === expense.id}
                      aria-label={`Delete ${expense.title}`}
                    >
                      {deletingId === expense.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <footer>Built with React, Spring Boot &amp; MySQL</footer>
    </main>
  )
}

export default App
