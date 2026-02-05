export const quizLocations = [
  {
    id: "kitchen",
    name: "Future Food Kitchen", //52.5266778505573, 13.360364159211882
    coords: { lat: 52.454925431306826, lon: 13.525137894320649},
    radius: 10, // richtige coords: { lat: 52.45554951375966, lon: 13.52518413859404 }, 

    features: {
      quiz: {
        file: "quiz_kitchen.json",
      },memory: true,
    },

    button: {
      label: "Future-Food-Quiz 🍽️",
      color: "#086159",
     
    },
    infoId: "kitchen", // InfoPlanes
  },

  {
    id: "algen", 
    name: "Gebäude A – Algenlabor",
    //coords: { lat: 52.540636660690225, lon: 13.391817612557453 },
     coords: { lat: 52.45511384294132, lon: 13.52544464354287 },
  //lat: 52.5266778505573, lon: 13.360364159211882 zuhause 
  // zuhause 2 lat: 52.526584355002946, lon: 13.360435675215633
    radius: 10, 

    features: {
      quiz: {
        file: "quiz_algen.json",
      },
      puzzle: {
        image: `${import.meta.env.BASE_URL}images/puzzle/algenpuzzle.jpg`,
      },
    },

    button: {
      label: "Algen-Quiz 🌱",
      color: "#29732d" 
    },
    infoId: "algen", // InfoPlane
  },

  {
    id: "quallen",
    name: "Bibliothek – Quallenlabor",
   //s coords: { lat: 52.45510590524545, lon: 13.525163019961198 },
    coords: { lat: 57.45510590524545, lon: 13.525163019961198  },
  
    radius: 10, 

    features: {
      quiz: {
        file: "quiz_quellen.json",
      },
    
    puzzle: {
      image: `${import.meta.env.BASE_URL}images/puzzle/qualle.png`, 
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
   
     coords: { lat: 52.455111227730356, lon:13.525546761324394  },   

    radius: 10,

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
    
   coords: { lat: 56.45639953688056, lon: 13.525978466276289 },
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
