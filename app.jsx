// Духовная линия — Кабинет батюшки — Шаг 4: Профиль прихода
const { useState } = React;

const Badge = ({ children, className="" }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${className}`}>{children}</span>
);
const Section = ({ title, children, right, muted }) => (
  <section className={`rounded-2xl shadow p-5 ${muted ? "bg-gray-50" : "bg-white"}`}>
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {right}
    </div>
    {children}
  </section>
);

// Моки
const mockPriest = { id: "p-1", fullName: "о. Иоанн Собирательный", email: "ioann@example.org", status: "pending" };
const mockParish  = { churchName: "Ваш храм", location: "", description: "", priestPhoto: null, churchPhoto: null };

const fileToDataUrl = (file) => new Promise((res, rej) => {
  const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(file);
});

function ParishProfileForm({ parish, onSave, canEditMedia }) {
  const [draft, setDraft] = useState({ ...parish });
  const onFile = async (e, key) => {
    const f = e.target.files?.[0]; if (!f) return;
    const data = await fileToDataUrl(f);
    setDraft(d => ({ ...d, [key]: data }));
  };
  return (
    <Section title="Профиль прихода" right={
      <button className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={() => onSave(draft)}>
        Сохранить
      </button>
    }>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <label className="text-sm">Название храма</label>
          <input className="border rounded-xl px-3 py-2" value={draft.churchName} onChange={(e)=>setDraft({ ...draft, churchName: e.target.value })} />

          <label className="text-sm">Локация</label>
          <input className="border rounded-xl px-3 py-2" value={draft.location} onChange={(e)=>setDraft({ ...draft, location: e.target.value })} />

          <label className="text-sm">Описание</label>
          <textarea className="border rounded-xl px-3 py-2 min-h-[96px]" value={draft.description} onChange={(e)=>setDraft({ ...draft, description: e.target.value })} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {draft.priestPhoto ? <img src={draft.priestPhoto} alt="Священник" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">Фото батюшки</span>}
            </div>
            <div>
              <div className="text-sm mb-1">Фото батюшки</div>
              <input type="file" accept="image/*" disabled={!canEditMedia} onChange={(e)=>onFile(e, "priestPhoto")} />
              {!canEditMedia && <div className="text-xs text-gray-500 mt-1">Доступно после одобрения.</div>}
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {draft.churchPhoto ? <img src={draft.churchPhoto} alt="Храм" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">Фото храма</span>}
            </div>
            <div>
              <div className="text-sm mb-1">Фото храма</div>
              <input type="file" accept="image/*" disabled={!canEditMedia} onChange={(e)=>onFile(e, "churchPhoto")} />
              {!canEditMedia && <div className="text-xs text-gray-500 mt-1">Доступно после одобрения.</div>}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">На этом шаге данные сохраняются только в памяти страницы (для проверки UI).</p>
    </Section>
  );
}

function PriestDashboard() {
  const [priest, setPriest] = useState(mockPriest);
  const [parish, setParish] = useState(mockParish);

  const canEditMedia = priest.status === "approved";

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-white shadow overflow-hidden flex items-center justify-center">
          {parish.priestPhoto ? (<img src={parish.priestPhoto} alt="Priest" className="w-full h-full object-cover" />) : (<span className="text-xs text-gray-400">Фото</span>)}
        </div>
        <div className="min-w-0">
          <div className="text-xl font-semibold truncate">Кабинет батюшки</div>
          <div className="text-gray-600 text-sm truncate">{priest.fullName}</div>
        </div>
        <div className="flex-1" />
        <Badge className={`border-gray-300 ${priest.status === "approved" ? "text-green-700" : priest.status === "rejected" ? "text-red-700" : "text-gray-700"}`}>
          Статус: {priest.status}
        </Badge>
      </header>

      {priest.status !== "approved" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Доступ ограничен до одобрения администратором. Загрузка фото недоступна.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <ParishProfileForm parish={parish} onSave={setParish} canEditMedia={canEditMedia} />
        </div>
        <div className="space-y-5">
          <Section title="Модерация батюшек" muted>
            <div className="flex flex-wrap items-center gap-2">
              <button className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200" onClick={()=>setPriest({ ...priest, status: "pending" })}>В ожидании</button>
              <button className="px-3 py-1.5 rounded-xl bg-green-600 text-white hover:bg-green-700" onClick={()=>setPriest({ ...priest, status: "approved" })}>Одобрить</button>
              <button className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700" onClick={()=>setPriest({ ...priest, status: "rejected" })}>Отклонить</button>
            </div>
          </Section>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-gray-500">Шаг 4 · Профиль прихода (адаптив) · Духовная линия · 2025</footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PriestDashboard />);
