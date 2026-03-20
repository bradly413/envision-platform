import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { portals } from '../lib/api';

const SECTION_TYPES = {
  hero: { label: 'Hero', color: '#8B5CF6', defaultContent: { headline: '', subheadline: 'meet your new brand.', intro: 'Everything you see here was crafted specifically for you. Scroll to experience your full brand identity.' } },
  brand: { label: 'Brand Strategy', color: '#3B82F6', defaultContent: { headline: 'The story behind the brand.', positioning: '', pillars: [{ title: '', desc: '' }, { title: '', desc: '' }, { title: '', desc: '' }] } },
  logo: { label: 'Logo', color: '#10B981', defaultContent: { headline: 'The mark.', description: '', variations: ['primary', 'reversed', 'icon-only'] } },
  colors: { label: 'Color Palette', color: '#F59E0B', defaultContent: { headline: 'The palette.', palette: [{ name: 'Primary', hex: '#1A1A2E', role: '' }, { name: 'Secondary', hex: '#E8D5B7', role: '' }, { name: 'Accent', hex: '#C9A84C', role: '' }, { name: 'Neutral', hex: '#F4F4F0', role: '' }] } },
  typography: { label: 'Typography', color: '#EF4444', defaultContent: { headline: 'The voice in text.', primaryFont: '', secondaryFont: '', usage: '' } },
  custom: { label: 'Custom Section', color: '#6B7280', defaultContent: { heading: 'New Section', body: '', links: [] } },
};

