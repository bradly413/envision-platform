import { useQuery } from 'react-query';
import { tasks, clients } from '../lib/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const PRIORITY_COLORS = { high: '#EF4444', medium: '#F59E0B', low: '#3B82F6' };

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  const { data: allTasks = [] } = useQuery('tasks', () => tasks.list());
  const { data: allClients = [] } = useQuery('clients', () => clients.list());

  const getClientName = id => allClients.find(c => c.id === id)?.name || null;

  const tasksByDate = allTasks.reduce((acc, t) => {
    if (t.due_date) {
      const d = t.due_date.split('T')[0];
      acc[d] = acc[d] || [];
      acc[d].push(t);
    }
    return acc;
  }, {});

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells = [...Array(firstDay).fill(null), ...Array(daysInMonth).fill(0).map((_, i) => i + 1)];

  const selectedDateStr = selected ? `${year}-${String(month+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}` : null;
  const selectedTasks = selectedDateStr ? (tasksByDate[selectedDateStr] || []) : [];

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Calendar</h1>
        <button onClick={() => navigate('/tasks')} style={{
          padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
          fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
        }}>Manage tasks →</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Calendar grid */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7280', padding: '0 8px' }}>‹</button>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{MONTHS[month]} {year}</div>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6B7280', padding: '0 8px' }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F3F4F6' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em' }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} style={{ minHeight: 80, borderBottom: '1px solid #F9FAFB', borderRight: '1px solid #F9FAFB' }} />;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayTasks = tasksByDate[dateStr] || [];
              const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
              const isSelected = day === selected;
              return (
                <div key={day} onClick={() => setSelected(day === selected ? null : day)} style={{
                  minHeight: 80, padding: '8px 6px', borderBottom: '1px solid #F9FAFB', borderRight: '1px solid #F9FAFB',
                  cursor: dayTasks.length ? 'pointer' : 'default',
                  background: isSelected ? '#F0F9FF' : 'transparent',
                  transition: 'background .1s',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: isToday ? 700 : 400,
                    background: isToday ? '#111827' : 'transparent',
                    color: isToday ? '#fff' : '#374151',
                    marginBottom: 4,
                  }}>{day}</div>
                  {dayTasks.slice(0, 2).map(t => (
                    <div key={t.id} style={{
                      fontSize: 10, padding: '2px 5px', borderRadius: 3, marginBottom: 2,
                      background: PRIORITY_COLORS[t.priority] ? PRIORITY_COLORS[t.priority] + '22' : '#F3F4F6',
                      color: PRIORITY_COLORS[t.priority] || '#6B7280',
                      fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{t.title}</div>
                  ))}
                  {dayTasks.length > 2 && <div style={{ fontSize: 10, color: '#9CA3AF' }}>+{dayTasks.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Upcoming tasks */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 18, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', marginBottom: 12 }}>
              {selected ? `${MONTHS[month]} ${selected}` : 'Upcoming tasks'}
            </div>
            {(selected ? selectedTasks : allTasks.filter(t => t.due_date && t.status !== 'done').slice(0, 8)).length === 0 ? (
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>{selected ? 'No tasks this day' : 'No upcoming tasks'}</div>
            ) : (selected ? selectedTasks : allTasks.filter(t => t.due_date && t.status !== 'done').slice(0, 8)).map(t => (
              <div key={t.id} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #F9FAFB', alignItems: 'flex-start' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] || '#D1D5DB', marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{t.title}</div>
                  {getClientName(t.client_id) && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{getClientName(t.client_id)}</div>}
                  {t.due_date && !selected && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* This month summary */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9CA3AF', marginBottom: 12 }}>This month</div>
            {[
              { label: 'Tasks due', value: Object.entries(tasksByDate).filter(([d]) => d.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).reduce((s, [,ts]) => s + ts.length, 0) },
              { label: 'High priority', value: allTasks.filter(t => t.priority === 'high' && t.status !== 'done').length },
              { label: 'Overdue', value: allTasks.filter(t => t.due_date && new Date(t.due_date) < today && t.status !== 'done').length },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F9FAFB', fontSize: 13 }}>
                <span style={{ color: '#6B7280' }}>{label}</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
