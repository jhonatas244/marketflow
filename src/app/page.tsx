
'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

type Product = {
  id: string;
  name: string;
  category: string;
  store: string;
  price: number | null;
  affiliate_url: string | null;
  status: string;
  created_at: string;
};

type Content = {
  id: string;
  title: string;
  platform: string;
  status: string;
  caption: string | null;
  created_at: string;
  scheduled_at: string | null;
};
type GeneratedContent = {
  titulo: string;
  gancho: string;
  roteiro: string;
  legenda: string;
  cta: string;
  hashtags: string;
  aviso_afiliado: string;
};

const money = (n: number | null) =>
  n == null
    ? '—'
    : n.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });

export default function Home() {
  const [tab, setTab] = useState('Visão geral');
  const [products, setProducts] = useState<Product[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [contentFilter, setContentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Tecnologia');
  const [store, setStore] = useState('Shopee');
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');

  const [selectedProduct, setSelectedProduct] = useState('');
  const [platform, setPlatform] = useState('Instagram Reels');
  const [details, setDetails] = useState('');
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savingContent, setSavingContent] = useState(false);

  const ready = !!supabase;

  async function load() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('content_queue').select('*').order('created_at', { ascending: false }),
    ]);

    if (p.error || c.error) {
      setError(p.error?.message || c.error?.message || 'Falha ao carregar');
    } else {
      setProducts(p.data || []);
      setContents(c.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;

    setError('');

    const { error } = await supabase.from('products').insert({
      name,
      category,
      store,
      price: price ? Number(price) : null,
      affiliate_url: url || null,
      status: 'research',
    });

    if (error) {
      setError(error.message);
    } else {
      setName('');
      setPrice('');
      setUrl('');
      await load();
    }
  }

  async function generateContent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const product = products.find((p) => p.id === selectedProduct);

    if (!product) {
      setError('Selecione um produto cadastrado primeiro.');
      return;
    }

    setGenerating(true);
    setError('');
    setGenerated(null);

    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: product.name,
          category: product.category,
          store: product.store,
          price: product.price,
          details,
          platform,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível gerar o conteúdo.');
      }

     if (
  !data.titulo ||
  !data.gancho ||
  !data.roteiro ||
  !data.legenda ||
  !data.cta ||
  !data.hashtags ||
  !data.aviso_afiliado
) {
  throw new Error('A IA retornou um conteúdo incompleto. Tente novamente.');
}

      setGenerated(data as GeneratedContent);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao conectar com a inteligência artificial.'
      );
    } finally {
      setGenerating(false);
    }
  }

  async function sendToApproval() {
    if (!supabase || !generated) return;

    setSavingContent(true);
    setError('');

    const fullCaption = [
      generated.roteiro,
      generated.legenda,
      generated.aviso_afiliado,
    ].filter(Boolean).join('\n\n');

    const { error } = await supabase.from('content_queue').insert({
      title: generated.titulo,
      platform,
      caption: fullCaption,
      status: 'pending_approval',
    });

    if (error) {
      setError(error.message);
    } else {
      setGenerated(null);
      setDetails('');
      setTab('Publicações');
      await load();
    }

    setSavingContent(false);
  }

  async function changeStatus(id: string, status: string) {
    if (!supabase) return;

    const { error } = await supabase
      .from('content_queue')
      .update({ status })
      .eq('id', id);

    if (error) setError(error.message);
    else await load();
  }

  const pending = contents.filter(
    (c) => c.status === 'pending_approval'
  ).length;

  const nav = [
    ['Visão geral', '▦'],
    ['Produtos', '◇'],
    ['Estúdio IA', '✧'],
    ['Publicações', '▣'],
    ['Afiliados', '↗'],
    ['Resultados', '⌁'],
  ];

  return (
    <main className="shell">
      <header className="top">
        <div>
          <div className="brand">MARKET<span>FLOW</span></div>
          <div className="sub">Affiliate Intelligence Platform</div>
        </div>
        <span className="pill">
          ● {ready ? 'Conexão configurada' : 'Modo de configuração'}
        </span>
      </header>

      <div className="layout">
        <aside className="side">
          {nav.map(([n, ic]) => (
            <button
              key={n}
              className={'nav ' + (tab === n ? 'active' : '')}
              onClick={() => setTab(n)}
            >
              {ic} &nbsp;{n}
            </button>
          ))}
        </aside>

        <section className="content">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h1>{tab}</h1>
              <div className="sub">
                Gerencie sua operação de afiliados em um só lugar.
              </div>
            </div>
          </div>

          {!ready && (
            <div className="notice" style={{ marginTop: 18 }}>
              Configure o Supabase em <b>.env.local</b> e execute o SQL de
              <b> supabase/schema.sql</b> para ativar a persistência.
            </div>
          )}

          {error && (
            <div className="notice" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}

          {tab === 'Visão geral' && (
            <>
              <div className="stats">
                {[
                  [products.length, 'Produtos cadastrados'],
                  [contents.length, 'Conteúdos criados'],
                  [pending, 'Aguardando aprovação'],
                  [
                    contents.filter((c) => c.status === 'published').length,
                    'Publicados',
                  ],
                ].map(([v, l]) => (
                  <div className="stat" key={String(l)}>
                    <small>{l}</small>
                    <div className="num">{loading ? '…' : v}</div>
                  </div>
                ))}
              </div>

              <div className="panel">
                <div className="panelhead">
                  <h2>Fluxo da MARKETFLOW</h2>
                  <span className="tag">Aprovação manual</span>
                </div>
                <p className="muted">
                  1. Cadastrar produto → 2. Gerar conteúdo com IA →
                  3. Revisar e aprovar → 4. Publicar por integração autorizada →
                  5. Medir resultados.
                </p>
                <div className="notice">
                  A publicação real nas redes será adicionada depois das
                  integrações oficiais.
                </div>
              </div>
            </>
          )}

          {tab === 'Produtos' && (
            <>
              <div className="panel">
                <div className="panelhead">
                  <h2>Cadastrar produto</h2>
                </div>

                <form onSubmit={addProduct}>
                  <div className="field">
                    <label>Nome do produto</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex.: Fone Bluetooth..."
                    />
                  </div>

                  <div className="row">
                    <div className="field">
                      <label>Categoria</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {['Tecnologia', 'Casa', 'Beleza', 'Moda', 'Games', 'Esporte', 'Outros'].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label>Loja</label>
                      <select
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                      >
                        {['Shopee', 'Mercado Livre', 'Amazon', 'Outra'].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="field">
                      <label>Preço (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="99,90"
                      />
                    </div>

                    <div className="field">
                      <label>Link de afiliado</label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <button className="btn" disabled={!ready}>
                    Salvar produto
                  </button>
                </form>
              </div>

              <div className="panel">
                <div className="panelhead">
                  <h2>Produtos cadastrados</h2>
                </div>

                <div className="tablewrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Categoria</th>
                        <th>Loja</th>
                        <th>Preço</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>{p.category}</td>
                          <td>{p.store}</td>
                          <td>{money(p.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!products.length && (
                    <div className="empty">Nenhum produto cadastrado.</div>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'Estúdio IA' && (
            <>
              <div className="panel">
                <div className="panelhead">
                  <h2>Estúdio de criação com IA</h2>
                  <span className="tag">OpenAI</span>
                </div>

                <p className="muted">
                  Escolha um produto e gere um roteiro, título e legenda
                  para sua divulgação.
                </p>

                <form onSubmit={generateContent}>
                  <div className="field">
                    <label>Produto cadastrado</label>
                    <select
                      required
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                    >
                      <option value="">Selecione um produto</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.store}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Canal de publicação</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                    >
                      {[
                        'Instagram Reels',
                        'TikTok',
                        'YouTube Shorts',
                        'Facebook',
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Informações adicionais (opcional)</label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Descreva características confirmadas do produto..."
                    />
                  </div>

                  <button
                    className="btn"
                    type="submit"
                    disabled={generating || !ready || products.length === 0}
                  >
                    {generating ? 'Gerando conteúdo...' : '✧ Gerar conteúdo com IA'}
                  </button>

                  {!products.length && (
                    <p className="muted">
                      Cadastre pelo menos um produto antes de gerar conteúdo.
                    </p>
                  )}
                </form>
              </div>

              {generated && (
                <div className="panel">
                  <div className="panelhead">
                    <h2>Conteúdo gerado</h2>
                    <span className="tag pending">Aguardando sua revisão</span>
                  </div>

                  <div className="field">
                    <label>Título</label>
                    <textarea
                      value={generated.titulo}
                      onChange={(e) =>
                        setGenerated({ ...generated, titulo: e.target.value })
                      }
                    />
                  </div>

<div className="field">
  <label>Gancho inicial</label>
  <textarea
    value={generated.gancho}
    onChange={(e) =>
      setGenerated({ ...generated, gancho: e.target.value })
    }
  />
</div>
                  <div className="field">
                    <label>Roteiro do vídeo</label>
                    <textarea
                      value={generated.roteiro}
                      onChange={(e) =>
                        setGenerated({ ...generated, roteiro: e.target.value })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>Legenda</label>
                    <textarea
                      value={generated.legenda}
                      onChange={(e) =>
                        setGenerated({ ...generated, legenda: e.target.value })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>Aviso de afiliado</label>
                    <textarea
                      value={generated.aviso_afiliado}
                      onChange={(e) =>
                        setGenerated({
                          ...generated,
                          aviso_afiliado: e.target.value,
                        })
                      }
                    />
                  </div>

<div className="field">
  <label>Chamada para ação (CTA)</label>
  <textarea
    value={generated.cta}
    onChange={(e) =>
      setGenerated({ ...generated, cta: e.target.value })
    }
  />
</div>
                <div className="field">
  <label>Hashtags</label>
  <textarea
    value={generated.hashtags}
    onChange={(e) =>
      setGenerated({ ...generated, hashtags: e.target.value })
    }
  />
</div>  
<button
                    className="btn"
                    onClick={sendToApproval}
                    disabled={savingContent || !ready}
                  >
                    {savingContent
                      ? 'Enviando...'
                      : 'Enviar para fila de aprovação'}
                  </button>

                  <button
                    className="btn danger"
                    style={{ marginTop: 10 }}
                    onClick={() => setGenerated(null)}
                  >
                    Descartar conteúdo
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'Publicações' && (
            <>
              <div className="panel">
                <div className="panelhead">
                  <h2>Novo conteúdo</h2>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!supabase) return;

                    const form = e.currentTarget;
                  const formData = new FormData(form);
const newTitle = String(formData.get('title') || '');
const newPlatform = String(formData.get('platform') || '');
const newCaption = String(formData.get('caption') || '');

const scheduledDate = String(formData.get('scheduled_date') || '');
const scheduledTime = String(formData.get('scheduled_time') || '');

let scheduledAt: string | null = null;

if (scheduledDate && scheduledTime) {
  const date = new Date(`${scheduledDate}T${scheduledTime}:00`);

  if (Number.isNaN(date.getTime())) {
    setError('Data ou horário inválido.');
    return;
  }

  scheduledAt = date.toISOString();
} else if (scheduledDate || scheduledTime) {
  setError('Preencha a data e o horário da publicação.');
  return;
}

const { error } = await supabase.from('content_queue').insert({
  title: newTitle,
  platform: newPlatform,
  caption: newCaption,
  status: 'pending_approval',
  scheduled_at: scheduledAt,
  publication_status: 'not_scheduled',
});

if (error) setError(error.message);
else {
  form.reset();
  await load();
                    }
                  }}
                >
                  <div className="field">
                    <label>Título</label>
                    <input
                      name="title"
                      required
                      placeholder="Ex.: 3 achadinhos para sua casa"
                    />
                  </div>

                  <div className="field">
                    <label>Canal</label>
                    <select name="platform" defaultValue="Instagram Reels">
                      {['Instagram Reels', 'TikTok', 'YouTube Shorts', 'Facebook'].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Legenda / roteiro</label>
                    <textarea
                      name="caption"
                      placeholder="Adicione o texto para revisão..."
                    />
                  </div>

                  <div className="field">
  <label>Data da publicação</label>
  <input
    type="date"
    name="scheduled_date"
  />
</div>

<div className="field">
  <label>Horário da publicação</label>
  <input
    type="time"
    name="scheduled_time"
  />
</div>
                  <button className="btn" disabled={!ready}>
                    Enviar para aprovação
                  </button>
                </form>
              </div>

              <div className="panel">
                <div className="panelhead">
                  <h2>Fila de aprovação</h2>
                  <span className="tag pending">{pending} pendentes</span>
                </div>
<div style={{
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  marginBottom: '16px',
}}>
  <span className="tag pending">
    {contents.filter((c) => c.status === 'pending_approval').length} pendentes
  </span>

  <span className="tag approved">
    {contents.filter((c) => c.status === 'approved').length} aprovados
  </span>

  <span className="tag approved">
    {contents.filter((c) => c.status === 'approved' && c.scheduled_at).length} agendados
  </span>
</div>
<div className="actions" style={{ marginBottom: '16px' }}>
  <button className="btn" onClick={() => setContentFilter('all')}>
    Todos
  </button>

  <button className="btn" onClick={() => setContentFilter('pending')}>
    Pendentes
  </button>

  <button className="btn" onClick={() => setContentFilter('approved')}>
    Aprovados
  </button>

  <button className="btn" onClick={() => setContentFilter('scheduled')}>
    Agendados
  </button>
</div>
                {contents
  .filter((c) => {
    if (contentFilter === 'pending') {
      return c.status === 'pending_approval';
    }

    if (contentFilter === 'approved') {
      return c.status === 'approved';
    }

    if (contentFilter === 'scheduled') {
      return c.status === 'approved' && Boolean(c.scheduled_at);
    }

    return true;
  })
  .map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '13px 0',
                      borderBottom: '1px solid #202c40',
                    }}
                  >
                    <b>{c.title}</b>
<div style={{ marginTop: 8 }}>
  {c.status === 'pending_approval' ? (
    <span className="tag pending">Pendente</span>
  ) : c.status === 'approved' && c.scheduled_at ? (
    <span className="tag approved">Agendado</span>
  ) : c.status === 'approved' ? (
    <span className="tag approved">Aprovado</span>
  ) : (
    <span className="tag">{c.status}</span>
  )}
</div>
{c.scheduled_at && (
  <div className="sub">
    Agendado para:{' '}
    {new Date(c.scheduled_at).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })}
  </div>
)}

<div className="sub">
  {c.platform} ·{' '}
                      <span
                        className={
                          'tag ' +
                          (c.status === 'approved' ? 'approved' : 'pending')
                        }
                      >
                        {c.status}
                      </span>
                    </div>

                    {c.caption && <p className="muted">{c.caption}</p>}

                    {c.status === 'pending_approval' && (
                      <div className="actions">
                        <button
                          className="btn"
                          onClick={() => changeStatus(c.id, 'approved')}
                        >
                          Aprovar
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => changeStatus(c.id, 'rejected')}
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {!contents.length && (
                  <div className="empty">Nenhum conteúdo na fila.</div>
                )}
              </div>
            </>
          )}

          {tab === 'Afiliados' && (
            <div className="panel">
              <h2>Programas de afiliados</h2>
              <p className="muted">
                Cadastre e acompanhe suas contas e links aprovados.
                As integrações oficiais serão habilitadas depois de obter
                acesso às APIs e permissões de cada programa.
              </p>
              {['Shopee', 'Mercado Livre', 'Amazon'].map((x) => (
                <p key={x}>
                  {x} <span className="tag pending">Não conectado</span>
                </p>
              ))}
            </div>
          )}

          {tab === 'Resultados' && (
            <div className="panel">
              <h2>Desempenho</h2>
              <p className="muted">
                Cliques, vendas atribuídas e comissões serão exibidos quando
                as plataformas fornecerem dados por API ou relatório autorizado.
              </p>
              <div className="notice">
                Não estimamos nem inventamos comissões. Os valores serão
                alimentados por dados reais.
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
