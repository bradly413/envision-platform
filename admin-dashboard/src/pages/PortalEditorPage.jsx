import { useEffect, useRef, useState } from 'react';
import { ai, clients as clientsApi, portals as portalsApi } from '../lib/api';

const MODEL_OPTIONS = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  ],
  openai: [
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
  ],
  google: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
};

const STYLE_MODES = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'bold', label: 'Bold Campaign' },
  { value: 'minimal', label: 'Minimal Modern' },
];

const OUTPUT_MODES = [
  { value: 'portal', label: 'Portal', hint: 'Immersive scroll reveal with Envision motion presets' },
  { value: 'presentation', label: 'Presentation', hint: 'Reveal.js-style deck with slides, fragments, media, and notes' },
];

const CLIENT_STAGE_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'active', label: 'Active' },
  { value: 'revision', label: 'Revision' },
  { value: 'delivered', label: 'Delivered' },
];

const PORTAL_TEMPLATES = [
  { value: 'brand-reveal-v1', label: 'Brand reveal v1' },
  { value: 'brand-reveal-minimal', label: 'Brand reveal minimal' },
  { value: 'full-identity', label: 'Full identity system' },
];

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'json', 'csv', 'html', 'htm', 'xml', 'svg',
  'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'less', 'yml', 'yaml',
]);

const MODE_INTRO = {
  portal: `Hi! I'm your Envision builder. Tell me about the client, the brand mood, and the type of reveal you want. I can generate high-end portal JSON using Claude, GPT, or Gemini, complete with art direction and curated motion presets.`,
  presentation: `Hi! I'm your Envision presentation director. Tell me about the client, the audience, and the story you want to tell. I can generate reveal.js-ready presentation JSON with themes, slide transitions, fragments, media backgrounds, notes, and cinematic pacing.`,
};

function extractJSON(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) {
    try { return JSON.parse(match[1].trim()); } catch { return null; }
  }
  return null;
}

function normalizeBuilderPayload(outputMode, json) {
  if (!json) return null;

  if (outputMode === 'presentation') {
    if (json.mode === 'presentation' && json.presentation) return json;
    if (json.presentation) return { mode: 'presentation', presentation: json.presentation };
    return { mode: 'presentation', presentation: json };
  }

  if (json.mode === 'portal' && json.portal) return json.portal;
  return json;
}

function getFileExtension(name = '') {
  return name.includes('.') ? name.split('.').pop().toLowerCase() : '';
}

function isTextLikeFile(file) {
  if (file.type.startsWith('text/')) return true;
  if (file.type === 'application/json') return true;
  return TEXT_EXTENSIONS.has(getFileExtension(file.name));
}

