"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  layout: { id: string; name: string; description: string | null } | null;
  sizes: Array<{
    id: string;
    label: string;
    sortOrder: number;
    bust: number;
    waist: number;
    hip: number;
    length: number;
    sleeve: number;
    notes: string | null;
  }>;
};

type FormSize = {
  label: string;
  sortOrder: string;
  bust: string;
  waist: string;
  hip: string;
  length: string;
  sleeve: string;
  notes: string;
};

type FormState = {
  id: string | null;
  name: string;
  description: string;
  imagePath: string;
  layoutName: string;
  layoutDescription: string;
  sizes: FormSize[];
};

const emptySize = (): FormSize => ({
  label: "M",
  sortOrder: "1",
  bust: "100",
  waist: "80",
  hip: "104",
  length: "65",
  sleeve: "24",
  notes: "",
});

const emptyForm = (): FormState => ({
  id: null,
  name: "",
  description: "",
  imagePath: "",
  layoutName: "Layout padrão",
  layoutDescription: "",
  sizes: [emptySize()],
});

function mapProductToForm(product: CatalogProduct): FormState {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    imagePath: product.imagePath ?? "",
    layoutName: product.layout?.name ?? "Layout padrão",
    layoutDescription: product.layout?.description ?? "",
    sizes:
      product.sizes.length > 0
        ? product.sizes.map((size) => ({
            label: size.label,
            sortOrder: String(size.sortOrder),
            bust: String(size.bust),
            waist: String(size.waist),
            hip: String(size.hip),
            length: String(size.length),
            sleeve: String(size.sleeve),
            notes: size.notes ?? "",
          }))
        : [emptySize()],
  };
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function ProductCatalogClient({ initialProducts }: { initialProducts: CatalogProduct[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [selectedId, setSelectedId] = useState<string>(initialProducts[0]?.id ?? "new");
  const [form, setForm] = useState<FormState>(initialProducts[0] ? mapProductToForm(initialProducts[0]) : emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedId) ?? null,
    [products, selectedId]
  );

  const totalSizes = products.reduce((acc, product) => acc + product.sizes.length, 0);
  const hasSelection = selectedId !== "new" && Boolean(selectedProduct);

  function resetToNew() {
    setSelectedId("new");
    setForm(emptyForm());
    setError(null);
    setMessage(null);
  }

  function handleSelectProduct(id: string) {
    setSelectedId(id);
    setError(null);
    setMessage(null);
    if (id === "new") {
      setForm(emptyForm());
      return;
    }
    const product = products.find((item) => item.id === id);
    if (product) setForm(mapProductToForm(product));
  }

  function updateSize(index: number, key: keyof FormSize, value: string) {
    setForm((current) => ({
      ...current,
      sizes: current.sizes.map((size, sizeIndex) => (sizeIndex === index ? { ...size, [key]: value } : size)),
    }));
  }

  async function refreshProducts(nextSelectedId?: string) {
    const refreshed = (await fetch("/api/products", { cache: "no-store" }).then((res) => res.json())) as {
      products: CatalogProduct[];
    };
    setProducts(refreshed.products);
    if (refreshed.products.length === 0) {
      resetToNew();
      return;
    }

    const idToSelect = nextSelectedId ?? selectedId;
    const savedProduct = refreshed.products.find((item) => item.id === idToSelect) ?? refreshed.products[0];
    setSelectedId(savedProduct.id);
    setForm(mapProductToForm(savedProduct));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads/product-image", { method: "POST", body });
      if (!response.ok) throw new Error("Falha ao enviar imagem.");
      const data = (await response.json()) as { path: string };
      setForm((current) => ({ ...current, imagePath: data.path }));
      setMessage("Imagem salva localmente com sucesso.");
      event.target.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      name: form.name,
      description: form.description || null,
      imagePath: form.imagePath || null,
      layout: {
        name: form.layoutName,
        description: form.layoutDescription || null,
      },
      sizes: form.sizes.map((size, index) => ({
        label: size.label,
        sortOrder: Number(size.sortOrder || index + 1),
        bust: Number(size.bust),
        waist: Number(size.waist),
        hip: Number(size.hip),
        length: Number(size.length),
        sleeve: Number(size.sleeve),
        notes: size.notes || null,
      })),
    };

    try {
      const response = await fetch(form.id ? `/api/products/${form.id}` : "/api/products", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Não foi possível salvar o produto.");
      }

      setMessage(form.id ? "Produto atualizado com sucesso." : "Produto criado com sucesso.");
      router.refresh();
      const refreshed = (await fetch("/api/products", { cache: "no-store" }).then((res) => res.json())) as {
        products: CatalogProduct[];
      };
      setProducts(refreshed.products);
      const savedProduct =
        refreshed.products.find((item) => item.name === form.name && item.layout?.name === form.layoutName) ??
        refreshed.products[0] ??
        null;
      if (savedProduct) {
        setSelectedId(savedProduct.id);
        setForm(mapProductToForm(savedProduct));
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form.id || deleting) return;
    const confirmed = window.confirm(`Excluir o produto \"${form.name}\"? Essa ação não pode ser desfeita.`);
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/products/${form.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Não foi possível excluir o produto.");
      }

      setMessage("Produto excluído com sucesso.");
      await refreshProducts("new");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Erro inesperado ao excluir.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:rounded-[36px]">
        <div className="border-b border-slate-100 bg-white/80 px-4 py-5 backdrop-blur-sm sm:px-6 lg:px-8 2xl:px-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,560px)] xl:items-end">
            <div className="max-w-4xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-purple-600">
                <span className="h-2 w-2 rounded-full bg-[#9B6CFF]" />
                PROVEI // Catálogo de produtos
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl 2xl:text-6xl">
                  Ferramenta demo com cadastro real de produtos.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  Escolha um produto salvo ou cadastre uma nova peça, mantendo imagem local, layout e grades de tamanhos persistidos no banco.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:max-w-[560px] xl:justify-self-end">
              <StatCard label="Produtos" value={String(products.length).padStart(2, "0")} hint="cadastros ativos" />
              <StatCard label="Tamanhos" value={String(totalSizes).padStart(2, "0")} hint="linhas no banco" />
              <StatCard label="Modo" value={hasSelection ? "Edição" : "Novo"} hint={hasSelection ? "produto aberto" : "novo cadastro"} />
            </div>
          </div>
        </div>

        <div className="grid gap-5 bg-slate-50/70 p-4 sm:p-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:p-8 2xl:grid-cols-[380px_minmax(0,1fr)] 2xl:p-10">
          <aside className="space-y-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-hidden 2xl:p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Selecionar produto</p>
                  <p className="text-xs text-slate-500">Escolha um item salvo ou abra um novo.</p>
                </div>
                <button type="button" onClick={resetToNew} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600">
                  Novo
                </button>
              </div>

              <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:ring-4 focus:ring-purple-100" value={selectedId} onChange={(event) => handleSelectProduct(event.target.value)}>
                <option value="new">Novo produto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Produtos cadastrados</p>
                  <p className="text-xs text-slate-500">Clique para carregar no formulário.</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-500">{products.length}</span>
              </div>

              <div className="space-y-3 lg:max-h-[calc(100vh-22rem)] lg:overflow-y-auto lg:pr-1">
                {products.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">Nenhum produto cadastrado ainda.</div> : null}
                {products.map((product) => {
                  const isActive = selectedId === product.id;
                  return (
                    <button key={product.id} type="button" onClick={() => handleSelectProduct(product.id)} className={`group flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition duration-200 2xl:p-4 ${isActive ? "border-purple-200 bg-purple-50 shadow-[0_10px_30px_rgba(155,108,255,0.10)]" : "border-slate-100 bg-white hover:border-purple-100 hover:bg-purple-50/50"}`}>
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 2xl:h-20 2xl:w-20">
                        {product.imagePath ? <img src={product.imagePath} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-[0.16em] text-slate-300">Sem imagem</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{product.name}</p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{product.description ?? "Sem descrição."}</p>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-500">{product.sizes.length}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400"><span>{product.layout?.name ?? "Sem layout"}</span><span>•</span><span>{formatDate(product.updatedAt)}</span></div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="grid gap-5 2xl:grid-cols-[minmax(720px,1fr)_460px]">
            <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 2xl:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                  <span>Nome do produto</span>
                  <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-purple-300 focus:ring-4 focus:ring-purple-100" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Camiseta Clássica" />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                  <span>Descrição</span>
                  <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-purple-300 focus:ring-4 focus:ring-purple-100" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Resumo do produto e contexto da demonstração" />
                </label>

                <div className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                  <span>Imagem principal</span>
                  <div className="rounded-3xl border border-dashed border-purple-200 bg-purple-50/50 p-4">
                    <label htmlFor="product-image-upload" className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-purple-100 bg-white px-4 py-4 transition hover:border-purple-300 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">Enviar imagem da peça</p>
                        <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP ou SVG — salva localmente em <code>public/uploads/products</code>.</p>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-full bg-provei-gradient px-4 py-2 text-xs font-semibold text-white shadow-sm">Escolher arquivo</span>
                    </label>
                    <input id="product-image-upload" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleImageUpload} className="sr-only" />
                    {uploading ? <p className="mt-3 text-xs text-purple-600">Enviando imagem...</p> : null}
                    {form.imagePath ? <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"><img src={form.imagePath} alt={form.name || "Produto"} className="h-44 w-full object-cover lg:h-40 2xl:h-52" /></div> : null}
                  </div>
                </div>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Layout vinculado</span>
                  <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-purple-300 focus:ring-4 focus:ring-purple-100" value={form.layoutName} onChange={(event) => setForm((current) => ({ ...current, layoutName: event.target.value }))} placeholder="Ex.: Grade padrão adulto" />
                </label>

                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Descrição do layout</span>
                  <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-purple-300 focus:ring-4 focus:ring-purple-100" value={form.layoutDescription} onChange={(event) => setForm((current) => ({ ...current, layoutDescription: event.target.value }))} placeholder="Ex.: estrutura base com medidas corporais" />
                </label>
              </div>

              <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-sm font-semibold text-slate-900">Tabela de tamanhos</p><p className="text-xs text-slate-500">Cada linha vira um registro separado no banco.</p></div>
                  <button type="button" onClick={() => setForm((current) => ({ ...current, sizes: [...current.sizes, emptySize()] }))} className="rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-600 transition hover:bg-purple-50">Adicionar tamanho</button>
                </div>

                <div className="grid gap-3 md:hidden">
                  {form.sizes.map((size, index) => (
                    <div key={`${index}-${size.label}`} className="rounded-3xl border border-slate-100 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div><p className="text-sm font-semibold text-slate-900">Tamanho {size.label || index + 1}</p><p className="text-xs text-slate-500">Linha {index + 1}</p></div>
                        <button type="button" onClick={() => setForm((current) => ({ ...current, sizes: current.sizes.filter((_, rowIndex) => rowIndex !== index) }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 transition hover:bg-white hover:text-slate-700">Remover</button>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.label} onChange={(event) => updateSize(index, "label", event.target.value)} placeholder="Tamanho" />
                        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.sortOrder} onChange={(event) => updateSize(index, "sortOrder", event.target.value)} placeholder="Ordem" />
                        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.bust} onChange={(event) => updateSize(index, "bust", event.target.value)} placeholder="Busto" />
                        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.waist} onChange={(event) => updateSize(index, "waist", event.target.value)} placeholder="Cintura" />
                        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.hip} onChange={(event) => updateSize(index, "hip", event.target.value)} placeholder="Quadril" />
                        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.length} onChange={(event) => updateSize(index, "length", event.target.value)} placeholder="Compr." />
                        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.sleeve} onChange={(event) => updateSize(index, "sleeve", event.target.value)} placeholder="Manga" />
                        <input className="col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.notes} onChange={(event) => updateSize(index, "notes", event.target.value)} placeholder="Observação" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-[940px] w-full border-separate border-spacing-y-3 text-sm">
                    <thead className="text-left text-slate-400"><tr><th className="px-3 py-1">Tamanho</th><th className="px-3 py-1">Ordem</th><th className="px-3 py-1">Busto</th><th className="px-3 py-1">Cintura</th><th className="px-3 py-1">Quadril</th><th className="px-3 py-1">Compr.</th><th className="px-3 py-1">Manga</th><th className="px-3 py-1">Observação</th><th className="px-3 py-1" /></tr></thead>
                    <tbody>
                      {form.sizes.map((size, index) => (
                        <tr key={`${index}-${size.label}`} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                          <td className="px-2 py-2"><input className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.label} onChange={(event) => updateSize(index, "label", event.target.value)} /></td>
                          <td className="px-2 py-2"><input className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.sortOrder} onChange={(event) => updateSize(index, "sortOrder", event.target.value)} /></td>
                          <td className="px-2 py-2"><input className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.bust} onChange={(event) => updateSize(index, "bust", event.target.value)} /></td>
                          <td className="px-2 py-2"><input className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.waist} onChange={(event) => updateSize(index, "waist", event.target.value)} /></td>
                          <td className="px-2 py-2"><input className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.hip} onChange={(event) => updateSize(index, "hip", event.target.value)} /></td>
                          <td className="px-2 py-2"><input className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.length} onChange={(event) => updateSize(index, "length", event.target.value)} /></td>
                          <td className="px-2 py-2"><input className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.sleeve} onChange={(event) => updateSize(index, "sleeve", event.target.value)} /></td>
                          <td className="px-2 py-2"><input className="w-52 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" value={size.notes} onChange={(event) => updateSize(index, "notes", event.target.value)} /></td>
                          <td className="px-2 py-2"><button type="button" onClick={() => setForm((current) => ({ ...current, sizes: current.sizes.filter((_, rowIndex) => rowIndex !== index) }))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 transition hover:bg-white hover:text-slate-700">Remover</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
              {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={saving} className="rounded-full bg-provei-gradient px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70">{saving ? "Salvando..." : form.id ? "Atualizar produto" : "Salvar produto"}</button>
                {form.id ? <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70">{deleting ? "Excluindo..." : "Excluir produto"}</button> : null}
                <button type="button" onClick={resetToNew} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Limpar formulário</button>
              </div>
            </form>

            <aside className="space-y-5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 2xl:sticky 2xl:top-28 2xl:max-h-[calc(100vh-8rem)] 2xl:self-start 2xl:overflow-y-auto 2xl:p-7">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold text-slate-900">Preview da ferramenta</p><p className="text-xs text-slate-500">Aparência próxima do case PROVEI.</p></div>
                  <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-[11px] font-medium text-purple-600">Demo</span>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">PROVEI style / widget</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div><p className="text-lg font-semibold text-slate-900">{form.name || "Selecione ou crie um produto"}</p><p className="mt-1 text-sm text-slate-500">{form.layoutName}</p></div>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-500">{form.sizes.length} tamanhos</span>
                    </div>
                  </div>

                  <div className="grid gap-4 p-4">
                    <div className="relative overflow-hidden rounded-3xl border border-purple-100 bg-purple-50">
                      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_center,rgba(155,108,255,0.22),transparent_70%)]" />
                      {form.imagePath ? <img src={form.imagePath} alt={form.name || "Produto"} className="relative h-[280px] w-full object-cover sm:h-[360px] xl:h-[390px] 2xl:h-[440px]" /> : <div className="relative flex h-[260px] items-center justify-center px-6 text-center text-sm text-slate-400 sm:h-[360px] xl:h-[390px] 2xl:h-[440px]">A imagem principal aparece aqui.</div>}
                    </div>

                    <div className="space-y-3 text-sm text-slate-600">
                      <p>{form.description || "Sem descrição ainda."}</p>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Layout</p><p className="mt-2 font-semibold text-slate-900">{form.layoutName}</p><p className="mt-1 text-xs leading-5 text-slate-500">{form.layoutDescription || "Nenhuma descrição de layout."}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div><p className="text-sm font-semibold text-slate-900">Resumo do registro</p><p className="text-xs text-slate-500">O que está aberto no formulário.</p></div>
                <dl className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-white p-3"><dt className="text-slate-400">Produto</dt><dd className="mt-1 font-semibold text-slate-900">{selectedProduct?.name ?? "Novo produto"}</dd></div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-3"><dt className="text-slate-400">Layout</dt><dd className="mt-1 font-semibold text-slate-900">{selectedProduct?.layout?.name ?? form.layoutName}</dd></div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-3"><dt className="text-slate-400">Tamanhos</dt><dd className="mt-1 font-semibold text-slate-900">{selectedProduct?.sizes.length ?? form.sizes.length} linhas</dd></div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-3"><dt className="text-slate-400">Atualizado</dt><dd className="mt-1 font-semibold text-slate-900">{selectedProduct ? formatDate(selectedProduct.updatedAt) : "Agora"}</dd></div>
                </dl>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
