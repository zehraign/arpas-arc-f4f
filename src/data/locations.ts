export const quizLocations = [
  {
    id: "kitchen",
    name: "Future Food Kitchen",
    coords: { lat: 52.52667795846103, lon: 13.36035865876291 },
    radius: 100, // richtige coords: { lat: 52.45554951375966, lon: 13.52518413859404 }, 

    features: {
      quiz: {
        file: "quiz_kitchen.json",
      },memory: true,
    },

    button: {
      label: "Future-Food-Quiz 🍽️",
      color: "#149085",
    },
    infoId: "kitchen", // InfoPlanes
  },

  {
    id: "algen",
    name: "Gebäude A – Algenlabor",
    //coords: { lat: 52.540636660690225, lon: 13.391817612557453 },
<<<<<<< HEAD
    coords: { lat: 52.544440636660690225, lon: 13.3918176125574533 },
  //52.52667795846103, 13.36035865876291 zuhause
=======
    coords: { lat: 52.451405444313316, lon: 13.477409860925572 },
  //52.52668739066162, 13.36037664808089 zuhause
>>>>>>> 4577f848db46ae6dd0427717c9b120a759e8564f
    radius: 100, // lat: 52.540636660690225, lon: 13.391817612557453 

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
      color: "#3c8c40" 
    },
    infoId: "algen", // InfoPlane
  },

  {
    id: "quallen",
    name: "Bibliothek – Quallenlabor",
   //s coords: { lat: 52.45510590524545, lon: 13.525163019961198 },
    coords: { lat: 52.45510590524545, lon: 13.525163019961198 },
  
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