export const quizLocations = [
  {
    id: "kitchen",
    name: "Future Food Kitchen",
    coords: { lat: 52.45554951375966, lon: 13.52518413859404 }, 
    radius: 50,
    quizFile: "quiz_kitchen.json",

    button: {
      label: "Future-Food-Quiz 🍽️",
      color: "#2BB0A6"
    
  },

  infoId: "kitchen", // InfoPlanes
    
  },
  { // zum testen 
    id: "algen",
    name: "Gebäude A – Algenlabor",
    coords: { lat: 52.45760819746655, lon: 13.526006690399026 },
   //gebäude H
   // coords: { lat: 52.45513200191987, lon: 13.52537978909434 }, 
    radius: 50,
    quizFile: "quiz_algen.json",

    button: {
      label: "Algen-Quiz 🌱",
      color: "#3c8c40" 
     
  },
  infoId: "algen", // InfoPlane

  },
  {
    id: "quellen",
    name: "Bibliothek – Quellenlabor",
   // coords: { lat: 52.455524445488415, lon: 13.524730308877778 },
   coords: { lat: 52.540636660690225, lon: 13.391817612557453 }, 
    radius: 50,
    quizFile: "quiz_quellen.json",

    button: {
      label: "Quallen-Quiz 🪼",
      color: "#369e9e"
  },
  infoId: "quallen",
},
  {
    id: "salzpflanzen",
    name: "Gebäude C – Salzpflanzenlabor",
    coords: { lat: 52.45639953688056, lon: 13.525978466276289 },
    radius: 50,
    quizFile: "quiz_salzpflanzen.json",

    button: {
      label: "Salzpflanzen-Quiz 🌿",
      color: "#75a839" 
  },
  infoId: "salzpflanzen",
  },
  {
    id: "grillen",
    name: "Gebäude E – Grillenlabor",
    coords: { lat: 52.455596084675975, lon: 13.526818004625984 },
    radius: 50,
    quizFile: "quiz_grillen.json",

    button: {
      label: "Grillen-Quiz 🦗",
      color: "#9c6225" 
  },
  infoId: "grillen",
  }

// Gebäude H 30 m hat geklappt  
// Besprechungs raum  coords: { lat: 52.45513200191987, lon: 13.52537978909434 },  

// 50 m hat nur geklappt 
// Meine Koordinaten duaa coords: { lat: 52.540636660690225, lon: 13.391817612557453 },  


];