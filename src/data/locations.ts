export const quizLocations = [
  {
    id: "kitchen",
    name: "Future Food Kitchen",
   // coords: { lat: 52.455125636924116,  lon: 13.525380341575566}, 
   coords: { lat: 52.540636660690225, lon: 13.391817612557453 },
   radius: 40,   

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
    coords: { lat: 54.455125636924116,  lon: 13.525380341575566}, 
  //lat: 52.526675994617136, lon: 13.360365790617525 zuhause 
  // zuhause 2 lat: 52.526589996755135, lon: 13.360429487398113
    radius: 15, 

    features: {
      quiz: {
        file: "quiz_algen.json",
      },
      puzzle: {
        image: "/static/images/puzzle/algenpuzzle.jpg",
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
    coords: { lat: 52.455111227730356, lon: 13.525546761324394  },
  //  coords: { lat: 52.45510590524545, lon: 13.525163019961198  },

    radius: 30, 

    features: {
      quiz: {
        file: "quiz_quellen.json",
      },
    
    puzzle: {
      image: "/static/images/puzzle/qualle.png", 
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
    
   coords: { lat: 52.45639953688056, lon: 13.525978466276289 },
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