function readTextExcerpt(file) {
  return new Promise((resolve) => {
    if (!isTextLikeFile(file)) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      resolve(raw.replace(/\s+/g, ' ').trim().slice(0, 1800));
    };
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

function humanizeFileSize(size = 0) {
  if (!size) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function generatePortalPassword() {
  return Math.random().toString(36).slice(-8);
}

function inferUrlKind(url) {
  const lower = url.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) return 'image';
  if (/\.(mp4|mov|webm|m4v)$/.test(lower)) return 'video';
  if (/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/.test(lower)) return 'document';
  return 'reference';
}

function describeAsset(asset) {
  const lines = [
    `- ${asset.label || asset.name}`,
    `  kind: ${asset.kind}`,
  ];

  if (asset.source === 'url') lines.push(`  url: ${asset.url}`);
  if (asset.mimeType) lines.push(`  mimeType: ${asset.mimeType}`);
  if (asset.sizeLabel) lines.push(`  size: ${asset.sizeLabel}`);
  if (asset.excerpt) lines.push(`  excerpt: ${asset.excerpt}`);

  return lines.join('\n');
}

function buildContextMessage({ client, portal, assets, outputMode }) {
  const lines = [];

  if (client) {
    lines.push(`Selected client: ${client.name}${client.company ? ` — ${client.company}` : ''}`);
    if (client.stage) lines.push(`Pipeline stage: ${client.stage}`);
    if (client.project_type) lines.push(`Project type: ${client.project_type}`);
    if (client.notes) lines.push(`Client notes: ${String(client.notes).slice(0, 500)}`);
  }

  if (portal) {
    lines.push(`Target portal slug: ${portal.slug}`);
    if (portal.template_id) lines.push(`Existing portal template: ${portal.template_id}`);
    lines.push(`Saving into existing ${outputMode} destination for this client.`);
  }

  if (assets.length) {
    lines.push('Attached source material:');
    lines.push(assets.map(describeAsset).join('\n'));
    lines.push('Use the attached material as primary source context when relevant.');
  }

  if (!lines.length) return null;

  return {
    role: 'user',
    content: `Builder context:\n${lines.join('\n')}`,
  };
}

function buildAssetRecord(file, excerpt) {
  const kind = file.type.startsWith('image/')
    ? 'image'
    : file.type.startsWith('video/')
      ? 'video'
      : 'document';

  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    source: 'file',
    name: file.name,
    label: file.name,
    kind,
    mimeType: file.type || 'application/octet-stream',
    sizeLabel: humanizeFileSize(file.size),
    excerpt,
    previewUrl: kind === 'image' || kind === 'video' ? URL.createObjectURL(file) : '',
  };
}

function ControlField({ label, children, hint }) {
  return (
    <div style={{ minWidth: 0 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6, minHeight: 28, lineHeight: 1.4 }}>{hint || ' '}</div>
    </div>
  );
}

function AssetCard({ asset, onRemove }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      padding: 10,
      minWidth: 180,
      maxWidth: 220,
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    }}>
      {asset.kind === 'image' && asset.previewUrl && (
        <img
          src={asset.previewUrl}
          alt={asset.label}
          style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
        />
      )}
      {asset.kind === 'video' && asset.previewUrl && (
        <video
          src={asset.previewUrl}
          style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 8, marginBottom: 8, background: '#111827' }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.label}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{asset.kind} · {asset.sizeLabel || 'external link'}</div>
        </div>
        <button
          onClick={() => onRemove(asset.id)}
          style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      {asset.url && (
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {asset.url}
        </div>
      )}
      {asset.excerpt && (
        <div style={{ fontSize: 11, color: '#4B5563', marginTop: 8, lineHeight: 1.5, maxHeight: 52, overflow: 'hidden' }}>
          {asset.excerpt}
        </div>
      )}
    </div>
  );
}

