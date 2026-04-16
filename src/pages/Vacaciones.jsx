import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Vacaciones({ empleado }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ fecha_inicio:"", fecha_fin:"", nota:"" });
  const [saving, setSaving] = useState(false);

  const diasUsados = empleado.dias_vacaciones_usados || 0;
  const diasTotal = empleado.dias_vacaciones_total || 0;
  const diasRestantes = diasTotal - diasUsados;

  useEffect(() => { fetchSolicitudes(); }, []);

  const fetchSolicitudes = async () => {
    setLoading(true);
    const { data } = await supabase.from("empleados_vacaciones")
      .select("*").eq("empleado_id", empleado.id)
      .order("created_at", { ascending: false });
    if(data) setSolicitudes(data);
    setLoading(false);
  };

  const calcDias = () => {
    if(!form.fecha_inicio||!form.fecha_fin) return 0;
    const diff = new Date(form.fecha_fin) - new Date(form.fecha_inicio);
    return Math.max(0, Math.ceil(diff/86400000)+1);
  };

  const saveSolicitud = async () => {
    if(!form.fecha_inicio||!form.fecha_fin) return alert("Selecciona las fechas");
    setSaving(true);
    const dias = calcDias();
    const { data } = await supabase.from("empleados_vacaciones").insert([{
      empleado_id: empleado.id, ...form, dias, status:"Pendiente"
    }]).select().single();
    if(data){ setSolicitudes(prev=>[data,...prev]); setShowNew(false); setForm({fecha_inicio:"",fecha_fin:"",nota:""}); }
    setSaving(false);
  };

  const fmtFecha = (f) => { if(!f) return ""; const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; };
  const statusColor = {"Pendiente":["#fff8e6","#854f0b"],"Aprobada":["#eaf3de","#3b6d11"],"Rechazada":["#fcebeb","#a32d2d"]};

  if(loading) return <div style={{padding:40,textAlign:"center",color:"#888"}}>⏳</div>;

  return (
    <div style={{padding:20}}>
      <div style={{fontSize:11,fontWeight:500,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:16}}>Mis vacaciones</div>

      {/* Contador dias */}
      <div style={{background:"#1a3a6b",borderRadius:14,padding:20,marginBottom:16,display:"flex",justifyContent:"space-around",textAlign:"center"}}>
        <div>
          <div style={{fontSize:28,fontWeight:"bold",color:"#fff"}}>{diasRestantes}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>Días disponibles</div>
        </div>
        <div style={{width:1,background:"rgba(255,255,255,0.2)"}}/>
        <div>
          <div style={{fontSize:28,fontWeight:"bold",color:"#fff"}}>{diasUsados}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>Días usados</div>
        </div>
        <div style={{width:1,background:"rgba(255,255,255,0.2)"}}/>
        <div>
          <div style={{fontSize:28,fontWeight:"bold",color:"#fff"}}>{diasTotal}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>Total</div>
        </div>
      </div>

      <button onClick={()=>setShowNew(true)} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:"#1d9e75",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",marginBottom:16}}>
        + Solicitar vacaciones
      </button>

      {solicitudes.map(s=>(
        <div key={s.id} style={{background:"#fff",borderRadius:14,padding:16,marginBottom:10,boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:500}}>{fmtFecha(s.fecha_inicio)} – {fmtFecha(s.fecha_fin)}</div>
            <span style={{background:statusColor[s.status]?.[0]||"#eee",color:statusColor[s.status]?.[1]||"#555",fontSize:10,padding:"2px 8px",borderRadius:8,fontWeight:500}}>{s.status}</span>
          </div>
          <div style={{fontSize:12,color:"#888"}}>{s.dias} día{s.dias!==1?"s":""}</div>
          {s.nota&&<div style={{fontSize:12,color:"#555",marginTop:4}}>{s.nota}</div>}
        </div>
      ))}

      {showNew&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100}}>
          <div style={{background:"#fff",borderRadius:"16px 16px 0 0",width:"100%",maxWidth:480,padding:24}}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:16}}>Solicitar vacaciones</div>
            <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Fecha inicio</label>
            <input type="date" value={form.fecha_inicio} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,marginBottom:12}}/>
            <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Fecha fin</label>
            <input type="date" value={form.fecha_fin} onChange={e=>setForm({...form,fecha_fin:e.target.value})} style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,marginBottom:12}}/>
            {calcDias()>0&&<div style={{fontSize:13,color:"#1a3a6b",fontWeight:500,marginBottom:12}}>📅 {calcDias()} días solicitados</div>}
            <label style={{fontSize:11,color:"#888",display:"block",marginBottom:4}}>Nota (opcional)</label>
            <textarea value={form.nota} onChange={e=>setForm({...form,nota:e.target.value})} rows={2} placeholder="Motivo o comentario..." style={{width:"100%",padding:"10px",borderRadius:8,border:"0.5px solid #ddd",fontSize:13,marginBottom:16,resize:"none"}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={saveSolicitud} disabled={saving} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:"#1a3a6b",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer"}}>{saving?"...":"Enviar solicitud"}</button>
              <button onClick={()=>setShowNew(false)} style={{flex:1,padding:"12px",borderRadius:10,border:"0.5px solid #ddd",background:"#fff",fontSize:14,cursor:"pointer"}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}