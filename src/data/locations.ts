export const quizLocations = [
  {
    id: "kitchen",
    name: "Future Food Kitchen",
    coords: { lat: 52.45554951375966, lon: 13.52518413859404 },
    radius: 50,

    features: {
      quiz: {
        file: "quiz_kitchen.json",
      },
    },

    button: {
      label: "Future-Food-Quiz 🍽️",
      color: "#2BB0A6",
    },
    infoId: "kitchen", // InfoPlanes
  },

  {
    id: "algen",
    name: "Gebäude A – Algenlabor",
    coords: { lat: 52.540636660690225, lon: 13.391817612557453 },//52.52667793495367, 13.360375671644709 zuhause
    radius: 100, // lat: 52.540636660690225, lon: 13.391817612557453 richtige kooridaten 

    features: {
      quiz: {
        file: "quiz_algen.json",
      },
      puzzle: {
        image: "/static/images/puzzle/mein-puzzle-bild.png",
      },
    },

    button: {
      label: "Algen-Quiz 🌱",
      color: "#3c8c40" 
    },
    infoId: "algen", // InfoPlane
  },

  {
    id: "quallen",
    name: "Bibliothek – Quallenlabor",
    coords: { lat: 52.52667793495367, lon: 13.360375671644709 }, // richtige lat: 52.455524445488415, lon: 13.524730308877778 }
    radius: 100, 

    features: {
      quiz: {
        file: "quiz_quellen.json",
      },
    
    puzzle: {
      image: "/static/images/puzzle/qualle.png", //  NEU
    },
  },

    button: {
      label: "Quallen-Quiz 🪼",
      color: "#369e9e",
    },
    infoId: "quallen",
  },

  {
    id: "salzpflanzen",
    name: "Gebäude C – Salzpflanzenlabor",
    coords: { lat: 52.45639953688056, lon: 13.525978466276289 },
    radius: 50,

    features: {
      quiz: {
        file: "quiz_salzpflanzen.json",
      },
    },

    button: {
      label: "Salzpflanzen-Quiz 🌿",
      color: "#75a839",
    },
    infoId: "salzpflanzen",
  },

  {
    id: "grillen",
    name: "Gebäude E – Grillenlabor",
    coords: { lat: 52.540636660690225, lon: 13.391817612557453 },
    radius: 50,

    features: {
      quiz: {
        file: "quiz_grillen.json",
      },
    },

    button: {
      label: "Grillen-Quiz 🦗",
      color: "#9c6225",
    },
    infoId: "grillen",
  },
];


// Gebäude H 30 m hat geklappt  
// Besprechungs raum  coords: { lat: 52.45513200191987, lon: 13.52537978909434 },  
  
// 50 m hat nur geklappt 
// Meine Koordinaten coords: { lat: 52.540636660690225, lon: 13.391817612557453 },  


