import { useState } from "react";
import Puntaje from "./Puntaje";
import Planning from "./Planning";
import Vacaciones from "./Vacaciones";
import Horas from "./Horas";

export default function Home({ empleado, onLogout }) {
  const [tab, setTab] = useState("puntaje");

  const tabs = [
    { id:"puntaje", icon:"👆", label:"Puntaje" },
    { id:"planning", icon:"📅", label:"Planning" },
    { id:"horas", icon:"⏱️", label:"Horas" },
    { id:"vacaciones", icon:"🌴", label:"Vacaciones" },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#f5f7fa",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{background:"#1a3a6b",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{color:"#fff",fontWeight:500,fontSize:15}}>👋 {empleado.nombre}</div>
          <div style={{color:"rgba(255,255,255,0.6)",fontSize:11,marginTop:2}}>SAMJUNG Portal</div>
        </div>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",padding:"6px 12px",borderRadius:8,fontSize:12,cursor:"pointer"}}>
          Salir
        </button>
      </div>

      {/* Contenido */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:80}}>
        {tab==="puntaje"&&<Puntaje empleado={empleado}/>}
        {tab==="planning"&&<Planning empleado={empleado}/>}
        {tab==="horas"&&<Horas empleado={empleado}/>}
        {tab==="vacaciones"&&<Vacaciones empleado={empleado}/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"0.5px solid #eee",display:"flex",boxShadow:"0 -2px 10px rgba(0,0,0,0.08)"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"10px 0 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:20}}>{t.icon}</span>
            <span style={{fontSize:10,color:tab===t.id?"#1a3a6b":"#aaa",fontWeight:tab===t.id?600:400}}>{t.label}</span>
            {tab===t.id&&<div style={{width:20,height:2,background:"#1a3a6b",borderRadius:2}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}