const inp = { width: '100%', padding: '8px 12px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, color: '#111827', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' };

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>{label}</label>
    {children}
    {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
  </div>
);

const TI = ({ value, onChange, placeholder }) => (
  <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inp}
    onFocus={e => e.target.style.borderColor = '#111827'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
);

const TA = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
    onFocus={e => e.target.style.borderColor = '#111827'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
);

function HeroEditor({ content, onChange }) {
  return (
    <>
      <Field label="Headline" hint="Client name is prepended automatically — leave blank to just use their name">
        <TI value={content.headline} onChange={v => onChange({ ...content, headline: v })} placeholder="Leave blank → 'Acme,'" />
      </Field>
      <Field label="Subheadline">
        <TI value={content.subheadline} onChange={v => onChange({ ...content, subheadline: v })} placeholder="meet your new brand." />
      </Field>
      <Field label="Intro paragraph">
        <TA value={content.intro} onChange={v => onChange({ ...content, intro: v })} placeholder="Everything you see here was crafted specifically for you..." rows={4} />
      </Field>
    </>
  );
}

function BrandEditor({ content, onChange }) {
  const updatePillar = (i, field, val) => { const p = [...(content.pillars || [])]; p[i] = { ...p[i], [field]: val }; onChange({ ...content, pillars: p }); };
  const addPillar = () => onChange({ ...content, pillars: [...(content.pillars || []), { title: '', desc: '' }] });
  const removePillar = i => onChange({ ...content, pillars: content.pillars.filter((_, idx) => idx !== i) });
  return (
    <>
      <Field label="Section headline"><TI value={content.headline} onChange={v => onChange({ ...content, headline: v })} placeholder="The story behind the brand." /></Field>
      <Field label="Positioning statement"><TA value={content.positioning} onChange={v => onChange({ ...content, positioning: v })} placeholder="What makes this brand distinct..." rows={4} /></Field>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>Brand pillars</div>
        {(content.pillars || []).map((p, i) => (
          <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pillar {i + 1}</span>
              <button onClick={() => removePillar(i)} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Remove</button>
            </div>
            <TI value={p.title} onChange={v => updatePillar(i, 'title', v)} placeholder="Pillar title" />
            <div style={{ marginTop: 8 }}><TI value={p.desc} onChange={v => updatePillar(i, 'desc', v)} placeholder="Short description" /></div>
          </div>
        ))}
        <button onClick={addPillar} style={{ fontSize: 12, color: '#6B7280', background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', width: '100%' }}>+ Add pillar</button>
      </div>
    </>
  );
}

function LogoEditor({ content, onChange }) {
  return (
    <>
      <Field label="Section headline"><TI value={content.headline} onChange={v => onChange({ ...content, headline: v })} placeholder="The mark." /></Field>
      <Field label="Logo description / rationale"><TA value={content.description} onChange={v => onChange({ ...content, description: v })} placeholder="The thinking behind the logo..." rows={4} /></Field>
      <Field label="Variations shown" hint="Comma-separated (e.g. primary, reversed, icon-only)">
        <TI value={(content.variations || []).join(', ')} onChange={v => onChange({ ...content, variations: v.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="primary, reversed, icon-only" />
      </Field>
    </>
  );
}

function ColorsEditor({ content, onChange }) {
  const updateColor = (i, field, val) => { const p = [...(content.palette || [])]; p[i] = { ...p[i], [field]: val }; onChange({ ...content, palette: p }); };
  const addColor = () => onChange({ ...content, palette: [...(content.palette || []), { name: '', hex: '#000000', role: '' }] });
  const removeColor = i => onChange({ ...content, palette: content.palette.filter((_, idx) => idx !== i) });
  return (
    <>
      <Field label="Section headline"><TI value={content.headline} onChange={v => onChange({ ...content, headline: v })} placeholder="The palette." /></Field>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>Colors</div>
        {(content.palette || []).map((c, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input type="color" value={c.hex || '#000000'} onChange={e => updateColor(i, 'hex', e.target.value)} style={{ width: 40, height: 36, border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', padding: 2, background: 'none' }} />
            <TI value={c.name} onChange={v => updateColor(i, 'name', v)} placeholder="Name" />
            <TI value={c.role} onChange={v => updateColor(i, 'role', v)} placeholder="Role / usage" />
            <button onClick={() => removeColor(i)} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        <button onClick={addColor} style={{ fontSize: 12, color: '#6B7280', background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', width: '100%' }}>+ Add color</button>
      </div>
    </>
  );
}

function TypographyEditor({ content, onChange }) {
  return (
    <>
      <Field label="Section headline"><TI value={content.headline} onChange={v => onChange({ ...content, headline: v })} placeholder="The voice in text." /></Field>
      <Field label="Primary typeface" hint="e.g. Playfair Display, Helvetica Neue"><TI value={content.primaryFont} onChange={v => onChange({ ...content, primaryFont: v })} placeholder="Primary typeface" /></Field>
      <Field label="Secondary typeface"><TI value={content.secondaryFont} onChange={v => onChange({ ...content, secondaryFont: v })} placeholder="Secondary typeface" /></Field>
      <Field label="Usage notes"><TA value={content.usage} onChange={v => onChange({ ...content, usage: v })} placeholder="How each typeface should be used..." rows={3} /></Field>
    </>
  );
}

function CustomEditor({ content, onChange }) {
  const addLink = () => onChange({ ...content, links: [...(content.links || []), { label: '', url: '' }] });
  const updateLink = (i, field, val) => { const links = [...(content.links || [])]; links[i] = { ...links[i], [field]: val }; onChange({ ...content, links }); };
  const removeLink = i => onChange({ ...content, links: content.links.filter((_, idx) => idx !== i) });
  return (
    <>
      <Field label="Section heading"><TI value={content.heading} onChange={v => onChange({ ...content, heading: v })} placeholder="Section title" /></Field>
      <Field label="Body text"><TA value={content.body} onChange={v => onChange({ ...content, body: v })} placeholder="Content for this section..." rows={5} /></Field>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 10 }}>Links</div>
        {(content.links || []).map((link, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
            <TI value={link.label} onChange={v => updateLink(i, 'label', v)} placeholder="Label" />
            <TI value={link.url} onChange={v => updateLink(i, 'url', v)} placeholder="https://..." />
            <button onClick={() => removeLink(i)} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        <button onClick={addLink} style={{ fontSize: 12, color: '#6B7280', background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', width: '100%' }}>+ Add link</button>
      </div>
    </>
  );
}

const EDITORS = { hero: HeroEditor, brand: BrandEditor, logo: LogoEditor, colors: ColorsEditor, typography: TypographyEditor, custom: CustomEditor };

function LivePreview({ sections, clientName }) {
  const visible = sections.filter(s => s.enabled);
  return (
    <div style={{ background: '#0F0F0F', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1A1A1A', padding: '10px 14px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 5 }}>{['#FF5F57','#FFBD2E','#28C840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}</div>
        <div style={{ flex: 1, background: '#111', borderRadius: 4, padding: '3px 10px', fontSize: 10, color: '#4B5563', fontFamily: 'monospace' }}>portal.bradlyrobert.com/{(clientName || '').toLowerCase().replace(/\s+/g,'-')}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 32px' }}>
        {visible.length === 0
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#374151', fontSize: 13 }}>Enable sections to preview</div>
          : visible.map(s => {
              const def = SECTION_TYPES[s.type] || SECTION_TYPES.custom;
              const c = s.content || {};
              return (
                <div key={s.id} style={{ padding: '24px 20px', borderBottom: '1px solid #1A1A1A' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: def.color, marginBottom: 8 }}>{def.label}</div>
                  {s.type === 'hero' && <><div style={{ fontSize: 20, fontWeight: 800, color: '#F9FAFB', lineHeight: 1.2, marginBottom: 6 }}>{c.headline || clientName},<br /><span style={{ color: '#9CA3AF' }}>{c.subheadline || 'meet your new brand.'}</span></div>{c.intro && <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{c.intro}</p>}</>}
                  {s.type === 'brand' && <><div style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB', marginBottom: 6 }}>{c.headline || 'The story behind the brand.'}</div>{c.positioning && <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.7, margin: '0 0 10px' }}>{c.positioning}</p>}{(c.pillars || []).map((p, i) => <div key={i} style={{ borderLeft: '2px solid #374151', paddingLeft: 8, marginBottom: 5 }}><div style={{ fontSize: 11, fontWeight: 700, color: '#F9FAFB' }}>{p.title}</div><div style={{ fontSize: 10, color: '#6B7280' }}>{p.desc}</div></div>)}</>}
                  {s.type === 'colors' && <><div style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB', marginBottom: 10 }}>{c.headline || 'The palette.'}</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(c.palette || []).map((color, i) => <div key={i} style={{ width: 46 }}><div style={{ height: 32, borderRadius: 5, background: color.hex, marginBottom: 3, border: '1px solid rgba(255,255,255,.06)' }} /><div style={{ fontSize: 9, fontWeight: 700, color: '#F9FAFB' }}>{color.name}</div><div style={{ fontSize: 8, color: '#6B7280', fontFamily: 'monospace' }}>{color.hex}</div></div>)}</div></>}
                  {s.type === 'typography' && <><div style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB', marginBottom: 6 }}>{c.headline || 'The voice in text.'}</div>{c.primaryFont && <div style={{ fontSize: 18, fontWeight: 800, color: '#F9FAFB', marginBottom: 2 }}>{c.primaryFont}</div>}{c.secondaryFont && <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>{c.secondaryFont}</div>}{c.usage && <p style={{ fontSize: 11, color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{c.usage}</p>}</>}
                  {s.type === 'logo' && <><div style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB', marginBottom: 6 }}>{c.headline || 'The mark.'}</div>{c.description && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 8px', lineHeight: 1.7 }}>{c.description}</p>}<div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{(c.variations || []).map((v, i) => <span key={i} style={{ fontSize: 9, background: '#1A1A1A', color: '#6B7280', borderRadius: 20, padding: '2px 7px' }}>{v}</span>)}</div></>}
                  {s.type === 'custom' && <><div style={{ fontSize: 15, fontWeight: 800, color: '#F9FAFB', marginBottom: 6 }}>{c.heading || 'Custom Section'}</div>{c.body && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 8px', lineHeight: 1.7 }}>{c.body}</p>}</>}
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

function AddSectionModal({ onAdd, onClose, existingTypes }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Add section</div>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Choose what to add to this portal</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {Object.entries(SECTION_TYPES).map(([type, def]) => {
            const exists = type !== 'custom' && existingTypes.includes(type);
            return (
              <button key={type} disabled={exists} onClick={() => { onAdd(type); onClose(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, cursor: exists ? 'not-allowed' : 'pointer', opacity: exists ? .45 : 1, textAlign: 'left' }}
                onMouseOver={e => !exists && (e.currentTarget.style.background = '#F9FAFB')}
                onMouseOut={e => !exists && (e.currentTarget.style.background = '#fff')}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: def.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{def.label}</div>
                  {exists && <div style={{ fontSize: 11, color: '#9CA3AF' }}>Already added</div>}
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={onClose} style={{ marginTop: 16, width: '100%', padding: '9px', background: '#F3F4F6', border: 'none', borderRadius: 8, color: '#6B7280', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
      </div>
    </div>
  );
}

export default function PortalEditorPage() {
  const { portalId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: portalDirect } = useQuery(['portal', portalId], () => portals.get(portalId), { retry: false });
  const { data: allPortals = [] } = useQuery('portals', portals.list, { enabled: !portalDirect });
  const portal = portalDirect || allPortals.find(p => String(p.id) === String(portalId));

  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!portal) return;
    const content = portal.content || {};
    if (content.sections?.length > 0) {
      setSections(content.sections);
    } else {
      setSections(['hero', 'brand', 'logo', 'colors', 'typography'].map((type, i) => ({
        id: `section-${type}`, type, enabled: true, order: i,
        content: content[type] || { ...SECTION_TYPES[type].defaultContent },
      })));
    }
    setActiveSection(null);
    setDirty(false);
  }, [portal?.id]);

  const saveMutation = useMutation(data => portals.update(portalId, data), {
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => { setSaveStatus('saved'); setDirty(false); qc.invalidateQueries('portals'); qc.invalidateQueries(['portal', portalId]); setTimeout(() => setSaveStatus('idle'), 2500); },
    onError: () => { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); },
  });

  const handleSave = () => {
    const contentMap = {};
    sections.forEach(s => { if (s.type !== 'custom') contentMap[s.type] = s.content; });
    saveMutation.mutate({ content: { ...contentMap, sections } });
  };

  const updateContent = useCallback((id, newContent) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
    setDirty(true);
  }, []);

  const toggleSection = id => { setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)); setDirty(true); };
  const moveSection = (id, dir) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev]; [arr[idx], arr[next]] = [arr[next], arr[idx]]; return arr;
    });
    setDirty(true);
  };
  const addSection = type => {
    const s = { id: `section-${type}-${Date.now()}`, type, enabled: true, order: sections.length, content: { ...SECTION_TYPES[type].defaultContent } };
    setSections(prev => [...prev, s]); setActiveSection(s.id); setDirty(true);
  };
  const removeSection = id => { setSections(prev => prev.filter(s => s.id !== id)); if (activeSection === id) setActiveSection(null); setDirty(true); };

  if (!portal) return <div style={{ padding: 40, fontSize: 14, color: '#6B7280' }}>Loading portal…</div>;

  const activeSec = sections.find(s => s.id === activeSection);
  const ActiveEditor = activeSec ? EDITORS[activeSec.type] : null;
  const saveBg = saveStatus === 'saved' ? '#10B981' : saveStatus === 'error' ? '#EF4444' : '#111827';
  const saveLabel = { idle: 'Save', saving: 'Saving…', saved: 'Saved ✓', error: 'Error' }[saveStatus];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F0F2F5', fontFamily: 'Inter, sans-serif' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <button onClick={() => navigate('/portals')} style={{ fontSize: 13, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Portals</button>
        <div style={{ width: 1, height: 16, background: '#E5E7EB' }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{portal.client_name}</span>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>Portal content</span>
        <div style={{ flex: 1 }} />
        {dirty && <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>Unsaved changes</span>}
        <button onClick={() => setShowPreview(p => !p)} style={{ fontSize: 13, fontWeight: 600, padding: '7px 14px', background: showPreview ? '#F3F4F6' : '#fff', border: '1px solid #E5E7EB', borderRadius: 8, color: '#374151', cursor: 'pointer' }}>
          {showPreview ? 'Hide preview' : 'Preview'}
        </button>
        <button onClick={handleSave} disabled={saveStatus === 'saving'} style={{ fontSize: 13, fontWeight: 700, padding: '8px 20px', background: saveBg, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'background .2s' }}>
          {saveLabel}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: showPreview ? '240px 1fr 1fr' : '240px 1fr', overflow: 'hidden' }}>

        {/* Section list */}
        <div style={{ background: '#fff', borderRight: '1px solid #E5E7EB', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9CA3AF' }}>Sections</div>
          {sections.map((section, idx) => {
            const def = SECTION_TYPES[section.type] || SECTION_TYPES.custom;
            const isActive = section.id === activeSection;
            return (
              <div key={section.id} onClick={() => setActiveSection(isActive ? null : section.id)}
                style={{ margin: '2px 8px', borderRadius: 8, padding: '10px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: isActive ? '#F3F4F6' : 'transparent', borderLeft: `3px solid ${isActive ? def.color : 'transparent'}`, transition: 'all .1s' }}
                onMouseOver={e => !isActive && (e.currentTarget.style.background = '#F9FAFB')}
                onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: section.enabled ? def.color : '#D1D5DB', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 700 : 500, color: section.enabled ? '#111827' : '#9CA3AF' }}>{def.label}</span>
                {isActive && (
                  <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => moveSection(section.id, -1)} disabled={idx === 0} style={{ fontSize: 12, padding: '1px 5px', background: 'none', border: 'none', color: '#9CA3AF', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? .4 : 1 }}>↑</button>
                    <button onClick={() => moveSection(section.id, 1)} disabled={idx === sections.length - 1} style={{ fontSize: 12, padding: '1px 5px', background: 'none', border: 'none', color: '#9CA3AF', cursor: idx === sections.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === sections.length - 1 ? .4 : 1 }}>↓</button>
                    <button onClick={() => toggleSection(section.id)} style={{ fontSize: 11, padding: '1px 5px', background: 'none', border: 'none', color: section.enabled ? '#10B981' : '#9CA3AF', cursor: 'pointer' }} title={section.enabled ? 'Hide' : 'Show'}>{section.enabled ? '●' : '○'}</button>
                    {section.type === 'custom' && <button onClick={() => removeSection(section.id)} style={{ fontSize: 11, padding: '1px 4px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>✕</button>}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ padding: '8px 8px 16px', marginTop: 'auto' }}>
            <button onClick={() => setShowAddModal(true)} style={{ width: '100%', padding: '9px 12px', background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: 8, color: '#9CA3AF', fontSize: 12, cursor: 'pointer' }}>
              + Add section
            </button>
          </div>
        </div>

        {/* Editor panel */}
        <div style={{ overflowY: 'auto', background: '#F0F2F5' }}>
          {activeSec && ActiveEditor ? (
            <div style={{ padding: 28, maxWidth: 580 }}>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '18px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: (SECTION_TYPES[activeSec.type] || SECTION_TYPES.custom).color }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{(SECTION_TYPES[activeSec.type] || SECTION_TYPES.custom).label}</div>
                  <div style={{ fontSize: 11, color: activeSec.enabled ? '#10B981' : '#9CA3AF', marginTop: 2, fontWeight: 600 }}>{activeSec.enabled ? '● Visible to client' : '○ Hidden'}</div>
                </div>
                <button onClick={() => toggleSection(activeSec.id)} style={{ fontSize: 12, fontWeight: 600, padding: '6px 14px', background: activeSec.enabled ? '#ECFDF5' : '#F3F4F6', border: `1px solid ${activeSec.enabled ? '#6EE7B7' : '#E5E7EB'}`, borderRadius: 7, color: activeSec.enabled ? '#059669' : '#6B7280', cursor: 'pointer' }}>
                  {activeSec.enabled ? 'Visible' : 'Hidden'}
                </button>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '20px 20px 4px' }}>
                <ActiveEditor content={activeSec.content} onChange={c => updateContent(activeSec.id, c)} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9CA3AF', gap: 10 }}>
              <div style={{ fontSize: 32 }}>◈</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>Select a section to edit</div>
              <div style={{ fontSize: 12 }}>Choose from the sidebar on the left</div>
            </div>
          )}
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div style={{ borderLeft: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', background: '#111', borderBottom: '1px solid #1E1E1E', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4B5563', flexShrink: 0 }}>Live preview</div>
            <div style={{ flex: 1, overflow: 'hidden' }}><LivePreview sections={sections} clientName={portal.client_name} /></div>
          </div>
        )}
      </div>

      {showAddModal && <AddSectionModal existingTypes={sections.map(s => s.type)} onAdd={addSection} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
