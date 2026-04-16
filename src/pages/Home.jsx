import { useState } from "react";
import Puntaje from "./Puntaje";
import Planning from "./Planning";
import Vacaciones from "./Vacaciones";
import Horas from "./Horas";
import Fotos from "./Fotos";
import Quimicos from "./Quimicos";
import Demandas from "./Demandas";

export default function Home({ empleado, onLogout }) {
  const [tab, setTab] = useState("puntaje");

  const tabs = [
    { id:"puntaje", icon:"👆", label:"Puntaje" },
    { id:"planning", icon:"📅", label:"Planning" },
    { id:"horas", icon:"⏱️", label:"Horas" },
    { id:"vacaciones", icon:"🌴", label:"Vacaciones" },
    { id:"fotos", icon:"📷", label:"Fotos" },
    { id:"quimicos", icon:"🧪", label:"Químicos" },
    { id:"demandas", icon:"📦", label:"Demandas" },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#f5f7fa",display:"flex",flexDirection:"column"}}>
      <div style={{background:"#1a3a6b",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{color:"#fff",fontWeight:500,fontSize:15}}>👋 {empleado.nombre}</div>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:11,marginTop:2}}>
            {empleado.planta ? `📍 ${empleado.planta}` : "SAMJUNG Portal"}
          </div>
        </div>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",padding:"6px 12px",borderRadius:8,fontSize:12,cursor:"pointer"}}>Salir</button>
      </div>

      <div style={{flex:1,overflowY:"auto",paddingBottom:70}}>
        {tab==="puntaje"&&<Puntaje empleado={empleado}/>}
        {tab==="planning"&&<Planning empleado={empleado}/>}
        {tab==="horas"&&<Horas empleado={empleado}/>}
        {tab==="vacaciones"&&<Vacaciones empleado={empleado}/>}
        {tab==="fotos"&&<Fotos empleado={empleado}/>}
        {tab==="quimicos"&&<Quimicos empleado={empleado}/>}
        {tab==="demandas"&&<Demandas empleado={empleado}/>}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"0.5px solid #eee",display:"flex",boxShadow:"0 -2px 10px rgba(0,0,0,0.08)",overflowX:"auto"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,minWidth:50,padding:"8px 0 6px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:9,color:tab===t.id?"#1a3a6b":"#aaa",fontWeight:tab===t.id?600:400}}>{t.label}</span>
            {tab===t.id&&<div style={{width:16,height:2,background:"#1a3a6b",borderRadius:2}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}