export default function PortalEditorPage() {
  const [outputMode, setOutputMode] = useState('portal');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: MODE_INTRO.portal }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [portals, setPortals] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPortal, setSelectedPortal] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [extractedJSON, setExtractedJSON] = useState(null);
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState(MODEL_OPTIONS.anthropic[0].value);
  const [styleMode, setStyleMode] = useState('cinematic');
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showCreatePortal, setShowCreatePortal] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [creatingPortal, setCreatingPortal] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [assets, setAssets] = useState([]);
  const [clientForm, setClientForm] = useState({
    name: '',
    company: '',
    email: '',
    stage: 'lead',
  });
  const [portalForm, setPortalForm] = useState({
    password: generatePortalPassword(),
    template_id: 'brand-reveal-v1',
  });
  const [linkForm, setLinkForm] = useState({
    label: '',
    url: '',
  });
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchBuilderData();
  }, []);


  const fetchBuilderData = async () => {
    try {
      const [clientsData, portalsData] = await Promise.all([
        clientsApi.list(),
        portalsApi.list(),
      ]);
      setClients(clientsData || []);
      setPortals(portalsData?.portals || portalsData || []);
    } catch (e) {
      console.error('Failed to fetch builder data', e);
    }
  };

  const selectedClientRecord = clients.find((client) => String(client.id) === String(selectedClient));
  const selectedPortalRecord = portals.find((portal) => String(portal.id) === String(selectedPortal));
  const filteredPortals = selectedClient
    ? portals.filter((portal) => String(portal.client_id) === String(selectedClient))
    : portals;
  const selectedModeMeta = OUTPUT_MODES.find((mode) => mode.value === outputMode);
  const normalizedPreview = extractedJSON ? normalizeBuilderPayload(outputMode, extractedJSON) : null;

  const handleProviderChange = (nextProvider) => {
    setProvider(nextProvider);
    setModel(MODEL_OPTIONS[nextProvider][0].value);
  };

  const handleOutputModeChange = (nextMode) => {
    setOutputMode(nextMode);
    setExtractedJSON(null);
    setMessages([{ role: 'assistant', content: MODE_INTRO[nextMode] }]);
    setSaveMsg('');
  };

  const handleClientChange = (nextClientId) => {
    setSelectedClient(nextClientId);
    setSaveMsg('');
    if (selectedPortal) {
      const portalStillValid = portals.some(
        (portal) => String(portal.id) === String(selectedPortal) && String(portal.client_id) === String(nextClientId)
      );
      if (!portalStillValid) setSelectedPortal('');
    }
  };

  const handlePortalChange = (nextPortalId) => {
    setSelectedPortal(nextPortalId);
    const portal = portals.find((entry) => String(entry.id) === String(nextPortalId));
    if (portal) setSelectedClient(String(portal.client_id));
  };

  const buildRequestMessages = (newMessages) => {
    const context = buildContextMessage({
      client: selectedClientRecord,
      portal: selectedPortalRecord,
      assets,
      outputMode,
    });

    return context ? [context, ...newMessages] : newMessages;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setExtractedJSON(null);

    try {
      const requestMessages = buildRequestMessages(newMessages);
      const data = await ai.generateBuilderContent({
        provider,
        model,
        styleMode,
        outputMode,
        messages: requestMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        maxTokens: outputMode === 'presentation' ? 2000 : 1500,
      });
      const reply = data.reply || 'Sorry, something went wrong.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      const json = extractJSON(reply);
      if (json) setExtractedJSON(json);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error reaching the AI. ${String(e)}` }]);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async () => {
    if (!clientForm.name.trim() || creatingClient) return;
    setCreatingClient(true);
    try {
      const created = await clientsApi.create({
        ...clientForm,
        name: clientForm.name.trim(),
        company: clientForm.company.trim() || null,
        email: clientForm.email.trim() || null,
      });
      const nextClients = [created, ...clients];
      setClients(nextClients);
      setSelectedClient(String(created.id));
      setShowCreateClient(false);
      setClientForm({ name: '', company: '', email: '', stage: 'lead' });
      setSaveMsg('✓ Client created');
    } catch (error) {
      setSaveMsg(`✗ ${String(error || 'Client creation failed')}`);
    } finally {
      setCreatingClient(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const createPortal = async () => {
    if (!selectedClient || creatingPortal) return;
    setCreatingPortal(true);
    setSaveMsg('');
    try {
      const created = await portalsApi.create({
        client_id: selectedClient,
        password: portalForm.password || generatePortalPassword(),
        template_id: portalForm.template_id,
        content: normalizedPreview || {},
      });
      const nextPortals = [created, ...portals];
      setPortals(nextPortals);
      setSelectedPortal(String(created.id));
      setShowCreatePortal(false);
      setPortalForm({ password: generatePortalPassword(), template_id: 'brand-reveal-v1' });
      setSaveMsg('✓ Portal created and selected');
    } catch (error) {
      setSaveMsg(`✗ ${String(error || 'Portal creation failed')}`);
    } finally {
      setCreatingPortal(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const saveToPortal = async () => {
    if (!selectedPortal || !extractedJSON) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const payload = normalizeBuilderPayload(outputMode, extractedJSON);
      await portalsApi.updateContent(selectedPortal, payload);
      setSaveMsg(`✓ Saved ${outputMode === 'presentation' ? 'presentation' : 'portal'} to portal`);
    } catch (error) {
      setSaveMsg(`✗ ${String(error || 'Save failed — check API')}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const nextAssets = await Promise.all(files.map(async (file) => {
      const excerpt = await readTextExcerpt(file);
      return buildAssetRecord(file, excerpt);
    }));

    setAssets((prev) => [...prev, ...nextAssets]);
    event.target.value = '';
  };

  const addLinkAsset = () => {
    if (!linkForm.url.trim()) return;
    const asset = {
      id: `link-${Date.now()}`,
      source: 'url',
      url: linkForm.url.trim(),
      label: linkForm.label.trim() || linkForm.url.trim(),
      name: linkForm.label.trim() || linkForm.url.trim(),
      kind: inferUrlKind(linkForm.url.trim()),
      mimeType: '',
      sizeLabel: '',
      excerpt: '',
      previewUrl: '',
    };
    setAssets((prev) => [asset, ...prev]);
    setLinkForm({ label: '', url: '' });
    setShowLinkForm(false);
  };

  const removeAsset = (assetId) => {
    setAssets((prev) => {
      const target = prev.find((asset) => asset.id === assetId);
      if (target?.previewUrl && target.source === 'file') URL.revokeObjectURL(target.previewUrl);
      return prev.filter((asset) => asset.id !== assetId);
    });
  };

  const renderMessage = (message, i) => {
    const isUser = message.role === 'user';
    return (
      <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
        <div style={{
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? '#111827' : '#fff',
          color: isUser ? '#F9FAFB' : '#111827',
          fontSize: 13,
          lineHeight: 1.6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.content}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: '#F0F2F5' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '18px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Experience Builder</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
              Multi-model builder for immersive portals and cinematic presentations
            </div>
          </div>
          <button
            onClick={() => {
              setMessages([{ role: 'assistant', content: MODE_INTRO[outputMode] }]);
              setExtractedJSON(null);
            }}
            style={{ fontSize: 12, color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
          >
            New chat
          </button>
        </div>

        <div style={{ padding: '14px 24px 8px', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 1.35fr) repeat(4, minmax(150px, 1fr))',
            gap: 12,
            alignItems: 'start',
          }}>
            <ControlField
              label="Client"
              hint={selectedClientRecord ? `${selectedClientRecord.company || selectedClientRecord.name} · ${selectedClientRecord.stage || 'lead'}` : 'Choose a client from your pipeline or create one inline.'}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={selectedClient}
                  onChange={(e) => handleClientChange(e.target.value)}
                  style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB' }}
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}{client.company ? ` — ${client.company}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCreateClient((prev) => !prev)}
                  style={{ padding: '0 12px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#111827', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  + New
                </button>
              </div>
            </ControlField>

            <ControlField label="Output" hint={selectedModeMeta?.hint}>
              <select
                value={outputMode}
                onChange={(e) => handleOutputModeChange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB' }}
              >
                {OUTPUT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </ControlField>

            <ControlField label="Provider" hint="Choose the model family driving the builder.">
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB' }}
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
              </select>
            </ControlField>

            <ControlField label="Model" hint="Switch between flagship and lighter variants for speed.">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB' }}
              >
                {MODEL_OPTIONS[provider].map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </ControlField>

            <ControlField label="Art direction" hint="Sets the tone, pacing, and taste level of the output.">
              <select
                value={styleMode}
                onChange={(e) => setStyleMode(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#F9FAFB' }}
              >
                {STYLE_MODES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </ControlField>
          </div>

          {showCreateClient && (
            <div style={{
              marginTop: 12,
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              padding: 14,
              display: 'grid',
              gridTemplateColumns: '1.1fr 1fr 1fr 150px auto',
              gap: 10,
              alignItems: 'end',
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Client name</label>
                <input
                  value={clientForm.name}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Charter Premier"
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Company</label>
                <input
                  value={clientForm.company}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Client company"
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Email</label>
                <input
                  value={clientForm.email}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="client@company.com"
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Pipeline stage</label>
                <select
                  value={clientForm.stage}
                  onChange={(e) => setClientForm((prev) => ({ ...prev, stage: e.target.value }))}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff' }}
                >
                  {CLIENT_STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={createClient}
                disabled={!clientForm.name.trim() || creatingClient}
                style={{ height: 38, padding: '0 14px', borderRadius: 8, border: 'none', background: !clientForm.name.trim() ? '#E5E7EB' : '#111827', color: !clientForm.name.trim() ? '#9CA3AF' : '#fff', fontSize: 12, fontWeight: 700, cursor: !clientForm.name.trim() ? 'default' : 'pointer' }}
              >
                {creatingClient ? 'Creating...' : 'Create client'}
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', background: '#F7F8FA', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: assets.length || showLinkForm ? 12 : 0 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Source material</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                Add documents, image/video references, or URLs so the builder can work from real inputs.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFilesSelected}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#111827', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Add files
              </button>
              <button
                onClick={() => setShowLinkForm((prev) => !prev)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#111827', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Add link
              </button>
            </div>
          </div>

          {showLinkForm && (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr auto', gap: 10, marginBottom: 12 }}>
              <input
                value={linkForm.label}
                onChange={(e) => setLinkForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Reference label"
                style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff' }}
              />
              <input
                value={linkForm.url}
                onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
                style={{ padding: '9px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff' }}
              />
              <button
                onClick={addLinkAsset}
                disabled={!linkForm.url.trim()}
                style={{ padding: '0 14px', borderRadius: 8, border: 'none', background: !linkForm.url.trim() ? '#E5E7EB' : '#111827', color: !linkForm.url.trim() ? '#9CA3AF' : '#fff', fontSize: 12, fontWeight: 700, cursor: !linkForm.url.trim() ? 'default' : 'pointer' }}
              >
                Attach
              </button>
            </div>
          )}

          {assets.length > 0 && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onRemove={removeAsset} />
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
          {messages.map(renderMessage)}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map((delay) => (
                    <div key={delay} style={{ width: 6, height: 6, borderRadius: '50%', background: '#D1D5DB', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${delay * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={outputMode === 'presentation'
                ? 'Describe the audience, pacing, slide mood, and story arc... (Enter to send)'
                : 'Describe the client, paste existing content, or ask for revisions... (Enter to send)'}
              rows={3}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'none', outline: 'none', lineHeight: 1.5, color: '#111827' }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: loading || !input.trim() ? '#E5E7EB' : '#111827', color: loading || !input.trim() ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: loading || !input.trim() ? 'default' : 'pointer', whiteSpace: 'nowrap' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <div style={{ width: 380, background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Save to Portal</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
            Push generated {outputMode === 'presentation' ? 'deck JSON' : 'portal JSON'} to a live client experience
          </div>
        </div>

        <div style={{ padding: 16, borderBottom: '1px solid #E5E7EB', display: 'grid', gap: 14 }}>
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 8 }}>Client</div>
            {selectedClientRecord ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{selectedClientRecord.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{selectedClientRecord.company || 'No company added'}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>Stage: {selectedClientRecord.stage || 'lead'} · {filteredPortals.length} portal{filteredPortals.length === 1 ? '' : 's'}</div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>Choose a client first so the builder knows which pipeline record and portal destination to work against.</div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280' }}>Target portal</label>
              <button
                onClick={() => setShowCreatePortal((prev) => !prev)}
                disabled={!selectedClient}
                style={{ background: 'none', border: 'none', color: selectedClient ? '#111827' : '#9CA3AF', fontSize: 12, fontWeight: 600, cursor: selectedClient ? 'pointer' : 'default', padding: 0 }}
              >
                + Create portal
              </button>
            </div>
            <select
              value={selectedPortal}
              onChange={(e) => handlePortalChange(e.target.value)}
              disabled={!selectedClient}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, color: '#111827', background: selectedClient ? '#F9FAFB' : '#F3F4F6', outline: 'none' }}
            >
              <option value="">{selectedClient ? 'Select a portal...' : 'Choose a client first...'}</option>
              {filteredPortals.map((portal) => (
                <option key={portal.id} value={portal.id}>
                  {(portal.client_name || portal.slug)} ({portal.slug})
                </option>
              ))}
            </select>
            {selectedClient && filteredPortals.length === 0 && (
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>No portals for this client yet. Create one inline.</div>
            )}
          </div>

          {showCreatePortal && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Portal password</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={portalForm.password}
                    onChange={(e) => setPortalForm((prev) => ({ ...prev, password: e.target.value }))}
                    style={{ flex: 1, padding: '9px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff' }}
                  />
                  <button
                    onClick={() => setPortalForm((prev) => ({ ...prev, password: generatePortalPassword() }))}
                    style={{ padding: '0 10px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', color: '#111827', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', marginBottom: 6 }}>Template</label>
                <select
                  value={portalForm.template_id}
                  onChange={(e) => setPortalForm((prev) => ({ ...prev, template_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, background: '#fff' }}
                >
                  {PORTAL_TEMPLATES.map((template) => (
                    <option key={template.value} value={template.value}>{template.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={createPortal}
                disabled={!selectedClient || creatingPortal}
                style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: !selectedClient ? '#E5E7EB' : '#111827', color: !selectedClient ? '#9CA3AF' : '#fff', fontSize: 12, fontWeight: 700, cursor: !selectedClient ? 'default' : 'pointer' }}
              >
                {creatingPortal ? 'Creating...' : 'Create portal for selected client'}
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {normalizedPreview ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#10B981', marginBottom: 8 }}>✓ Content ready</div>
              <pre style={{ fontSize: 10, color: '#6B7280', background: '#F9FAFB', borderRadius: 8, padding: 12, overflow: 'auto', maxHeight: 460, lineHeight: 1.5 }}>
                {JSON.stringify(normalizedPreview, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#9CA3AF', fontSize: 12, lineHeight: 1.6 }}>
              Ask the AI to generate {outputMode === 'presentation' ? 'a presentation deck' : 'portal content'} and the JSON will appear here, ready to save.
            </div>
          )}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #E5E7EB' }}>
          <button
            onClick={saveToPortal}
            disabled={!extractedJSON || !selectedPortal || saving}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: !extractedJSON || !selectedPortal ? '#E5E7EB' : '#111827', color: !extractedJSON || !selectedPortal ? '#9CA3AF' : '#fff', fontSize: 13, fontWeight: 700, cursor: !extractedJSON || !selectedPortal ? 'default' : 'pointer' }}
          >
            {saving ? 'Saving...' : `Push ${outputMode === 'presentation' ? 'presentation' : 'portal'} →`}
          </button>
          {saveMsg && (
            <div style={{ marginTop: 8, fontSize: 12, textAlign: 'center', color: saveMsg.startsWith('✓') ? '#10B981' : '#EF4444' }}>
              {saveMsg}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  );
}
