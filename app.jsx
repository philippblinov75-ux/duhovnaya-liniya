// Духовная линия — Кабинет батюшки (MVP)
const { useState } = React;
function PriestDashboard() {
  const [status, setStatus] = useState("pending");
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Кабинет батюшки (MVP)</h1>
      <p>Статус: {status}</p>
      <button className="px-3 py-1 bg-green-500 text-white rounded"
        onClick={() => setStatus("approved")}>Одобрить</button>
      <button className="ml-2 px-3 py-1 bg-red-500 text-white rounded"
        onClick={() => setStatus("rejected")}>Отклонить</button>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<PriestDashboard />);
