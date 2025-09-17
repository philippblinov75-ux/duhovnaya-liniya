
// Духовная линия — Шаг 6: убрали «Сохранить», всё сохраняется на лету
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
const initialPriest = { id: "p-1", fullName: "о. Иоанн Собирательный", email: "ioann@example.org" };
const initialParish = { churchName: "", location: "", description: "", priestPhoto: null, churchPhoto: null };

const fileToDataUrl = (file) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(file); });

function ParishProfileForm({ parish, setParish, canEditMedia }) {
  // Любая правка поля сразу кладём в setParish (нет кнопки «Сохранить»)
  const onChange = (key, value) => setParish(prev => ({ ...prev, [key]: value }));
  const onFile = async (e, key) => {
    const f = e.target.files?.[0]; if (!f) return;
    const data = await fileToDataUrl(f);
    onChange(key, data);
  };

  return (
    <Section title="Профиль прихода">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <label className="text-sm">Название храма</label>
          <input className="border rounded-xl px-3 py-2" value={parish.churchName} onChange={(e)=>onChange("churchName", e.target.value)} />

          <label className="text-sm">Локация</label>
          <input className="border rounded-xl px-3 py-2" value={parish.location} onChange={(e)=>onChange("location", e.target.value)} />

          <label className="text-sm">Описание</label>
          <textarea className="border rounded-xl px-3 py-2 min-h-[96px]" value={parish.description} onChange={(e)=>onChange("description", e.target.value)} />
          <div className="text-xs text-gray-500">Правки сохраняются автоматически.</div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {parish.priestPhoto ? <img src={parish.priestPhoto} alt="Священник" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">Фото батюшки</span>}
            </div>
            <div>
              <div className="text-sm mb-1">Фото батюшки</div>
              <input type="file" accept="image/*" disabled={!canEditMedia} onChange={(e)=>onFile(e, "priestPhoto")} />
              {!canEditMedia && <div className="text-xs text-gray-500 mt-1">Доступно после одобрения.</div>}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {parish.churchPhoto ? <img src={parish.churchPhoto} alt="Храм" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">Фото храма</span>}
            </div>
            <div>
              <div className="text-sm mb-1">Фото храма</div>
              <input type="file" accept="image/*" disabled={!canEditMedia} onChange={(e)=>onFile(e, "churchPhoto")} />
              {!canEditMedia && <div className="text-xs text-gray-500 mt-1">Доступно после одобрения.</div>}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function PriestDashboard() {
  const [priest] = useState(initialPriest);
  const [parish, setParish] = useState(initialParish);

  // Статус анкеты: draft | pending | approved | rejected
  const [status, setStatus] = useState("draft");
  const [modComment, setModComment] = useState("");
  const [adminInput, setAdminInput] = useState("");

  const canEditMedia = status === "approved";

  // Проверяем обязательные поля прямо при клике «Отправить на модерацию»
  const sendToModeration = () => {
    if (!parish.churchName.trim() || !parish.description.trim()) {
      alert("Заполните минимум: название храма и описание.");
      return;
    }
    setStatus("pending"); setModComment("");
  };

  const resendAfterFix = () => { setStatus("pending"); };

  // Демонстрационная админка на той же странице
  const adminApprove = () => { setStatus("approved"); setModComment(""); };
  const adminReject  = () => { setStatus("rejected"); setModComment(adminInput || "Недостаточно данных"); };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <header className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-white shadow overflow-hidden flex items-center justify-center"><span className="text-xs text-gray-400">Фото</span></div>
        <div className="min-w-0">
          <div className="text-xl font-semibold truncate">Кабинет батюшки</div>
          <div className="text-gray-600 text-sm truncate">{priest.fullName}</div>
        </div>
        <div className="flex-1" />
        <Badge className={`border-gray-300 ${status === "approved" ? "text-green-700" : status === "rejected" ? "text-red-700" : "text-gray-700"}`}>Статус: {status}</Badge>
      </header>

      {status === "pending" && (<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Анкета отправлена на модерацию. Ожидайте решения администратора.</div>)}
      {status === "rejected" && (<div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">Отклонено модератором. Причина: <b>{modComment || "без комментария"}</b></div>)}
      {status !== "approved" && status !== "pending" && (<div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">Заполните анкету и отправьте на модерацию. После одобрения станут доступны загрузка фото и рассылки.</div>)}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <ParishProfileForm parish={parish} setParish={setParish} canEditMedia={canEditMedia} />

          {/* Единственная кнопка действий для батюшки */}
          <Section title="Действия" muted>
            {status === "draft" && (
              <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={sendToModeration}>
                Отправить на модерацию
              </button>
            )}
            {status === "rejected" && (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-700">Исправьте данные и отправьте снова.</div>
                <button className="w-fit px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={resendAfterFix}>
                  Исправил — отправить снова
                </button>
              </div>
            )}
            {status === "approved" && (<div className="text-sm text-green-700">Страница одобрена. Фото и дальнейшие функции доступны.</div>)}
            {status === "pending" && (<div className="text-sm text-gray-600">Ожидаем решение модератора…</div>)}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Панель модератора (демо)" muted>
            <div className="text-sm text-gray-600 mb-2">Для демонстрации админ на этой же странице.</div>
            <label className="text-sm block mb-1">Комментарий при отклонении</label>
            <textarea className="border rounded-xl px-3 py-2 w-full min-h-[80px]" placeholder="Например: укажите полное название прихода…" value={adminInput} onChange={(e)=>setAdminInput(e.target.value)} />
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button className="px-3 py-1.5 rounded-xl bg-green-600 text-white hover:bg-green-700" onClick={adminApprove} disabled={status!=="pending" && status!=="draft"}>Одобрить</button>
              <button className="px-3 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700" onClick={adminReject} disabled={status!=="pending" && status!=="draft"}>Отклонить</button>
            </div>
            <div className="text-xs text-gray-500 mt-2">Кнопки активны для статусов draft/pending.</div>
          </Section>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-gray-500">Шаг 6 · Без кнопки «Сохранить» · Духовная линия · 2025</footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PriestDashboard />);
